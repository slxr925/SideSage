import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { type Locale, LOCALE_KEY, setLocale as setI18nLocale, t as translate } from "../shared/i18n";

type I18nValue = {
  t: typeof translate;
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

const I18nContext = createContext<I18nValue>({
  t: translate,
  locale: "en",
  setLocale: () => {}
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    chrome.storage.local.get(LOCALE_KEY, (result) => {
      const stored = result[LOCALE_KEY] as Locale | undefined;
      if (stored === "en" || stored === "zh") {
        setI18nLocale(stored);
        setLocaleState(stored);
      }
    });

    const listener = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string
    ) => {
      if (areaName !== "local") return;
      const change = changes[LOCALE_KEY];
      if (change?.newValue === "en" || change?.newValue === "zh") {
        setI18nLocale(change.newValue);
        setLocaleState(change.newValue);
      }
    };

    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  const setLocale = (next: Locale) => {
    setI18nLocale(next);
    setLocaleState(next);
    chrome.storage.local.set({ [LOCALE_KEY]: next });
  };

  return (
    <I18nContext.Provider value={{ t: translate, locale, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nValue {
  return useContext(I18nContext);
}
