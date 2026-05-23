import type { LocaleKey } from "./types";
import en from "./en";
import zh from "./zh";

export type Locale = "en" | "zh";

const LOCALE_KEY = "extensionLanguage";

const catalogs: Record<Locale, Record<LocaleKey, string>> = { en, zh };

let currentLocale: Locale = "en";

export function t(key: LocaleKey, params?: Record<string, string | number>): string {
  let value = catalogs[currentLocale]?.[key] ?? catalogs.en[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      value = value.replace(`{${k}}`, String(v));
    }
  }
  return value;
}

export function getCurrentLocale(): Locale {
  return currentLocale;
}

export function setLocale(locale: Locale): void {
  currentLocale = locale;
}

export async function loadLocaleFromStorage(): Promise<Locale> {
  try {
    const result = await chrome.storage.local.get(LOCALE_KEY);
    const stored = result[LOCALE_KEY] as Locale | undefined;
    if (stored === "en" || stored === "zh") {
      currentLocale = stored;
    }
  } catch {
    // Extension context may be unavailable during startup
  }
  return currentLocale;
}

export { LOCALE_KEY };
