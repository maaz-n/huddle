import Link from "next/link"

import { getCurrentUser } from "@/actions/auth"
import { getInvitation } from "@/actions/invitations"
import { AcceptInvitation } from "@/components/accept-invitation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { FieldDescription, FieldGroup } from "@/components/ui/field"

export const dynamic = "force-dynamic"

const MESSAGES = {
  accepted: "This invitation has already been accepted.",
  expired: "This invitation has expired. Ask the workspace owner for a new one.",
  invalid: "This invitation link is invalid.",
} as const

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const invitation = await getInvitation(token)
  const currentUser = await getCurrentUser()

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        {invitation.status === "pending" ? (
          <AcceptInvitation
            invitation={invitation}
            currentUser={currentUser}
          />
        ) : (
          <Card className="overflow-hidden p-0">
            <CardHeader>
              <img
                src={"/huddle.svg"}
                alt=""
                className="pt-7 -mb-10 mx-auto w-40 invert-85 dark:invert-0"
              />
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-6 md:p-8">
                <FieldGroup>
                  <div className="flex flex-col items-center gap-2 text-center">
                    <h1 className="text-2xl font-bold">Invitation unavailable</h1>
                    <p className="text-muted-foreground text-balance">
                      {MESSAGES[invitation.status]}
                    </p>
                  </div>
                  <Button asChild>
                    <Link href="/">Go to Huddle</Link>
                  </Button>
                  <FieldDescription className="text-center">
                    <Link href="/login">Back to login</Link>
                  </FieldDescription>
                </FieldGroup>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
