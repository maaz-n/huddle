"use client"
import { useAppData } from './app-data-provider'

const UserGreeting = ({ dueTasks }: { dueTasks: number }) => {
    const { user } = useAppData();
    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning!";
        if (hour < 18) return "Good afternoon!";
        return "Good evening!";
    };

    return (
        <div>
            <h1 className="text-3xl font-bold">{greeting()} {user?.name} 👋</h1>
            <p className="text-muted-foreground mt-2">You have <span className='text-foreground font-semibold'>{dueTasks}</span> {dueTasks === 1 ? "task" : "tasks"} due today!</p>
        </div>
    )
}

export default UserGreeting