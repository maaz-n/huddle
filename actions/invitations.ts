"use server";

import { randomBytes } from "crypto";
import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  user,
  workspaceInvitations,
  workspaceMembers,
  workspaces,
} from "@/db/schema";
import { sendEmail } from "@/lib/email";
import { invitationEmail } from "@/lib/email-templates";
import { logActivity } from "@/lib/activity";
import { notifyUsers } from "@/lib/notifications";
import { requireWorkspaceAccess } from "@/lib/workspace-access";
import {
  emailSchema,
  idSchema,
  memberRoleSchema,
  tokenSchema,
  validationMessage,
} from "@/lib/validation";
import { getCurrentUser } from "./auth";
import { DEMO_MESSAGE } from "@/lib/demo";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function appUrl() {
  return process.env.BETTER_AUTH_URL || "http://localhost:3000";
}

export async function inviteMember(
  workspaceId: string,
  email: string,
  role: string,
) {
  try {
    const parsedWorkspaceId = idSchema.safeParse(workspaceId);
    const parsedRole = memberRoleSchema.safeParse(role);
    const parsedEmail = emailSchema.safeParse(email);

    if (!parsedWorkspaceId.success) {
      return {
        success: false,
        message: validationMessage(parsedWorkspaceId.error),
      };
    }
    if (!parsedRole.success) {
      return { success: false, message: validationMessage(parsedRole.error) };
    }
    if (!parsedEmail.success) {
      return { success: false, message: validationMessage(parsedEmail.error) };
    }

    const inviteEmail = parsedEmail.data.toLowerCase();
    const { user: actor, role: actorRole } = await requireWorkspaceAccess(
      parsedWorkspaceId.data,
      "admin",
    );

    if (actorRole === "admin" && parsedRole.data === "admin") {
      return { success: false, message: "Admins can only invite members" };
    }

    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.id, parsedWorkspaceId.data),
      columns: { name: true, isDemo: true },
    });
    if (!workspace) {
      return { success: false, message: "Workspace not found" };
    }
    if (workspace.isDemo) {
      return { success: false, message: DEMO_MESSAGE };
    }

    const inviter = await db.query.user.findFirst({
      where: eq(user.id, actor.id),
      columns: { name: true },
    });

    const [existingMember] = await db
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .innerJoin(user, eq(workspaceMembers.userId, user.id))
      .where(
        and(
          eq(workspaceMembers.workspaceId, parsedWorkspaceId.data),
          sql`lower(${user.email}) = ${inviteEmail}`,
        ),
      );
    if (existingMember) {
      return { success: false, message: "This user is already a member" };
    }

    const existingInvite = await db.query.workspaceInvitations.findFirst({
      where: and(
        eq(workspaceInvitations.workspaceId, parsedWorkspaceId.data),
        eq(workspaceInvitations.email, inviteEmail),
        isNull(workspaceInvitations.acceptedAt),
      ),
    });
    if (existingInvite) {
      if (existingInvite.expiresAt > new Date()) {
        return {
          success: false,
          message: "An invitation is already pending for this email",
        };
      }
      await db
        .delete(workspaceInvitations)
        .where(eq(workspaceInvitations.id, existingInvite.id));
    }

    const token = randomBytes(32).toString("hex");
    const url = `${appUrl()}/invite/${token}`;

    await db.insert(workspaceInvitations).values({
      workspaceId: parsedWorkspaceId.data,
      email: inviteEmail,
      role: parsedRole.data,
      token,
      invitedBy: actor.id,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    });

    await logActivity({
      workspaceId: parsedWorkspaceId.data,
      actorId: actor.id,
      entityType: "workspace",
      entityId: parsedWorkspaceId.data,
      action: "INVITATION_SENT",
      metadata: {
        entityName: inviteEmail,
        email: inviteEmail,
        role: parsedRole.data,
      },
    });

    const emailResult = await sendEmail({
      to: inviteEmail,
      subject: `You're invited to ${workspace.name}`,
      html: invitationEmail({
        workspaceName: workspace.name,
        inviterName: inviter?.name ?? "A teammate",
        role: parsedRole.data,
        url,
      }),
    });

    return {
      success: true,
      message: emailResult.success ? "Invitation sent" : "Invitation created",
      ...(emailResult.success ? {} : { inviteLink: url }),
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not invite member" };
  }
}

export async function getInvitation(token: string) {
  try {
    const parsedToken = tokenSchema.safeParse(token);
    if (!parsedToken.success) return { status: "invalid" as const };

    const [invite] = await db
      .select({
        id: workspaceInvitations.id,
        workspaceId: workspaceInvitations.workspaceId,
        email: workspaceInvitations.email,
        role: workspaceInvitations.role,
        expiresAt: workspaceInvitations.expiresAt,
        acceptedAt: workspaceInvitations.acceptedAt,
        workspaceName: workspaces.name,
        inviterName: user.name,
      })
      .from(workspaceInvitations)
      .innerJoin(workspaces, eq(workspaceInvitations.workspaceId, workspaces.id))
      .innerJoin(user, eq(workspaceInvitations.invitedBy, user.id))
      .where(eq(workspaceInvitations.token, parsedToken.data))
      .limit(1);

    if (!invite) return { status: "invalid" as const };
    if (invite.acceptedAt) {
      return {
        status: "accepted" as const,
        workspaceName: invite.workspaceName,
      };
    }
    if (invite.expiresAt < new Date()) {
      return {
        status: "expired" as const,
        workspaceName: invite.workspaceName,
      };
    }

    return {
      status: "pending" as const,
      token: parsedToken.data,
      workspaceId: invite.workspaceId,
      workspaceName: invite.workspaceName,
      email: invite.email,
      role: invite.role,
      inviterName: invite.inviterName,
      expiresAt: invite.expiresAt.toISOString(),
    };
  } catch (error) {
    console.error(error);
    return { status: "invalid" as const };
  }
}

