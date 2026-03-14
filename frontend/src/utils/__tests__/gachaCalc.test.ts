import { describe, it, expect } from 'vitest'
import { calculateEstimatedPulls, getCurrencyLabels } from '../gachaCalc'

describe('calculateEstimatedPulls', () => {
  // ─── Character only ──────────────────────────────────────────────────────

  it('calculates pulls for char only (Genshin C3 → C6 = 3 copies × 90)', () => {
    expect(calculateEstimatedPulls('Genshin Impact', 'E3', 'E6', null, null)).toBe(270)
  })

  it('calculates pulls for char from scratch (E0 target = 1 copy)', () => {
    expect(calculateEstimatedPulls('Genshin Impact', null, 'E0', null, null)).toBe(90)
  })

  it('calculates pulls for char from scratch (E6 target = 7 copies)', () => {
    expect(calculateEstimatedPulls('Honkai: Star Rail', null, 'E6', null, null)).toBe(630)
  })

  it('returns 0 when current >= target (char)', () => {
    expect(calculateEstimatedPulls('Genshin Impact', 'E6', 'E3', null, null)).toBe(0)
  })

  it('returns 0 when current equals target (char)', () => {
    expect(calculateEstimatedPulls('Genshin Impact', 'E2', 'E2', null, null)).toBe(0)
  })

  // ─── Weapon only ─────────────────────────────────────────────────────────

  it('calculates pulls for weapon only (S1 → S5 = 4 copies × 80)', () => {
    expect(calculateEstimatedPulls('Genshin Impact', null, null, 'S1', 'S5')).toBe(320)
  })

  it('calculates pulls for weapon from scratch (S1 target = 1 copy)', () => {
    expect(calculateEstimatedPulls('Honkai: Star Rail', null, null, null, 'S1')).toBe(80)
  })

  it('returns 0 when current >= target (weapon)', () => {
    expect(calculateEstimatedPulls('Genshin Impact', null, null, 'S5', 'S2')).toBe(0)
  })

  // ─── Char + Weapon combined ──────────────────────────────────────────────

  it('calculates combined char + weapon', () => {
    // E0→E2 = 2×90 = 180, S1→S3 = 2×80 = 160, total = 340
    expect(calculateEstimatedPulls('Genshin Impact', 'E0', 'E2', 'S1', 'S3')).toBe(340)
  })

  // ─── Different games / pity values ────────────────────────────────────────

  it('uses HI3 pity (100 char, 50 weapon)', () => {
    // E0→E1 = 1×100 = 100, S1→S2 = 1×50 = 50, total = 150
    expect(calculateEstimatedPulls('Honkai Impact 3rd', 'E0', 'E1', 'S1', 'S2')).toBe(150)
  })

  it('uses Wuthering Waves pity (80 char, 80 weapon)', () => {
    // E0→E1 = 1×80, total = 80
    expect(calculateEstimatedPulls('Wuthering Waves', 'E0', 'E1', null, null)).toBe(80)
  })

  it('uses default pity for unknown game (90 char, 80 weapon)', () => {
    expect(calculateEstimatedPulls('Some New Game', 'E0', 'E1', null, null)).toBe(90)
  })

  // ─── Null values (no targets) ────────────────────────────────────────────

  it('returns 0 when all targets are null', () => {
    expect(calculateEstimatedPulls('Genshin Impact', null, null, null, null)).toBe(0)
  })

  it('returns 0 when only currents are set but no targets', () => {
    expect(calculateEstimatedPulls('Genshin Impact', 'E3', null, 'S2', null)).toBe(0)
  })
})

describe('getCurrencyLabels', () => {
  it('returns correct labels for Genshin Impact', () => {
    const labels = getCurrencyLabels('Genshin Impact')
    expect(labels.premium).toBe('Primogems')
    expect(labels.passes).toBe('Intertwined Fate')
  })

  it('returns correct labels for HSR', () => {
    const labels = getCurrencyLabels('Honkai: Star Rail')
    expect(labels.premium).toBe('Stellar Jade')
    expect(labels.passes).toBe('Special Pass')
  })

  it('returns correct labels for ZZZ', () => {
    const labels = getCurrencyLabels('Zenless Zone Zero')
    expect(labels.premium).toBe('Polychrome')
    expect(labels.passes).toBe('Encrypted Master Tape')
  })

  it('returns default labels for unknown game', () => {
    const labels = getCurrencyLabels('Unknown Game')
    expect(labels.premium).toBe('Premium Currency')
    expect(labels.passes).toBe('Pass')
  })
})
