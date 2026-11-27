import { describe, it, expect } from "vitest"

import {
  DEFAULT_LOCALE,
  localeNames,
  locales,
  translate,
} from "@/lib/i18n"

describe("i18n", () => {
  it("defaults to English", () => {
    expect(DEFAULT_LOCALE).toBe("en")
    expect(locales).toEqual(["en", "ur"])
  })

  it("translates a key in each locale", () => {
    expect(translate("en", "nav.tasks")).toBe("Tasks")
    expect(translate("ur", "nav.tasks")).toBe("کام")
    expect(translate("ur", "menu.logout")).toBe("لاگ آؤٹ")
  })

  it("provides every key in every locale", () => {
    const keys = Object.keys(localeNames) as (keyof typeof localeNames)[]

    for (const locale of keys) {
      expect(localeNames[locale]).toBeTruthy()
    }

    for (const key of [
      "nav.overview",
      "nav.settings",
      "a11y.skip",
      "tasks.search",
      "tasks.clear",
    ] as const) {
      expect(translate("en", key)).toBeTruthy()
      expect(translate("ur", key)).toBeTruthy()
    }
  })
})
