export const dynamic = 'force-dynamic';

import { WorkspaceForm } from "@/components/workspace-create-form";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getWorkspacesWithRoles } from "@/actions/workspace";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {

  const workspaces = await getWorkspacesWithRoles();
  if (workspaces.length > 0) redirect("/")

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-4">
      <div className="max-w-[450px] w-full space-y-8">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="">
            <img src={"/huddle.svg"} className="mx-auto w-35 mb-5 invert-85 dark:invert-0" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Setup your workspace</h1>
            <p className="text-muted-foreground">Everything starts with a workspace.</p>
          </div>
        </div>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-xl">Workspace Details</CardTitle>
            <CardDescription>Give your team a home to manage tasks.</CardDescription>
          </CardHeader>

          <WorkspaceForm />

        </Card>
      </div>
    </div>
  );
}