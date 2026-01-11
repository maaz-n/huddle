"use client"
import React from 'react'
import { useAppData } from './app-data-provider'

const UserGreeting = () => {
    const { user } = useAppData()
    return (
        <div>
            <h1 className="text-3xl font-bold">Hello {user?.name} 👋</h1>
            <p className="text-muted-foreground mt-2">Overview of your tasks and activity</p>
        </div>
    )
}

export default UserGreeting