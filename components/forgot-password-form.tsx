"use client"

import { useState } from "react"
import Link from "next/link"
import { Loader2Icon } from "lucide-react"
import { toast } from "sonner"

import { requestPasswordReset } from "@/actions/auth"
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

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await requestPasswordReset(email)
      if (response.success) {
        setSent(true)
      } else {
        toast.error(response.message)
      }
    } catch {
      toast.error("Could not request a password reset")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardHeader>
          <img
            src={"/huddle.svg"}
            alt=""
            className="pt-7 -mb-10 mx-auto w-40 invert-85 dark:invert-0"
          />
        </CardHeader>
        <CardContent className="p-0">
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Forgot your password?</h1>
                <p className="text-muted-foreground text-balance">
                  Enter your email and we&apos;ll send you a reset link.
                </p>
              </div>

              {sent ? (
                <>
                  <p className="rounded-md border bg-muted/30 p-4 text-center text-sm">
                    Check your inbox for the reset link. It expires in 1 hour.
                  </p>
                  <FieldDescription className="text-center">
                    <Link href="/login">Back to login</Link>
                  </FieldDescription>
                </>
              ) : (
                <>
                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      placeholder="test@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </Field>
                  <Field>
                    <Button type="submit" disabled={isLoading || !email}>
                      {isLoading ? (
                        <Loader2Icon className="size-4 animate-spin" />
                      ) : (
                        "Send reset link"
                      )}
                    </Button>
                  </Field>
                  <FieldDescription className="text-center">
                    <Link href="/login">Back to login</Link>
                  </FieldDescription>
                </>
              )}
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
