import { AppLayout } from "@/components/app-layout"
import { getAdminUsers, getTasks } from "@/actions/tasks"
import TaskClient from "@/components/task-client"
import { getWorkspaceUsers } from "@/actions/workspace";

export default async function TasksPage(props: any) {

  const searchParams = await props.searchParams;
  const workspaceId = searchParams.workspace;

  const filter = {
    status: searchParams.status || "",
    priority: searchParams.priority || "",
    assignee: searchParams.assignee || "",
  }

  const tasksWithAssignees = await getTasks(workspaceId, filter);

  const adminUsers = await getAdminUsers();

  const workspaceUsers = await getWorkspaceUsers(workspaceId)

  return (
    <AppLayout>
      <TaskClient
      adminUsers={adminUsers}
      tasksWithAssignees={tasksWithAssignees}
      workspaceUsers={workspaceUsers}
      workspaceId={workspaceId}
      />
    </AppLayout>
  )
}
