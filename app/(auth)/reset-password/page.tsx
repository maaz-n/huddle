import Link from "next/link"

import { ResetPasswordForm } from "@/components/reset-password-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default async function ResetPasswordPage(props: {
  searchParams: Promise<{ token?: string; error?: string }>
}) {
  const { token, error } = await props.searchParams

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        {error || !token ? (
          <Card className="overflow-hidden p-0">
            <CardHeader>
              <img
                src={"/huddle.svg"}
                alt=""
                className="pt-7 -mb-10 mx-auto w-40 invert-85 dark:invert-0"
              />
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-4 p-6 text-center md:p-8">
                <h1 className="text-2xl font-bold">Link unavailable</h1>
                <p className="text-muted-foreground text-balance">
                  This reset link is invalid or has expired. Request a new one
                  to continue.
                </p>
                <Button asChild>
                  <Link href="/forgot-password">Request a new link</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <ResetPasswordForm token={token} />
        )}
      </div>
    </div>
  )
}
