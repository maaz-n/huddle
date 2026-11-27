"use client"

import { useCallback, useEffect, useSyncExternalStore } from "react"

import {
  DEFAULT_LOCALE,
  translate,
  type Locale,
  type MessageKey,
} from "@/lib/i18n"

const STORAGE_KEY = "huddle-locale"
const CHANGE_EVENT = "huddle-locale-change"

function readLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === "ur" ? "ur" : DEFAULT_LOCALE
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange)
  window.addEventListener("storage", onChange)
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange)
    window.removeEventListener("storage", onChange)
  }
}

export function useLocale() {
  const locale = useSyncExternalStore(subscribe, readLocale, () => DEFAULT_LOCALE)

  const setLocale = useCallback((next: Locale) => {
    window.localStorage.setItem(STORAGE_KEY, next)
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }, [])

  const t = useCallback(
    (key: MessageKey) => translate(locale, key),
    [locale],
  )

  return { locale, setLocale, t }
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const { locale } = useLocale()

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  return <>{children}</>
}
