"use client"
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { TasksWithAssignees } from '@/types/types'
import { useWorkspaceHref } from '@/hooks/useWorkspaceHref'


interface AssignedToMeProps {
    myTasks: TasksWithAssignees[]
}

const AssignedToMe = ({ myTasks }: AssignedToMeProps) => {

    const myTasksHref = useWorkspaceHref("/my-tasks")

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Assigned to Me</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {myTasks.length === 0 ?
                        <span className="text-muted-foreground text-sm flex justify-center">There are no tasks currently assigned to you</span>
                        :
                        <div>
                            {myTasks.map((task) => (
                                <div key={task.id} className="p-3 bg-secondary rounded-lg my-3 shadow-sm">
                                    <p className="text-sm font-medium">{task.title}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{task.status === "todo"
                                        ? "To Do"
                                        : task.status === "in_review"
                                            ? "In Review"
                                            : "Done"}</p>
                                </div>
                            ))}
                            <a className="text-muted-foreground text-center block w-full hover:underline mt-6 text-sm" href={myTasksHref}>Show all</a>
                        </div>
                    }
                </div>
            </CardContent>
        </Card>
    )
}

export default AssignedToMe