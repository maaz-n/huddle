import { SignupForm } from "@/components/signup-form"

export default async function SignupPage(props: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await props.searchParams

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignupForm next={next} />
      </div>
    </div>
  )
}
