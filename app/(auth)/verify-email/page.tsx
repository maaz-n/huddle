import { VerifyEmailForm } from "@/components/verify-email-form"

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email } = await searchParams

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <VerifyEmailForm initialEmail={email ?? ""} />
      </div>
    </div>
  )
}
