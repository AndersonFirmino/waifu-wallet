import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { useTranslation } from 'react-i18next'

interface LocaleContextValue {
  language: string
  currency: string
  changeLanguage: (lang: string) => void
  changeCurrency: (cur: string) => void
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val)
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation()
  const [language, setLanguage] = useState('pt-BR')
  const [currency, setCurrency] = useState('BRL')

  useEffect(() => {
    const fetchSettings = async (): Promise<void> => {
      try {
        const res = await fetch('/api/v1/settings/')
        if (!res.ok) return
        const data: unknown = await res.json()
        if (isRecord(data)) {
          if (typeof data.language === 'string') {
            setLanguage(data.language)
            void i18n.changeLanguage(data.language)
          }
          if (typeof data.currency === 'string') {
            setCurrency(data.currency)
          }
        }
      } catch (err: unknown) {
        console.error('Failed to fetch locale settings:', err)
      }
    }
    void fetchSettings()
  }, [i18n])

  const changeLanguage = useCallback(
    (lang: string): void => {
      const prev = language
      setLanguage(lang)
      void i18n.changeLanguage(lang)
      fetch('/api/v1/settings/', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: lang }),
      }).catch((err: unknown) => {
        console.error('Failed to persist language:', err)
        setLanguage(prev)
        void i18n.changeLanguage(prev)
      })
    },
    [i18n, language],
  )

  const changeCurrency = useCallback(
    (cur: string): void => {
      const prev = currency
      setCurrency(cur)
      fetch('/api/v1/settings/', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency: cur }),
      }).catch((err: unknown) => {
        console.error('Failed to persist currency:', err)
        setCurrency(prev)
      })
    },
    [currency],
  )

  return (
    <LocaleContext.Provider value={{ language, currency, changeLanguage, changeCurrency }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext)
  if (ctx === null) {
    throw new Error('useLocale must be used inside LocaleProvider')
  }
  return ctx
}
