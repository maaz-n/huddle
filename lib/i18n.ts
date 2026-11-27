export const locales = ["en", "ur"] as const
export type Locale = (typeof locales)[number]
export const DEFAULT_LOCALE: Locale = "en"

export const localeNames: Record<Locale, string> = {
  en: "English",
  ur: "اردو",
}

/**
 * English is the source of truth: adding a key here forces every locale to
 * provide a translation.
 */
const en = {
  "nav.overview": "Overview",
  "nav.dashboard": "Dashboard",
  "nav.work": "Work",
  "nav.tasks": "Tasks",
  "nav.myTasks": "My Tasks",
  "nav.workspace": "Workspace",
  "nav.activity": "Activity",
  "nav.members": "Members",
  "nav.settings": "Workspace Settings",
  "nav.profile": "Profile",
  "a11y.skip": "Skip to main content",
  "a11y.openNavigation": "Open navigation",
  "a11y.closeNavigation": "Close navigation",
  "a11y.createWorkspace": "Create workspace",
  "a11y.openUserMenu": "Open user menu",
  "menu.settings": "Settings",
  "menu.logout": "Logout",
  "menu.language": "Language",
  "tasks.search": "Search by title...",
  "tasks.sort": "Sort tasks",
  "tasks.filterStatus": "Filter by status",
  "tasks.filterPriority": "Filter by priority",
  "tasks.filterAssignee": "Filter by assignee",
  "tasks.new": "New Task",
  "tasks.done": "Mark done",
  "tasks.reopen": "Reopen",
  "tasks.delete": "Delete",
  "tasks.clear": "Clear",
} as const

export type MessageKey = keyof typeof en

const ur: Record<MessageKey, string> = {
  "nav.overview": "جائزہ",
  "nav.dashboard": "ڈیش بورڈ",
  "nav.work": "کام",
  "nav.tasks": "کام",
  "nav.myTasks": "میرے کام",
  "nav.workspace": "ورک اسپیس",
  "nav.activity": "سرگرمی",
  "nav.members": "اراکین",
  "nav.settings": "ورک اسپیس کی ترتیبات",
  "nav.profile": "پروفائل",
  "a11y.skip": "مرکزی مواد پر جائیں",
  "a11y.openNavigation": "نیویگیشن کھولیں",
  "a11y.closeNavigation": "نیویگیشن بند کریں",
  "a11y.createWorkspace": "ورک اسپیس بنائیں",
  "a11y.openUserMenu": "صارف کا مینو کھولیں",
  "menu.settings": "ترتیبات",
  "menu.logout": "لاگ آؤٹ",
  "menu.language": "زبان",
  "tasks.search": "عنوان سے تلاش کریں...",
  "tasks.sort": "کاموں کی ترتیب",
  "tasks.filterStatus": "حالت کے لحاظ سے فلٹر",
  "tasks.filterPriority": "ترجیح کے لحاظ سے فلٹر",
  "tasks.filterAssignee": "ذمہ دار کے لحاظ سے فلٹر",
  "tasks.new": "نیا کام",
  "tasks.done": "مکمل کریں",
  "tasks.reopen": "دوبارہ کھولیں",
  "tasks.delete": "حذف کریں",
  "tasks.clear": "صاف کریں",
}

export function translate(locale: Locale, key: MessageKey): string {
  return (locale === "ur" ? ur : en)[key]
}
