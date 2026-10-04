import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { dictionaries, dir, type Locale } from './i18n.dict'

const STORAGE_KEY = 'ican.locale'

type I18nValue = {
  locale: Locale
  dir: 'rtl' | 'ltr'
  t: (key: string, vars?: Record<string, string | number>) => string
  setLocale: (locale: Locale) => void
  toggleLocale: () => void
}

const I18nContext = createContext<I18nValue | null>(null)

function readInitialLocale(): Locale {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'en' || stored === 'ar' ? stored : 'ar'
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readInitialLocale)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, locale)
    document.documentElement.lang = locale
    document.documentElement.dir = dir(locale)
  }, [locale])

  const setLocale = useCallback((next: Locale) => setLocaleState(next), [])
  const toggleLocale = useCallback(() => setLocaleState((current) => (current === 'ar' ? 'en' : 'ar')), [])

  const value = useMemo<I18nValue>(() => {
    const dictionary = dictionaries[locale]
    const fallback = dictionaries.ar
    const t = (key: string, vars?: Record<string, string | number>) => {
      let text = dictionary[key] ?? fallback[key] ?? key
      if (vars) {
        for (const [name, val] of Object.entries(vars)) {
          text = text.replace(new RegExp(`\\{${name}\\}`, 'g'), String(val))
        }
      }
      return text
    }
    return { locale, dir: dir(locale), t, setLocale, toggleLocale }
  }, [locale, setLocale, toggleLocale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within LocaleProvider')
  return ctx
}
