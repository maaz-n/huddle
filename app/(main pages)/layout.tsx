import { getCurrentUser } from '@/actions/auth';
import { getWorkspaces } from '@/actions/tasks'
import { AppDataProvider } from '@/components/app-data-provider';
import { redirect } from 'next/navigation';
import React from 'react'

const MainPagesLayout = async ({children} : {children: React.ReactNode}) => {

    const workspaces = await getWorkspaces();
    const user = await getCurrentUser();

    if(!user) redirect("/login");

  return (
    <AppDataProvider user={user} workspaces={workspaces} >
        {children}
    </AppDataProvider>
  )
}

export default MainPagesLayout