export const dynamic = 'force-dynamic';

import { AppLayout } from "@/components/app-layout"
import { getUsers, getTasks } from "@/actions/tasks"
import TaskClient from "@/components/task-client"
import { getWorkspacesWithRoles, getWorkspaceUsers } from "@/actions/workspace";
import { redirect } from "next/navigation";
import { getCurrentUser, getUserWorkspaceRole } from "@/actions/auth";

export default async function TasksPage(props: any) {

  const searchParams = await props.searchParams;
  let workspaceId = searchParams.workspace;

  if(!workspaceId){
    const workspaces = await getWorkspacesWithRoles();
    if(workspaces.length === 0) redirect("/onboarding")
    workspaceId = workspaces[0].workspaceId;
    redirect(`/tasks?workspace=${workspaceId}`)
  }

  const filter = {
    status: searchParams.status || "",
    priority: searchParams.priority || "",
    assignee: searchParams.assignee || "",
  }

  const tasksWithAssignees = await getTasks(workspaceId, filter);

  const allUsers = await getUsers(workspaceId);

  const workspaceUsers = await getWorkspaceUsers(workspaceId);

  const currentUser = await getCurrentUser();
  if(!currentUser) return null;
  const currentUserRole = await getUserWorkspaceRole(workspaceId);

  return (
    <AppLayout>
      <TaskClient
      users={allUsers}
      tasksWithAssignees={tasksWithAssignees}
      workspaceUsers={workspaceUsers}
      workspaceId={workspaceId}
      currentUser={currentUser}
      currentUserRole={currentUserRole}
      />
    </AppLayout>
  )
}
