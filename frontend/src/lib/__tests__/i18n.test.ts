import { describe, it, expect } from 'vitest'
import i18n from '../i18n'

describe('i18n', () => {
  it('initializes with pt-BR as default language', () => {
    expect(i18n.language).toBe('pt-BR')
  })

  it('has pt-BR translations loaded', () => {
    expect(i18n.exists('sidebar.dashboard')).toBe(true)
  })

  it('has en translations loaded', async () => {
    await i18n.changeLanguage('en')
    expect(i18n.t('sidebar.dashboard')).toBe('Dashboard')
    await i18n.changeLanguage('pt-BR')
  })

  it('falls back to pt-BR for unknown keys', () => {
    expect(i18n.t('nonexistent.key')).toBe('nonexistent.key')
  })
})
