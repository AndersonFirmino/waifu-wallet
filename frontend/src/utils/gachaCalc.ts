import type { CharTarget, WeaponTarget } from '../types'

// ─── Pity Constants ──────────────────────────────────────────────────────────

interface PityConfig {
  char: number
  weapon: number
}

const PITY_BY_GAME: Record<string, PityConfig> = {
  'Honkai: Star Rail': { char: 90, weapon: 80 },
  'Genshin Impact': { char: 90, weapon: 80 },
  'Zenless Zone Zero': { char: 90, weapon: 80 },
  'Honkai Impact 3rd': { char: 100, weapon: 50 },
  'Wuthering Waves': { char: 80, weapon: 80 },
  'Blue Archive': { char: 200, weapon: 0 },
}

const DEFAULT_PITY: PityConfig = { char: 90, weapon: 80 }

// ─── Currency Labels ─────────────────────────────────────────────────────────

interface CurrencyLabels {
  premium: string
  passes: string
}

const CURRENCY_LABELS: Record<string, CurrencyLabels> = {
  'Honkai: Star Rail': { premium: 'Stellar Jade', passes: 'Special Pass' },
  'Genshin Impact': { premium: 'Primogems', passes: 'Intertwined Fate' },
  'Zenless Zone Zero': { premium: 'Polychrome', passes: 'Encrypted Master Tape' },
  'Honkai Impact 3rd': { premium: 'Crystals', passes: 'Supply Card' },
  'Wuthering Waves': { premium: 'Astrite', passes: 'Radiant Tide' },
  'Blue Archive': { premium: 'Pyroxene', passes: 'Recruitment Ticket' },
}

const DEFAULT_CURRENCY_LABELS: CurrencyLabels = { premium: 'Premium Currency', passes: 'Pass' }

export function getCurrencyLabels(game: string): CurrencyLabels {
  return CURRENCY_LABELS[game] ?? DEFAULT_CURRENCY_LABELS
}

// ─── Target Indexing ─────────────────────────────────────────────────────────

const CHAR_TARGET_INDEX: Record<CharTarget, number> = {
  E0: 0, E1: 1, E2: 2, E3: 3, E4: 4, E5: 5, E6: 6,
}

const WEAPON_TARGET_INDEX: Record<WeaponTarget, number> = {
  S1: 1, S2: 2, S3: 3, S4: 4, S5: 5,
}

function charTargetToIndex(target: CharTarget): number {
  return CHAR_TARGET_INDEX[target]
}

function weaponTargetToIndex(target: WeaponTarget): number {
  return WEAPON_TARGET_INDEX[target]
}

// ─── Auto-calculation ────────────────────────────────────────────────────────

export function calculateEstimatedPulls(
  game: string,
  charCurrent: CharTarget | null,
  charTarget: CharTarget | null,
  weaponCurrent: WeaponTarget | null,
  weaponTarget: WeaponTarget | null,
): number {
  const pity = PITY_BY_GAME[game] ?? DEFAULT_PITY
  let total = 0

  if (charCurrent !== null && charTarget !== null) {
    const currentIdx = charTargetToIndex(charCurrent)
    const targetIdx = charTargetToIndex(charTarget)
    const copies = targetIdx - currentIdx
    if (copies > 0) {
      total += copies * pity.char
    }
  } else if (charTarget !== null) {
    // No current = assume starting from nothing (need target+1 copies for E0=1 copy)
    const targetIdx = charTargetToIndex(charTarget)
    total += (targetIdx + 1) * pity.char
  }

  if (weaponCurrent !== null && weaponTarget !== null) {
    const currentIdx = weaponTargetToIndex(weaponCurrent)
    const targetIdx = weaponTargetToIndex(weaponTarget)
    const copies = targetIdx - currentIdx
    if (copies > 0 && pity.weapon > 0) {
      total += copies * pity.weapon
    }
  } else if (weaponTarget !== null && pity.weapon > 0) {
    const targetIdx = weaponTargetToIndex(weaponTarget)
    total += targetIdx * pity.weapon
  }

  return total
}
