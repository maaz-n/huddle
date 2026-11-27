"use client"

import { Check, Languages, LogOut, Settings, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { UserAvatar } from "./user-avatar"
import { UserTypeNew } from "@/types/types"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useWorkspaceHref } from "@/hooks/useWorkspaceHref"
import { localeNames, locales } from "@/lib/i18n"
import { useLocale } from "@/lib/use-locale"

export function UserMenu({ user }: { user: UserTypeNew }) {

  if (!user) throw new Error("Could not fetch user");

  const settingsHref = useWorkspaceHref("/settings")
  const profileHref = useWorkspaceHref("/profile")
  const { locale, setLocale, t } = useLocale()
  
  const router = useRouter()

  async function handleLogout() {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login");
        },
      },
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("a11y.openUserMenu")}>
          <UserAvatar user={user} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2">
          <Link href={profileHref} className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>{t("nav.profile")}</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2">
          <Link href={settingsHref} className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>{t("menu.settings")}</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled className="gap-2 text-muted-foreground">
          <Languages className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wide">
            {t("menu.language")}
          </span>
        </DropdownMenuItem>
        {locales.map((option) => (
          <DropdownMenuItem key={option} onClick={() => setLocale(option)}>
            <span className="flex-1">{localeNames[option]}</span>
            {locale === option && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          <span>{t("menu.logout")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
