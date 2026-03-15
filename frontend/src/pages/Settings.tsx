import { useTranslation } from 'react-i18next'
import { useLocale } from '../hooks/useLocale'

const LANGUAGES = [
  { code: 'pt-BR', name: 'Português (Brasil)' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
] as const

const CURRENCIES = [
  { code: 'BRL', name: 'Real (R$)' },
  { code: 'USD', name: 'Dollar ($)' },
  { code: 'EUR', name: 'Euro (€)' },
  { code: 'GBP', name: 'Pound (£)' },
  { code: 'JPY', name: 'Yen (¥)' },
  { code: 'CAD', name: 'Canadian Dollar (CA$)' },
  { code: 'AUD', name: 'Australian Dollar (A$)' },
  { code: 'CHF', name: 'Swiss Franc (CHF)' },
  { code: 'CNY', name: 'Yuan (¥)' },
  { code: 'KRW', name: 'Won (₩)' },
] as const

export default function Settings() {
  const { t } = useTranslation()
  const { language, currency, changeLanguage, changeCurrency } = useLocale()

  return (
    <div style={{ padding: '32px 24px', maxWidth: 600 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
        {t('settings.title')}
      </h1>

      <div style={{ marginTop: 32 }}>
        {/* Language selector */}
        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--color-text)',
              marginBottom: 8,
            }}
          >
            {t('settings.language')}
          </label>
          <select
            value={language}
            onChange={(e) => { changeLanguage(e.target.value) }}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)',
              fontSize: 14,
            }}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        {/* Currency selector */}
        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--color-text)',
              marginBottom: 8,
            }}
          >
            {t('settings.currency')}
          </label>
          <select
            value={currency}
            onChange={(e) => { changeCurrency(e.target.value) }}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)',
              fontSize: 14,
            }}
          >
            {CURRENCIES.map((cur) => (
              <option key={cur.code} value={cur.code}>
                {cur.code} — {cur.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
