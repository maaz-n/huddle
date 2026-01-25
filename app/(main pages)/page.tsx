import { AppLayout } from "@/components/app-layout"
import { TaskStatusCard } from "@/components/task-status-card"
import { ActivityLogItem } from "@/components/activity-log-item"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import UserGreeting from "@/components/user-greeting"
import { getMyTasks, getTaskStats } from "@/actions/tasks"
import { getDashboardStats, getRecentActivity } from "@/actions/activity"
import { getWorkspacesWithRoles } from "@/actions/workspace"
import { redirect } from "next/navigation"
import { requireUser } from "@/lib/authguard"

const STATUSES = [
  "todo",
  "in_review",
  "done",
] as const

export default async function DashboardPage(props: any) {

  const searchParams = await props.searchParams;
  const workspaceId = searchParams.workspace;

  if (!workspaceId) {
    const workspaces = await getWorkspacesWithRoles();
    if (workspaces.length === 0) redirect("/onboarding")
    const newWorkspaceId = workspaces[0].workspaceId;
    redirect(`/?workspace=${newWorkspaceId}`)
  }

  const tasksStatsFromDb = await getTaskStats(workspaceId);
  const normalizedStats = STATUSES.map(status => {
    const found = tasksStatsFromDb.find(t => t.status === status)

    return {
      status,
      count: found ? found.count : 0
    }
  })

  const myTasks = await getMyTasks(workspaceId);

  const recentActivity = await getRecentActivity(workspaceId);

  const { id } = await requireUser()
  const dueTasks = await getDashboardStats(id, workspaceId)

  return (
    <AppLayout>
      <div className="py-8 px-6 space-y-8">
        <UserGreeting dueTasks={dueTasks} />
        <div>
          <h2 className="text-xl font-semibold mb-4">Tasks by Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {normalizedStats.map((task) => (
              <TaskStatusCard
                key={task.status}
                title={
                  task.status === "todo"
                    ? "To Do"
                    : task.status === "in_review"
                      ? "In Review"
                      : "Done"
                }
                count={task.count}
                status={task.status}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Assigned to Me</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {myTasks.length === 0 ?
                    <span className="text-muted-foreground text-sm flex justify-center">There are no tasks currently assigned to you</span>
                    :
                    myTasks.map((task) => (
                      <div key={task.id} className="p-3 bg-secondary rounded-lg">
                        <p className="text-sm font-medium">{task.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{task.status === "todo"
                          ? "To Do"
                          : task.status === "in_review"
                            ? "In Review"
                            : "Done"}</p>
                      </div>
                    ))
                  }
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 divide-y">
                  {recentActivity.length === 0 ?
                    <span className="text-muted-foreground text-sm flex justify-center">The recent activity of your workspace will show here</span>
                    :
                    recentActivity.map((log) => (
                      <ActivityLogItem key={log.id} log={log} />
                    ))
                  }
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </AppLayout>
  )
}
