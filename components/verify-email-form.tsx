"use client"

import { useState } from "react"
import Link from "next/link"
import { Loader2Icon, MailCheck } from "lucide-react"
import { toast } from "sonner"

import { resendVerificationEmail } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export function VerifyEmailForm({
  initialEmail = "",
  className,
  ...props
}: React.ComponentProps<"div"> & { initialEmail?: string }) {
  const [email, setEmail] = useState(initialEmail)
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)

    try {
      const response = await resendVerificationEmail(email)
      if (response.success) {
        toast.success(response.message)
        setSent(true)
      } else {
        toast.error(response.message)
      }
    } catch {
      toast.error("Could not send a verification email")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardHeader>
          <img
            src="/huddle.svg"
            alt=""
            className="pt-7 -mb-10 mx-auto w-40 invert-85 dark:invert-0"
          />
        </CardHeader>
        <CardContent className="p-0">
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <MailCheck className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold">Verify your email</h1>
                <p className="text-muted-foreground text-balance">
                  Open the link we sent to your inbox before signing in.
                </p>
              </div>

              {sent && (
                <p className="rounded-md border bg-muted/30 p-4 text-center text-sm">
                  A fresh link is on its way. It expires in 24 hours.
                </p>
              )}

              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </Field>

              <Field>
                <Button type="submit" disabled={isLoading || !email.trim()}>
                  {isLoading ? (
                    <>
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Resend verification link"
                  )}
                </Button>
              </Field>

              <FieldDescription className="text-center">
                Already verified? <Link href="/login">Back to login</Link>
              </FieldDescription>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
