import { Plus, Eye, Cog } from "lucide-react"
import { AppLayout } from "@/components/app-layout"
import { TaskStatusCard } from "@/components/task-status-card"
import { ActivityLogItem } from "@/components/activity-log-item"
import { QuickActionButton } from "@/components/quick-action-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getCurrentUser } from "@/actions/auth"
import { UserType, Workspace } from "@/types/types"
import { useAppData } from "@/components/app-data-provider"
import UserGreeting from "@/components/user-greeting"
import { getTaskStats } from "@/actions/tasks"

const mockTasks = [
  { status: "todo" as const, count: 8 },
  { status: "in_progress" as const, count: 5 },
  { status: "blocked" as const, count: 2 },
  { status: "done" as const, count: 12 },
]

const mockActivityLogs = [
  {
    id: "1",
    actor: { name: "John Doe", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=John" },
    action: "completed",
    entityType: "task",
    entityName: "Fix login button",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: "2",
    actor: { name: "Jane Smith", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jane" },
    action: "created",
    entityType: "task",
    entityName: "Design homepage redesign",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
  },
  {
    id: "3",
    actor: { name: "Bob Johnson", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob" },
    action: "updated",
    entityType: "task",
    entityName: "API rate limiting",
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
  },
  {
    id: "4",
    actor: { name: "John Doe", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=John" },
    action: "assigned to",
    entityType: "task",
    entityName: "Database migration",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: "5",
    actor: { name: "Jane Smith", image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jane" },
    action: "marked as blocked",
    entityType: "task",
    entityName: "Third-party integration",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
]

const STATUSES = [
  "todo",
  "in_progress",
  "blocked",
  "done",
] as const

export default async function DashboardPage(props: any) {

  const searchParams = await props.searchParams;
  const workspaceId = searchParams.workspace

  const tasksStatsFromDb = await getTaskStats(workspaceId);
  const normalizedStats = STATUSES.map(status => {
    const found = tasksStatsFromDb.find(t => t.status === status)

    return {
      status,
      count: found ? found.count : 0
    }
  })

  console.log(normalizedStats)

  return (
    <AppLayout>
      <div className="py-8 px-6 space-y-8">
        <UserGreeting />
        {/* Task Status Cards */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Tasks by Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {normalizedStats.map((task) => (
              <TaskStatusCard
                key={task.status}
                title={
                  task.status === "todo"
                    ? "To Do"
                    : task.status === "in_progress"
                      ? "In Progress"
                      : task.status === "blocked"
                        ? "Blocked"
                        : "Done"
                }
                count={task.count}
                status={task.status}
              />
            ))}
          </div>
        </div>

        {/* Assigned to me and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Assigned to me */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Assigned to Me</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-3 bg-secondary rounded-lg">
                      <p className="text-sm font-medium">Task {i}</p>
                      <p className="text-xs text-muted-foreground mt-1">In Progress</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* <QuickActionButton icon={Plus} label="Create Task" className="bg-primary hover:bg-primary/90" />
                  <QuickActionButton icon={Eye} label="View Tasks" variant="outline" />
                  <QuickActionButton icon={Cog} label="Go to Settings" variant="outline" /> */}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 divide-y">
                {mockActivityLogs.map((log) => (
                  <ActivityLogItem key={log.id} {...log} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