export async function acceptInvitation(token: string) {
  try {
    const parsedToken = tokenSchema.safeParse(token);
    if (!parsedToken.success) {
      return { success: false, message: validationMessage(parsedToken.error) };
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        message: "Sign in to accept this invitation",
        requiresAuth: true,
      };
    }

    const invitation = await db.query.workspaceInvitations.findFirst({
      where: eq(workspaceInvitations.token, parsedToken.data),
    });
    if (!invitation) {
      return { success: false, message: "This invitation is invalid" };
    }
    if (invitation.acceptedAt) {
      return { success: false, message: "This invitation was already accepted" };
    }
    if (invitation.expiresAt < new Date()) {
      return { success: false, message: "This invitation has expired" };
    }
    if (currentUser.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return {
        success: false,
        message: `This invitation is for ${invitation.email}. Sign in with that address.`,
      };
    }

    const [existingMembership] = await db
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, invitation.workspaceId),
          eq(workspaceMembers.userId, currentUser.id),
        ),
      );
    if (existingMembership) {
      return {
        success: false,
        message: "You are already a member of this workspace",
      };
    }

    const [result] = await db.batch([
      db
        .insert(workspaceMembers)
        .values({
          workspaceId: invitation.workspaceId,
          userId: currentUser.id,
          role: invitation.role,
        })
        .returning(),
      db
        .update(workspaceInvitations)
        .set({ acceptedAt: new Date() })
        .where(
          and(
            eq(workspaceInvitations.id, invitation.id),
            isNull(workspaceInvitations.acceptedAt),
          ),
        )
        .returning(),
    ]);

    if (!result[0]) {
      return { success: false, message: "Could not accept the invitation" };
    }

    await logActivity({
      workspaceId: invitation.workspaceId,
      actorId: currentUser.id,
      entityType: "workspace",
      entityId: invitation.workspaceId,
      action: "INVITATION_ACCEPTED",
      metadata: {
        entityName: currentUser.name,
        email: invitation.email,
        role: invitation.role,
      },
    });

    if (invitation.invitedBy !== currentUser.id) {
      await notifyUsers({
        userIds: [invitation.invitedBy],
        workspaceId: invitation.workspaceId,
        type: "invitation_accepted",
        entityType: "workspace",
        entityId: invitation.workspaceId,
        title: "Invitation accepted",
        body: `${currentUser.name} joined your workspace`,
      });
    }

    return {
      success: true,
      message: "You joined the workspace",
      workspaceId: invitation.workspaceId,
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not accept the invitation" };
  }
}

export async function listInvitations(workspaceId: string) {
  try {
    const parsedWorkspaceId = idSchema.safeParse(workspaceId);
    if (!parsedWorkspaceId.success) return [];

    await requireWorkspaceAccess(parsedWorkspaceId.data, "admin");

    const invitations = await db
      .select({
        id: workspaceInvitations.id,
        email: workspaceInvitations.email,
        role: workspaceInvitations.role,
        expiresAt: workspaceInvitations.expiresAt,
      })
      .from(workspaceInvitations)
      .where(
        and(
          eq(workspaceInvitations.workspaceId, parsedWorkspaceId.data),
          isNull(workspaceInvitations.acceptedAt),
          gt(workspaceInvitations.expiresAt, new Date()),
        ),
      )
      .orderBy(desc(workspaceInvitations.createdAt));

    return invitations.map((invitation) => ({
      ...invitation,
      expiresAt: invitation.expiresAt.toISOString(),
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function revokeInvitation(
  workspaceId: string,
  invitationId: string,
) {
  try {
    const parsedWorkspaceId = idSchema.safeParse(workspaceId);
    const parsedInvitationId = idSchema.safeParse(invitationId);

    if (!parsedWorkspaceId.success) {
      return {
        success: false,
        message: validationMessage(parsedWorkspaceId.error),
      };
    }
    if (!parsedInvitationId.success) {
      return {
        success: false,
        message: validationMessage(parsedInvitationId.error),
      };
    }

    const { user: actor } = await requireWorkspaceAccess(
      parsedWorkspaceId.data,
      "admin",
    );

    const invitation = await db.query.workspaceInvitations.findFirst({
      where: and(
        eq(workspaceInvitations.id, parsedInvitationId.data),
        eq(workspaceInvitations.workspaceId, parsedWorkspaceId.data),
        isNull(workspaceInvitations.acceptedAt),
      ),
      columns: { email: true, role: true },
    });

    await db
      .delete(workspaceInvitations)
      .where(
        and(
          eq(workspaceInvitations.id, parsedInvitationId.data),
          eq(workspaceInvitations.workspaceId, parsedWorkspaceId.data),
          isNull(workspaceInvitations.acceptedAt),
        ),
      );

    if (invitation) {
      await logActivity({
        workspaceId: parsedWorkspaceId.data,
        actorId: actor.id,
        entityType: "workspace",
        entityId: parsedWorkspaceId.data,
        action: "INVITATION_REVOKED",
        metadata: {
          entityName: invitation.email,
          email: invitation.email,
          role: invitation.role,
        },
      });
    }

    return { success: true, message: "Invitation revoked" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not revoke invitation" };
  }
}
