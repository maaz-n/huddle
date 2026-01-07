import { createTask } from "@/actions/tasks";

export default async function Page() {
  try {
    await createTask({
      workspaceId: "908065f6-c676-4e7f-8ef6-4ec337ed0320",
      title: "Test task from dev page",
    });

    return <pre>✅ Task created successfully</pre>;
  } catch (err: any) {
    return <pre>❌ Error: {err.message}</pre>;
  }
}
