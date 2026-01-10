
import { AppLayout } from "@/components/app-layout"
import { getAdminUsers, getTasks } from "@/actions/tasks"
import TaskClient from "@/components/task-client"

export default async function TasksPage(props: any) {

  const searchParams = await props.searchParams;
  const workspaceId = searchParams.workspace;

  console.log(workspaceId)

  const filter = {
    status: searchParams.status || "",
    priority: searchParams.priority || "",
    assignee: searchParams.assignee || "",
  }

  const tasksWithAssignees = await getTasks(workspaceId, filter);

  const adminUsers = await getAdminUsers();

  return (
    <AppLayout>
      <TaskClient
      adminUsers={adminUsers}
      tasksWithAssignees={tasksWithAssignees}
      />
    </AppLayout>
  )
}
