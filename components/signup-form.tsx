"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { signup } from "@/actions/auth"
import { toast } from "sonner"
import { Loader2Icon } from "lucide-react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {

  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await signup(name, email, password);
      if (response.success) {
        toast.success(response.message);
        router.push("/")
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      const e = error as Error;
      toast.error(e.message);
    } finally {
      setIsLoading(false)
      setName("");
      setEmail("");
      setPassword("");
    }
  }

    const signupWithGoogle = async () => {
      await authClient.signIn.social({
        provider: "google"
      })
    }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardHeader>
          <img src={"/huddle.svg"} className="pt-7 -mb-10 mx-auto w-40 invert-85 dark:invert-0" />
        </CardHeader>
        <CardContent className="p-0">
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <FieldGroup className="-space-y-2">
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Welcome aboard!</h1>
                <p className="text-muted-foreground text-balance">
                  Let's create your account
                </p>
              </div>
              <Field>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Field>
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
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input id="password" type="password" placeholder="********" required
                  onChange={(e) => setPassword(e.target.value)}
                  value={password}
                />
              </Field>
              <Field>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? <Loader2Icon className="size-4 animate-spin" /> : "Sign up"}
                </Button>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Or
              </FieldSeparator>
              <Field>
                <Button variant="outline" type="button" onClick={signupWithGoogle}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </Button>
              </Field>
              <FieldDescription className="text-center">
                Already have an account? <a href="/login">Login</a>
              </FieldDescription>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
