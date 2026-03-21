// ─── Gacha Pricing — Multi-currency top-up tiers ─────────────────────────────

export interface TopUpTier {
  shards: number
  price: number
}

// Shard amounts per game family
const HOYOVERSE_SHARDS = [60, 300, 980, 1980, 3280, 6480] as const
const HI3_SHARDS = [60, 330, 1090, 2190, 3640, 7200] as const

// Prices per currency — index matches shard array above
const HOYOVERSE_PRICES: Record<string, readonly number[]> = {
  BRL: [4.90, 24.90, 79.90, 149.90, 249.90, 499.90],
  USD: [0.99, 4.99, 14.99, 29.99, 49.99, 99.99],
  EUR: [0.99, 5.99, 17.99, 34.99, 59.99, 99.99],
  GBP: [0.99, 4.99, 14.99, 29.99, 49.99, 99.99],
  JPY: [120, 610, 1840, 3680, 6100, 12000],
  KRW: [1200, 5900, 19000, 37000, 65000, 119000],
  MXN: [19, 99, 299, 599, 999, 1999],
  CAD: [1.29, 6.99, 19.99, 39.99, 69.99, 129.99],
  AUD: [1.99, 7.99, 22.99, 49.99, 79.99, 149.99],
}

// HI3 uses the same price points per currency — only shard amounts differ

// Fallback currency when the selected one has no price data
const FALLBACK_CURRENCY = 'USD'

// Premium currency cost per pull by game
const CURRENCY_PER_PULL: Record<string, number> = {
  'Honkai: Star Rail': 160,
  'Genshin Impact': 160,
  'Zenless Zone Zero': 160,
  'Honkai Impact 3rd': 280,
  'Wuthering Waves': 160,
  'Blue Archive': 120,
}

const DEFAULT_CURRENCY_PER_PULL = 160

export function getCurrencyPerPull(game: string): number {
  return CURRENCY_PER_PULL[game] ?? DEFAULT_CURRENCY_PER_PULL
}

function isHi3(game: string): boolean {
  return game === 'Honkai Impact 3rd'
}

function resolvePrices(
  priceMap: Record<string, readonly number[]>,
  currency: string,
): readonly number[] {
  return priceMap[currency] ?? priceMap[FALLBACK_CURRENCY] ?? []
}

function buildTiers(
  shards: readonly number[],
  prices: readonly number[],
): readonly TopUpTier[] {
  if (shards.length !== prices.length) {
    throw new Error(
      `Pricing misconfiguration: ${String(shards.length)} shards but ${String(prices.length)} prices`,
    )
  }
  return shards.map((s, i) => ({ shards: s, price: prices[i] ?? 0 }))
}

export function getTiersForGame(game: string, currency: string): readonly TopUpTier[] {
  const shards = isHi3(game) ? HI3_SHARDS : HOYOVERSE_SHARDS
  const prices = resolvePrices(HOYOVERSE_PRICES, currency)
  return buildTiers(shards, prices)
}

// DP (unbounded knapsack): minimum cost in cents to buy at least `target` shards
// using unlimited purchases of the given tiers.
function normalCostCents(target: number, tiers: readonly TopUpTier[]): number {
  if (target <= 0) return 0

  const roundedTarget = Math.ceil(target)
  const maxPack = Math.max(...tiers.map((t) => t.shards))
  const limit = roundedTarget + maxPack
  const dp = new Array<number>(limit + 1).fill(Number.POSITIVE_INFINITY)
  dp[0] = 0

  for (let amount = 1; amount <= limit; amount++) {
    for (const tier of tiers) {
      const pCents = Math.round(tier.price * 100)
      const current = dp[amount] ?? Number.POSITIVE_INFINITY
      if (amount <= tier.shards) {
        dp[amount] = Math.min(current, pCents)
      } else {
        const prev = dp[amount - tier.shards]
        if (prev !== undefined && prev !== Number.POSITIVE_INFINITY) {
          dp[amount] = Math.min(current, prev + pCents)
        }
      }
    }
  }

  return Math.min(...dp.slice(roundedTarget))
}

// Finds the cheapest way to obtain at least `currencyToBuy` shards.
//
// When `doubleGems` is true, the first purchase of each tier gives 2× shards.
// With only 6 tiers that's 64 possible bonus subsets — we enumerate all of them
// and pick the cheapest (bonus cost + DP remainder at normal prices).
export function calculateCashCost(
  currencyToBuy: number,
  doubleGems: boolean,
  game: string,
  currency: string,
): number {
  if (currencyToBuy <= 0) return 0

  const tiers = getTiersForGame(game, currency)
  const priceCents = tiers.map((t) => Math.round(t.price * 100))

  // Base case: no bonuses, pure DP
  let bestCents = normalCostCents(currencyToBuy, tiers)

  if (doubleGems) {
    // Enumerate every subset of first-purchase bonuses (2^N, N=6 → 64 iterations)
    const n = tiers.length
    for (let mask = 1; mask < 1 << n; mask++) {
      let bonusShards = 0
      let bonusCents = 0

      for (let i = 0; i < n; i++) {
        if ((mask & (1 << i)) === 0) continue
        const tier = tiers[i]
        const pc = priceCents[i]
        if (tier === undefined || pc === undefined) continue
        bonusShards += tier.shards * 2
        bonusCents += pc
      }

      const remainderCents = normalCostCents(currencyToBuy - bonusShards, tiers)
      bestCents = Math.min(bestCents, bonusCents + remainderCents)
    }
  }

  return bestCents / 100
}
