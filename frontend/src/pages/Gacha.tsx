import { useState, useEffect } from 'react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import AnimatedNumber from '../components/ui/AnimatedNumber'
import CurrencyInput from '../components/ui/CurrencyInput'
import ImageCropUpload from '../components/ImageCropUpload'
import { formatCurrency } from '../utils/currency'
import { daysUntil } from '../utils/date'
import { type GachaBanner, type GachaPriority, type CharTarget, type WeaponTarget, type GachaStashMulti } from '../types'
import { useFetch } from '../hooks/useApi'
import { decodeGachaBanner, decodeBannerList, decodeSummary, decodeGachaStashMultiList, decodeAppSettings } from '../lib/decode'
import { calculateEstimatedPulls, getCurrencyLabels } from '../utils/gachaCalc'

// ─── Pull Calculator Constants ───────────────────────────────────────────────

// Premium currency per pull by game
const CURRENCY_PER_PULL: Record<string, number> = {
  'Honkai: Star Rail': 160,      // Stellar Jade
  'Genshin Impact': 160,          // Primogems
  'Zenless Zone Zero': 160,       // Polychrome
  'Honkai Impact 3rd': 280,       // Crystals
}

const DEFAULT_CURRENCY_PER_PULL = 160

function getCurrencyPerPull(game: string): number {
  return CURRENCY_PER_PULL[game] ?? DEFAULT_CURRENCY_PER_PULL
}

// Official BRL top-up tiers per game (all HoYoverse games share same tier structure except HI3)
interface TopUpTier {
  shards: number
  price: number
}

const HOYOVERSE_STANDARD_TIERS: readonly TopUpTier[] = [
  { shards: 60, price: 4.90 },
  { shards: 300, price: 24.90 },
  { shards: 980, price: 79.90 },
  { shards: 1980, price: 149.90 },
  { shards: 3280, price: 249.90 },
  { shards: 6480, price: 499.90 },
] as const

const HI3_TIERS: readonly TopUpTier[] = [
  { shards: 60, price: 4.90 },
  { shards: 330, price: 24.90 },
  { shards: 1090, price: 79.90 },
  { shards: 2190, price: 149.90 },
  { shards: 3640, price: 249.90 },
  { shards: 7200, price: 499.90 },
] as const

const GAME_TOP_UP_TIERS: Record<string, readonly TopUpTier[]> = {
  'Honkai: Star Rail': HOYOVERSE_STANDARD_TIERS,
  'Genshin Impact': HOYOVERSE_STANDARD_TIERS,
  'Zenless Zone Zero': HOYOVERSE_STANDARD_TIERS,
  'Honkai Impact 3rd': HI3_TIERS,
}

function getTiersForGame(game: string): readonly TopUpTier[] {
  return GAME_TOP_UP_TIERS[game] ?? HOYOVERSE_STANDARD_TIERS
}

// With first-time/anniversary double gems each tier gives 2x shards
function calculateCashCost(currencyToBuy: number, doubleGems: boolean, game: string): number {
  if (currencyToBuy <= 0) return 0
  const tiers = getTiersForGame(game)
  let remaining = currencyToBuy
  let cost = 0
  // Greedy: buy largest packs first for best $/currency ratio
  const sortedTiers = [...tiers].sort((a, b) => b.shards - a.shards)
  for (const tier of sortedTiers) {
    const effective = doubleGems ? tier.shards * 2 : tier.shards
    while (remaining > 0 && remaining >= effective / 2) {
      cost += tier.price
      remaining -= effective
    }
  }
  // If still remaining, buy smallest pack
  if (remaining > 0) {
    const smallest = tiers[0]
    const effective = doubleGems ? smallest.shards * 2 : smallest.shards
    while (remaining > 0) {
      cost += smallest.price
      remaining -= effective
    }
  }
  return cost
}

function formatInteger(n: number): string {
  return Math.round(n).toLocaleString('pt-BR')
}

// A banner has a pull target when the user set an estimated_pulls value
function hasEstimate(b: GachaBanner): boolean {
  return b.estimated_pulls > 0
}

// Game-specific labels for character targets
const GAME_CHAR_LABELS: Record<string, Record<CharTarget, string>> = {
  'Honkai: Star Rail': { E0: 'E0', E1: 'E1', E2: 'E2', E3: 'E3', E4: 'E4', E5: 'E5', E6: 'E6' },
  'Genshin Impact': { E0: 'C0', E1: 'C1', E2: 'C2', E3: 'C3', E4: 'C4', E5: 'C5', E6: 'C6' },
  'Zenless Zone Zero': { E0: 'M0', E1: 'M1', E2: 'M2', E3: 'M3', E4: 'M4', E5: 'M5', E6: 'M6' },
  'Honkai Impact 3rd': { E0: 'S', E1: 'SS', E2: 'SSS', E3: 'SSS', E4: 'SSS', E5: 'SSS', E6: 'SSS' },
}

const DEFAULT_CHAR_LABELS: Record<CharTarget, string> = {
  E0: 'E0', E1: 'E1', E2: 'E2', E3: 'E3', E4: 'E4', E5: 'E5', E6: 'E6',
}

// Game-specific labels for weapon targets
const GAME_WEAPON_LABELS: Record<string, Record<WeaponTarget, string>> = {
  'Honkai: Star Rail': { S1: 'S1', S2: 'S2', S3: 'S3', S4: 'S4', S5: 'S5' },
  'Genshin Impact': { S1: 'R1', S2: 'R2', S3: 'R3', S4: 'R4', S5: 'R5' },
  'Zenless Zone Zero': { S1: 'S1', S2: 'S2', S3: 'S3', S4: 'S4', S5: 'S5' },
  'Honkai Impact 3rd': { S1: 'S1', S2: 'S2', S3: 'S3', S4: 'S4', S5: 'S5' },
}

const DEFAULT_WEAPON_LABELS: Record<WeaponTarget, string> = {
  S1: 'S1', S2: 'S2', S3: 'S3', S4: 'S4', S5: 'S5',
}

function getCharLabel(game: string, target: CharTarget): string {
  const labels = GAME_CHAR_LABELS[game]
  if (labels !== undefined) return labels[target]
  return DEFAULT_CHAR_LABELS[target]
}

function getWeaponLabel(game: string, target: WeaponTarget): string {
  const labels = GAME_WEAPON_LABELS[game]
  if (labels !== undefined) return labels[target]
  return DEFAULT_WEAPON_LABELS[target]
}

const ALL_CHAR_TARGETS: CharTarget[] = ['E0', 'E1', 'E2', 'E3', 'E4', 'E5', 'E6']
const ALL_WEAPON_TARGETS: WeaponTarget[] = ['S1', 'S2', 'S3', 'S4', 'S5']

function parseCharTarget(val: string): CharTarget | null {
  if (val === '') return null
  const found = ALL_CHAR_TARGETS.find((t) => t === val)
  if (found === undefined) throw new Error(`Invalid CharTarget: ${val}`)
  return found
}

function parseWeaponTarget(val: string): WeaponTarget | null {
  if (val === '') return null
  const found = ALL_WEAPON_TARGETS.find((t) => t === val)
  if (found === undefined) throw new Error(`Invalid WeaponTarget: ${val}`)
  return found
}

function getTargetSummary(game: string, charTarget: CharTarget | null, weaponTarget: WeaponTarget | null): string {
  const parts: string[] = []
  if (charTarget !== null) parts.push(getCharLabel(game, charTarget))
  if (weaponTarget !== null) parts.push(getWeaponLabel(game, weaponTarget))
  return parts.length > 0 ? parts.join(' + ') : 'Sem objetivo'
}

// Game-specific group labels for dropdowns
function getCharGroupLabel(game: string): string {
  if (game === 'Genshin Impact') return 'Constelação'
  if (game === 'Honkai: Star Rail') return 'Eidolon'
  if (game === 'Zenless Zone Zero') return 'Mindscape'
  if (game === 'Honkai Impact 3rd') return 'Rank'
  return 'Personagem'
}

function getWeaponGroupLabel(game: string): string {
  if (game === 'Genshin Impact') return 'Arma (Refinamento)'
  if (game === 'Honkai: Star Rail') return 'Cone de Luz'
  if (game === 'Zenless Zone Zero') return 'W-Engine'
  if (game === 'Honkai Impact 3rd') return 'Arma Signature'
  return 'Arma / LC'
}

// Game names used in the "Jogo" dropdown and for identifying currency/tiers
const SUPPORTED_GAMES = [
  'Honkai: Star Rail',
  'Genshin Impact',
  'Zenless Zone Zero',
  'Honkai Impact 3rd',
  'Wuthering Waves',
  'Blue Archive',
] as const

const GAME_EMOJIS = new Map<string, string>([
  ['Genshin Impact', '🌸'],
  ['Wuthering Waves', '🌊'],
  ['Blue Archive', '📘'],
  ['Azur Lane', '⚓'],
  ['Honkai: Star Rail', '🚂'],
  ['Zenless Zone Zero', '📺'],
  ['Honkai Impact 3rd', '⚡'],
])

// ─── Helpers ─────────────────────────────────────────────────────────────────

function priorityStars(p: GachaPriority): string {
  return '★'.repeat(p) + '☆'.repeat(5 - p)
}

type BannerPhase = 'active' | 'upcoming' | 'ended'

function getBannerPhase(startDate: string, endDate: string): BannerPhase {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const start = new Date(startDate)
  const end = new Date(endDate)
  if (today < start) return 'upcoming'
  if (today > end) return 'ended'
  return 'active'
}

function phaseOrder(phase: BannerPhase): number {
  if (phase === 'active') return 0
  if (phase === 'upcoming') return 1
  return 2
}

type SafetyStatus = 'safe' | 'caution' | 'danger'

const PRIORITY_LEVELS: GachaPriority[] = [1, 2, 3, 4, 5]

interface BudgetAnalysis {
  total: number
  status: SafetyStatus
  label: string
  remaining: number
}

function analyzeBudget(banners: GachaBanner[], balance: number): BudgetAnalysis {
  const total = banners.reduce((s, b) => s + b.cost, 0)
  const remaining = balance - total
  let status: SafetyStatus
  let label: string

  if (remaining > balance * 0.4) {
    status = 'safe'
    label = '✓ Seguro'
  } else if (remaining > 0) {
    status = 'caution'
    label = '⚠ Cuidado'
  } else {
    status = 'danger'
    label = '✗ Perigo'
  }

  return { total, status, label, remaining }
}

const STATUS_COLORS: Record<SafetyStatus, { color: 'green' | 'yellow' | 'red'; bg: string; border: string }> = {
  safe: { color: 'green', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)' },
  caution: { color: 'yellow', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)' },
  danger: { color: 'red', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)' },
}

// ─── useLiveCountdown ─────────────────────────────────────────────────────────

function useLiveCountdown(targetDate: string): { days: number; hours: number; minutes: number; seconds: number; expired: boolean } {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => { setNow(new Date()) }, 1000)
    return () => { clearInterval(timer) }
  }, [])

  const target = new Date(targetDate + 'T00:00:00')
  const diff = target.getTime() - now.getTime()

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  return { days, hours, minutes, seconds, expired: false }
}

// ─── EstimatedPullsInput ──────────────────────────────────────────────────────

function EstimatedPullsInputInner({ defaultValue, onCommit }: { defaultValue: number; onCommit: (v: number) => void }) {
  const [local, setLocal] = useState(defaultValue === 0 ? '' : String(defaultValue))

  const commit = () => {
    const parsed = parseInt(local, 10)
    const final = isNaN(parsed) ? 0 : Math.max(0, parsed)
    if (final !== defaultValue) onCommit(final)
  }

  return (
    <input
      type="number"
      value={local}
      onChange={(e) => { setLocal(e.target.value) }}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') commit() }}
      placeholder="Est. pulls"
      style={{
        background: 'var(--color-surface2)',
        border: '1px solid var(--color-border)',
        borderRadius: 4,
        color: 'var(--color-text)',
        fontSize: 11,
        padding: '3px 6px',
        width: 80,
      }}
    />
  )
}

function EstimatedPullsInput({ value, onCommit }: { value: number; onCommit: (v: number) => void }) {
  // key forces remount when external value changes (e.g. after server save)
  return <EstimatedPullsInputInner key={value} defaultValue={value} onCommit={onCommit} />
}

// ─── BannerCard ───────────────────────────────────────────────────────────────

interface BannerEditData {
  game: string
  banner: string
  cost: number
  start_date: string
  end_date: string
  priority: GachaPriority
  char_target: CharTarget | null
  weapon_target: WeaponTarget | null
  char_current: CharTarget | null
  weapon_current: WeaponTarget | null
  estimated_pulls: number
  image_url: string | null
}

interface BannerCardProps {
  banner: GachaBanner
  onRemove: (id: number) => void
  editing: boolean
  onEdit: () => void
  onSave: (id: number, data: BannerEditData) => void
  onCancel: () => void
  onImagesChanged: () => void
  onSetCharTarget: (id: number, target: CharTarget | null) => void
  onSetWeaponTarget: (id: number, target: WeaponTarget | null) => void
  onSetCharCurrent: (id: number, target: CharTarget | null) => void
  onSetWeaponCurrent: (id: number, target: WeaponTarget | null) => void
  onSetEstimatedPulls: (id: number, pulls: number) => void
  allocatedPulls: number
  doubleGemsAvailable: boolean
}

function BannerCard({ banner, onRemove, editing, onEdit, onSave, onCancel, onImagesChanged, onSetCharTarget, onSetWeaponTarget, onSetCharCurrent, onSetWeaponCurrent, onSetEstimatedPulls, allocatedPulls, doubleGemsAvailable }: BannerCardProps) {
  const phase = getBannerPhase(banner.start_date, banner.end_date)
  const emoji = GAME_EMOJIS.get(banner.game) ?? '🎮'

  const daysToEnd = daysUntil(banner.end_date)

  // Carousel state
  const allImages: string[] = [
    ...(banner.image_url != null ? [banner.image_url] : []),
    ...banner.images.filter((img) => img.url !== banner.image_url).map((img) => img.url),
  ]
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    if (allImages.length <= 1) return
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % allImages.length)
    }, 5000)
    return () => { clearInterval(timer) }
  }, [allImages.length])

  // Edit form state
  const [editGame, setEditGame] = useState(banner.game)
  const [editBanner, setEditBanner] = useState(banner.banner)
  const [editCost, setEditCost] = useState(String(banner.cost))
  const [editStartDate, setEditStartDate] = useState(banner.start_date)
  const [editEndDate, setEditEndDate] = useState(banner.end_date)
  const [editPriority, setEditPriority] = useState<GachaPriority>(banner.priority)
  const [editImageUrl, setEditImageUrl] = useState(banner.image_url ?? '')

  // Image management state
  const [newImageUrl, setNewImageUrl] = useState('')

  // Live countdown
  const countdownTarget = phase === 'upcoming' ? banner.start_date : banner.end_date
  const countdown = useLiveCountdown(countdownTarget)

  // Progress bar fill %
  let progressFill = 0
  if (phase === 'active') {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const start = new Date(banner.start_date)
    const end = new Date(banner.end_date)
    const totalDuration = end.getTime() - start.getTime()
    const elapsed = today.getTime() - start.getTime()
    progressFill = totalDuration > 0 ? Math.min(100, Math.max(0, (elapsed / totalDuration) * 100)) : 0
  }

  const phaseBadge = (() => {
    if (phase === 'active') {
      return (
        <span
          style={{
            background: 'rgba(245,158,11,0.2)',
            color: '#f59e0b',
            border: '1px solid rgba(245,158,11,0.4)',
            borderRadius: 6,
            padding: '1px 6px',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#f59e0b',
              display: 'inline-block',
              animation: 'pulse 2s infinite',
            }}
          />
          ATIVO
        </span>
      )
    }
    if (phase === 'upcoming') {
      return (
        <span
          style={{
            background: 'rgba(139,92,246,0.2)',
            color: '#a78bfa',
            border: '1px solid rgba(139,92,246,0.4)',
            borderRadius: 6,
            padding: '1px 6px',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          PRÓXIMO
        </span>
      )
    }
    return (
      <span
        style={{
          background: 'rgba(100,100,100,0.2)',
          color: '#6b7280',
          border: '1px solid rgba(100,100,100,0.3)',
          borderRadius: 6,
          padding: '1px 6px',
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}
      >
        ENCERRADO
      </span>
    )
  })()


  const handleSaveEdit = () => {
    const cost = parseFloat(editCost)
    if (!editGame || !editBanner || isNaN(cost) || !editEndDate) return
    onSave(banner.id, {
      game: editGame,
      banner: editBanner,
      cost,
      start_date: editStartDate,
      end_date: editEndDate,
      priority: editPriority,
      char_target: banner.char_target,
      weapon_target: banner.weapon_target,
      char_current: banner.char_current,
      weapon_current: banner.weapon_current,
      estimated_pulls: banner.estimated_pulls,
      image_url: editImageUrl.trim() !== '' ? editImageUrl.trim() : null,
    })
  }

  const handleAddImage = async () => {
    const url = newImageUrl.trim()
    if (!url) return
    const r = await fetch(`/api/v1/gacha/banners/${String(banner.id)}/images`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, sort_order: banner.images.length }),
    })
    if (!r.ok) return
    setNewImageUrl('')
    onImagesChanged()
  }

  const handleAddImageFromUpload = async (url: string) => {
    const r = await fetch(`/api/v1/gacha/banners/${String(banner.id)}/images`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, sort_order: banner.images.length }),
    })
    if (!r.ok) return
    onImagesChanged()
  }

  const handleRemoveImage = async (imageId: number) => {
    await fetch(`/api/v1/gacha/banners/${String(banner.id)}/images/${String(imageId)}`, { method: 'DELETE' })
    onImagesChanged()
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'var(--color-surface)',
        border: `1px solid ${editing ? 'rgba(139,92,246,0.5)' : 'var(--color-border)'}`,
        transition: 'border-color 0.2s, box-shadow 0.2s',
        display: 'flex',
        flexDirection: editing ? 'column' : 'row',
        boxShadow: editing ? '0 4px 24px rgba(139,92,246,0.12)' : undefined,
      }}
      onMouseEnter={(e) => {
        if (editing) return
        const el = e.currentTarget
        el.style.borderColor = phase === 'active' ? 'rgba(245,158,11,0.4)' : phase === 'upcoming' ? 'rgba(139,92,246,0.4)' : 'var(--color-border)'
        el.style.boxShadow = phase === 'active' ? '0 4px 24px rgba(245,158,11,0.1)' : phase === 'upcoming' ? '0 4px 24px rgba(139,92,246,0.1)' : 'none'
      }}
      onMouseLeave={(e) => {
        if (editing) return
        const el = e.currentTarget
        el.style.borderColor = 'var(--color-border)'
        el.style.boxShadow = 'none'
      }}
    >
      {/* Compact Image */}
      {!editing && (
        <div
          style={{
            position: 'relative',
            width: 160,
            minWidth: 160,
            alignSelf: 'stretch',
            overflow: 'hidden',
            background: 'var(--color-surface2)',
            flexShrink: 0,
          }}

        >
          {allImages.length > 0 ? (
            <img
              key={currentImageIndex}
              src={allImages[currentImageIndex]}
              alt={banner.banner}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                animation: allImages.length > 1 ? 'carouselFadeIn 0.6s ease' : undefined,
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, var(--color-surface2) 0%, var(--color-border) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 36,
              }}
            >
              {emoji}
            </div>
          )}

          {/* Dot indicators — small, bottom */}
          {allImages.length > 1 && (
            <div
              style={{
                position: 'absolute',
                bottom: 4,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: 3,
                zIndex: 2,
              }}
            >
              {allImages.map((_, i) => (
                <span
                  key={i}
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: i === currentImageIndex ? '#fff' : 'rgba(255,255,255,0.4)',
                    display: 'block',
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Info Section */}
      <div style={{ padding: '12px 16px', flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {editing ? (
          /* ── Edit Form ── */
          <div>
            {/* Name + stars row */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>Jogo</label>
                <select value={editGame} onChange={(e) => { setEditGame(e.target.value) }}>
                  <option value="">Selecionar jogo...</option>
                  {SUPPORTED_GAMES.map((g) => (
                    <option key={g} value={g}>{GAME_EMOJIS.get(g) ?? '🎮'} {g}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>Personagem / Banner</label>
                <input
                  value={editBanner}
                  onChange={(e) => { setEditBanner(e.target.value) }}
                  placeholder="ex: Silver Wolf"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1 mb-3">
              <label className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>Imagem principal</label>
              <div className="flex items-center gap-3">
                <ImageCropUpload
                  aspectRatio={1}
                  onUploadComplete={(url) => { setEditImageUrl(url) }}
                  buttonLabel="Upload"
                />
                {editImageUrl && (
                  <div className="flex items-center gap-2">
                    <img src={editImageUrl} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} />
                    <button
                      type="button"
                      onClick={() => { setEditImageUrl('') }}
                      style={{ background: 'none', border: 'none', color: 'var(--color-red)', cursor: 'pointer', fontSize: 16 }}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>Custo (R$)</label>
                <CurrencyInput
                  value={parseFloat(editCost) || 0}
                  onChange={(v) => { setEditCost(String(v)) }}
                  placeholder="R$ 0,00"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>Início — Fim</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={editStartDate}
                    onChange={(e) => { setEditStartDate(e.target.value) }}
                    style={{ flex: 1 }}
                  />
                  <input
                    type="date"
                    value={editEndDate}
                    onChange={(e) => { setEditEndDate(e.target.value) }}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm" style={{ color: 'var(--color-muted)' }}>Prioridade:</span>
              <div className="flex gap-1">
                {PRIORITY_LEVELS.map((p) => (
                  <button
                    key={p}
                    onClick={() => { setEditPriority(p) }}
                    className="text-xl transition-all"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      opacity: p <= editPriority ? 1 : 0.25,
                      filter: p <= editPriority ? 'drop-shadow(0 0 4px #f59e0b)' : 'none',
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={onCancel}
                  style={{
                    background: 'var(--color-surface2)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-muted)',
                    borderRadius: 8,
                    padding: '6px 14px',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEdit}
                  style={{
                    background: 'var(--color-purple)',
                    border: 'none',
                    color: '#fff',
                    borderRadius: 8,
                    padding: '6px 14px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Salvar
                </button>
              </div>
            </div>

            {/* Image management */}
            <div
              style={{
                borderTop: '1px solid var(--color-border)',
                paddingTop: 14,
                marginTop: 4,
              }}
            >
              <p className="text-xs font-semibold mb-3" style={{ color: 'var(--color-muted)' }}>
                Imagens do carrossel
              </p>
              {banner.images.length > 0 && (
                <div className="flex flex-col gap-2 mb-3">
                  {banner.images.map((img) => (
                    <div
                      key={img.id}
                      className="flex items-center gap-3"
                      style={{
                        background: 'var(--color-surface2)',
                        borderRadius: 8,
                        padding: '6px 10px',
                      }}
                    >
                      <img
                        src={img.url}
                        alt=""
                        style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
                      />
                      <span
                        className="text-xs flex-1 truncate"
                        style={{ color: 'var(--color-muted)', minWidth: 0 }}
                        title={img.url}
                      >
                        {img.url}
                      </span>
                      <button
                        onClick={() => { void handleRemoveImage(img.id) }}
                        style={{
                          background: 'rgba(239,68,68,0.1)',
                          border: 'none',
                          color: 'var(--color-red)',
                          borderRadius: 6,
                          width: 28,
                          height: 28,
                          cursor: 'pointer',
                          flexShrink: 0,
                          fontSize: 14,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex flex-col gap-2">
                <ImageCropUpload
                  aspectRatio={1}
                  onUploadComplete={(url) => { void handleAddImageFromUpload(url) }}
                  buttonLabel="+ Upload Imagem"
                />
                <div className="flex gap-2">
                  <input
                    value={newImageUrl}
                    onChange={(e) => { setNewImageUrl(e.target.value) }}
                    placeholder="ou cole uma URL"
                    style={{ flex: 1 }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { void handleAddImage() } }}
                  />
                  <button
                    onClick={() => { void handleAddImage() }}
                    style={{
                      background: 'var(--color-surface2)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                      borderRadius: 8,
                      padding: '0 14px',
                      fontSize: 13,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    + URL
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ── Display Mode ── */
          <>
            {/* Row 1: Name + action buttons */}
            <div className="flex items-start justify-between gap-2">
              <h4
                className="font-bold text-base leading-tight"
                style={{ color: 'var(--color-text)', flex: 1, minWidth: 0 }}
              >
                {banner.banner}
              </h4>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={onEdit}
                  className="opacity-60 hover:opacity-100 transition-opacity"
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(139,92,246,0.15)',
                    color: 'var(--color-purple)',
                    border: '1px solid rgba(139,92,246,0.25)',
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                  title="Editar banner"
                >
                  ✏️
                </button>
                <button
                  onClick={() => { onRemove(banner.id) }}
                  className="opacity-60 hover:opacity-100 transition-opacity"
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(239,68,68,0.15)',
                    color: 'var(--color-red)',
                    border: '1px solid rgba(239,68,68,0.25)',
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                  title="Remover banner"
                >
                  🗑
                </button>
              </div>
            </div>

            {/* Row 2: Game + Phase badge */}
            <div className="flex items-center gap-2" style={{ marginTop: 2 }}>
              <span style={{ fontSize: 13, color: 'var(--color-muted)' }}>
                {emoji} {banner.game}
              </span>
              {phaseBadge}
            </div>

            {/* Row 3: Stars (small) */}
            <div style={{ color: '#f59e0b', fontSize: 14, letterSpacing: 1, marginTop: 3 }}>
              {priorityStars(banner.priority)}
            </div>

            {/* Row 4: Clear dates + live countdown */}
            <div style={{ marginTop: 6 }}>
              {/* Clear date labels */}
              <div style={{ display: 'flex', gap: 8, fontSize: 12, marginBottom: 6 }}>
                <span style={{ color: 'var(--color-muted)' }}>
                  Início: <strong style={{ color: 'var(--color-text)' }}>
                    {new Date(banner.start_date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </strong>
                </span>
                <span style={{ color: 'var(--color-muted)' }}>
                  Fim: <strong style={{ color: phase === 'active' && daysToEnd <= 5 ? 'var(--color-red)' : 'var(--color-text)' }}>
                    {new Date(banner.end_date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </strong>
                </span>
              </div>

              {/* Live countdown */}
              {phase !== 'ended' && !countdown.expired && (
                <div
                  style={{
                    display: 'flex',
                    gap: 6,
                    marginBottom: 6,
                  }}
                >
                  {[
                    { val: countdown.days, unit: 'd' },
                    { val: countdown.hours, unit: 'h' },
                    { val: countdown.minutes, unit: 'm' },
                    { val: countdown.seconds, unit: 's' },
                  ].map((item) => (
                    <div
                      key={item.unit}
                      style={{
                        background: phase === 'active' ? 'rgba(245,158,11,0.1)' : 'rgba(139,92,246,0.1)',
                        border: `1px solid ${phase === 'active' ? 'rgba(245,158,11,0.2)' : 'rgba(139,92,246,0.2)'}`,
                        borderRadius: 6,
                        padding: '3px 6px',
                        textAlign: 'center',
                        minWidth: 36,
                      }}
                    >
                      <div style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: phase === 'active' ? '#f59e0b' : '#a78bfa',
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        {String(item.val).padStart(2, '0')}
                      </div>
                      <div style={{ fontSize: 9, color: 'var(--color-muted)', textTransform: 'uppercase' }}>
                        {item.unit}
                      </div>
                    </div>
                  ))}
                  <span style={{
                    fontSize: 11,
                    color: phase === 'active'
                      ? (daysToEnd <= 3 ? 'var(--color-red)' : '#f59e0b')
                      : '#a78bfa',
                    fontWeight: 600,
                    alignSelf: 'center',
                    marginLeft: 4,
                  }}>
                    {phase === 'upcoming' ? 'para chegar' : (daysToEnd <= 3 ? 'restantes!' : 'restantes')}
                  </span>
                </div>
              )}

              {phase === 'ended' && (
                <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>Encerrado</span>
              )}

              {/* Progress bar */}
              {phase !== 'ended' && (
                <div
                  style={{
                    height: 4,
                    borderRadius: 99,
                    background: 'var(--color-surface2)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      borderRadius: 99,
                      width: phase === 'active' ? `${String(progressFill)}%` : '8%',
                      background:
                        phase === 'active'
                          ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                          : 'linear-gradient(90deg, #7c3aed, #a78bfa)',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              )}
            </div>

            {/* Row 6: Stats — 2 lines for breathing room */}
            <div
              style={{
                marginTop: 'auto',
                paddingTop: 8,
                borderTop: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                fontSize: 12,
              }}
            >
              {/* Line 1: progress, dates */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span>
                  <span style={{ color: 'var(--color-muted)' }}>🎯 </span>
                  {(() => {
                    const progress = banner.pulls + allocatedPulls
                    const est = banner.estimated_pulls
                    const complete = hasEstimate(banner) && progress >= est
                    return (
                      <>
                        <span style={{ fontWeight: 600, color: complete ? 'var(--color-green)' : 'var(--color-text)' }}>
                          <AnimatedNumber value={hasEstimate(banner) ? Math.min(progress, est) : banner.pulls} />
                        </span>
                        {hasEstimate(banner) && (
                          <span style={{ color: 'var(--color-muted)' }}>/{est}</span>
                        )}
                      </>
                    )
                  })()}
                </span>
                <span style={{ marginLeft: 'auto' }}>
                  <span style={{ color: 'var(--color-muted)' }}>📅 </span>
                  <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                    {banner.start_date.split('-').slice(1).reverse().join('/')}
                  </span>
                  <span style={{ color: 'var(--color-muted)', margin: '0 3px' }}>→</span>
                  <span
                    style={{
                      fontWeight: 600,
                      color:
                        phase === 'ended'
                          ? '#6b7280'
                          : phase === 'active' && daysToEnd <= 5
                            ? 'var(--color-red)'
                            : 'var(--color-text)',
                    }}
                  >
                    {banner.end_date.split('-').slice(1).reverse().join('/')}
                  </span>
                </span>
              </div>

              {/* Line 2: estimated pulls input + informational labels + cost indicator */}
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Estimated pulls input (saves on blur) */}
                <span style={{ color: 'var(--color-muted)', fontSize: 11 }}>🏆</span>
                <EstimatedPullsInput
                  value={banner.estimated_pulls}
                  onCommit={(val) => { onSetEstimatedPulls(banner.id, val) }}
                />

                {/* Current + Target selects with auto-calculation */}
                <span style={{ color: 'var(--color-muted)', fontSize: 10 }}>
                  {getCharGroupLabel(banner.game)}:
                </span>
                <select
                  value={banner.char_current ?? ''}
                  onChange={(e) => {
                    const val = parseCharTarget(e.target.value)
                    onSetCharCurrent(banner.id, val)
                    // Auto-recalculate estimated pulls
                    const auto = calculateEstimatedPulls(banner.game, val, banner.char_target, banner.weapon_current, banner.weapon_target)
                    if (auto > 0) onSetEstimatedPulls(banner.id, auto)
                  }}
                  style={{
                    background: 'var(--color-surface2)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 4,
                    color: 'var(--color-text)',
                    fontSize: 10,
                    padding: '2px 4px',
                    cursor: 'pointer',
                    minWidth: 46,
                  }}
                  title="Atual"
                >
                  <option value="">—</option>
                  {ALL_CHAR_TARGETS.map((t) => (
                    <option key={t} value={t}>{getCharLabel(banner.game, t)}</option>
                  ))}
                </select>
                <span style={{ color: 'var(--color-muted)', fontSize: 10 }}>→</span>
                <select
                  value={banner.char_target ?? ''}
                  onChange={(e) => {
                    const val = parseCharTarget(e.target.value)
                    onSetCharTarget(banner.id, val)
                    const auto = calculateEstimatedPulls(banner.game, banner.char_current, val, banner.weapon_current, banner.weapon_target)
                    if (auto > 0) onSetEstimatedPulls(banner.id, auto)
                  }}
                  style={{
                    background: 'var(--color-surface2)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 4,
                    color: 'var(--color-muted)',
                    fontSize: 10,
                    padding: '2px 4px',
                    cursor: 'pointer',
                    minWidth: 46,
                  }}
                  title={getCharGroupLabel(banner.game)}
                >
                  <option value="">—</option>
                  {ALL_CHAR_TARGETS.map((t) => (
                    <option key={t} value={t}>{getCharLabel(banner.game, t)}</option>
                  ))}
                </select>
                <span style={{ color: 'var(--color-muted)', fontSize: 10 }}>|</span>
                <span style={{ color: 'var(--color-muted)', fontSize: 10 }}>
                  {getWeaponGroupLabel(banner.game)}:
                </span>
                <select
                  value={banner.weapon_current ?? ''}
                  onChange={(e) => {
                    const val = parseWeaponTarget(e.target.value)
                    onSetWeaponCurrent(banner.id, val)
                    const auto = calculateEstimatedPulls(banner.game, banner.char_current, banner.char_target, val, banner.weapon_target)
                    if (auto > 0) onSetEstimatedPulls(banner.id, auto)
                  }}
                  style={{
                    background: 'var(--color-surface2)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 4,
                    color: 'var(--color-text)',
                    fontSize: 10,
                    padding: '2px 4px',
                    cursor: 'pointer',
                    minWidth: 46,
                  }}
                  title="Atual"
                >
                  <option value="">—</option>
                  {ALL_WEAPON_TARGETS.map((t) => (
                    <option key={t} value={t}>{getWeaponLabel(banner.game, t)}</option>
                  ))}
                </select>
                <span style={{ color: 'var(--color-muted)', fontSize: 10 }}>→</span>
                <select
                  value={banner.weapon_target ?? ''}
                  onChange={(e) => {
                    const val = parseWeaponTarget(e.target.value)
                    onSetWeaponTarget(banner.id, val)
                    const auto = calculateEstimatedPulls(banner.game, banner.char_current, banner.char_target, banner.weapon_current, val)
                    if (auto > 0) onSetEstimatedPulls(banner.id, auto)
                  }}
                  style={{
                    background: 'var(--color-surface2)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 4,
                    color: 'var(--color-muted)',
                    fontSize: 10,
                    padding: '2px 4px',
                    cursor: 'pointer',
                    minWidth: 46,
                  }}
                  title={getWeaponGroupLabel(banner.game)}
                >
                  <option value="">—</option>
                  {ALL_WEAPON_TARGETS.map((t) => (
                    <option key={t} value={t}>{getWeaponLabel(banner.game, t)}</option>
                  ))}
                </select>

                {/* Cost indicator — based on estimated_pulls */}
                {hasEstimate(banner) && (() => {
                  const pullsNeeded = Math.max(0, banner.estimated_pulls - banner.pulls)
                  const pullsToCash = Math.max(0, pullsNeeded - allocatedPulls)
                  const currencyToCash = pullsToCash * getCurrencyPerPull(banner.game)
                  const cashCost = calculateCashCost(currencyToCash, doubleGemsAvailable, banner.game)

                  if (pullsNeeded === 0) {
                    return <span style={{ color: 'var(--color-green)', fontWeight: 600, fontSize: 11 }}>✓ Completo</span>
                  }
                  if (cashCost === 0) {
                    return <span style={{ color: 'var(--color-green)', fontWeight: 600, fontSize: 11 }}>✓ Coberto pelo estoque</span>
                  }
                  return (
                    <span style={{ fontSize: 11 }}>
                      <span style={{ color: 'var(--color-muted)' }}>Cashar: </span>
                      <span style={{ color: 'var(--color-red)', fontWeight: 700 }}>
                        {formatCurrency(cashCost)}
                      </span>
                    </span>
                  )
                })()}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Gacha() {
  const [refreshKey, setRefreshKey] = useState(0)
  const { data: serverBanners } = useFetch(`/gacha/banners?_=${String(refreshKey)}`, decodeBannerList)
  const { data: summary } = useFetch('/summary/', decodeSummary)
  const { data: stashes } = useFetch(`/gacha/stashes?_=${String(refreshKey)}`, decodeGachaStashMultiList)
  const { data: appSettings } = useFetch('/settings/', decodeAppSettings)
  const [additions, setAdditions] = useState<GachaBanner[]>([])
  const [deletedIds, setDeletedIds] = useState<number[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingStashGame, setEditingStashGame] = useState<string | null>(null)
  const [stashCurrency, setStashCurrency] = useState('')
  const [stashPasses, setStashPasses] = useState('')
  const [stashDouble, setStashDouble] = useState(true)
  const [editingManualBalance, setEditingManualBalance] = useState(false)
  const [manualBalanceInput, setManualBalanceInput] = useState('')
  const [formGame, setFormGame] = useState('')
  const [formBanner, setFormBanner] = useState('')
  const [formCost, setFormCost] = useState('')
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [formEndDate, setFormEndDate] = useState('')
  const [formPriority, setFormPriority] = useState<GachaPriority>(3)
  const [formImageUrl, setFormImageUrl] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)

  const serverBannerIds = new Set((serverBanners ?? []).map((b) => b.id))
  const pendingBannerAdditions = additions.filter((a) => !serverBannerIds.has(a.id))
  const banners = [...pendingBannerAdditions, ...(serverBanners ?? []).filter((b) => !deletedIds.includes(b.id))]
  const transactionBalance = summary?.monthly_finances.balance ?? 0
  const manualBalance = appSettings?.manual_balance ?? 0
  const availableBalance = transactionBalance !== 0 ? transactionBalance : manualBalance
  const budget = analyzeBudget(banners, availableBalance)
  const statusStyle = STATUS_COLORS[budget.status]

  const sortedBanners = [...banners].sort((a, b) => {
    const phaseA = phaseOrder(getBannerPhase(a.start_date, a.end_date))
    const phaseB = phaseOrder(getBannerPhase(b.start_date, b.end_date))
    if (phaseA !== phaseB) return phaseA - phaseB
    const dateComp = a.start_date.localeCompare(b.start_date)
    if (dateComp !== 0) return dateComp
    return b.priority - a.priority
  })

  const handleAdd = async () => {
    const cost = parseFloat(formCost)
    if (!formGame || !formBanner || isNaN(cost) || !formEndDate) return
    const body = {
      game: formGame,
      banner: formBanner,
      cost,
      start_date: formStartDate,
      end_date: formEndDate,
      priority: formPriority,
      pulls: 0,
      char_target: null,
      weapon_target: null,
      char_current: null,
      weapon_current: null,
      image_url: formImageUrl.trim() !== '' ? formImageUrl.trim() : null,
    }
    const r = await fetch('/api/v1/gacha/banners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!r.ok) return
    const raw: unknown = await r.json()
    const created = decodeGachaBanner(raw)
    setAdditions((prev) => [...prev, created])
    setShowForm(false)
    setFormGame('')
    setFormBanner('')
    setFormCost('')
    setFormEndDate('')
    setFormImageUrl('')
  }

  const handleRemove = async (id: number) => {
    await fetch(`/api/v1/gacha/banners/${String(id)}`, { method: 'DELETE' })
    setAdditions((prev) => prev.filter((b) => b.id !== id))
    setDeletedIds((prev) => [...prev, id])
  }

  const handleSave = async (id: number, data: BannerEditData) => {
    const existingBanner = banners.find((b) => b.id === id)
    const body = {
      ...data,
      pulls: existingBanner?.pulls ?? 0,
    }
    const r = await fetch(`/api/v1/gacha/banners/${String(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!r.ok) return
    setAdditions((prev) => prev.filter((b) => b.id !== id))
    setRefreshKey((k) => k + 1)
    setEditingId(null)
  }

  // Helper to get stash for a specific game
  function getGameStash(game: string): GachaStashMulti | undefined {
    return (stashes ?? []).find((s) => s.game === game)
  }

  // Detect which games have active banners
  const activeGames = [...new Set(banners.map((b) => b.game))]

  // Allocate stash pulls to banners by priority, per game
  const stashAllocation: Map<number, number> = (() => {
    const alloc = new Map<number, number>()
    // Group banners by game
    const byGame = new Map<string, GachaBanner[]>()
    for (const b of banners.filter(hasEstimate)) {
      const existing = byGame.get(b.game) ?? []
      existing.push(b)
      byGame.set(b.game, existing)
    }
    // For each game, allocate from that game's stash
    for (const [game, gameBanners] of byGame) {
      const gameStash = getGameStash(game)
      const currencyPerPull = getCurrencyPerPull(game)
      const pullsFromCurrency = Math.floor((gameStash?.premium_currency ?? 0) / currencyPerPull)
      const gamePulls = pullsFromCurrency + (gameStash?.passes ?? 0)
      let remainingPool = gamePulls
      gameBanners
        .sort((a, b) => a.priority - b.priority)
        .forEach((b) => {
          const pullsNeeded = Math.max(0, b.estimated_pulls - b.pulls)
          const coveredByStash = Math.min(pullsNeeded, remainingPool)
          alloc.set(b.id, coveredByStash)
          remainingPool = Math.max(0, remainingPool - coveredByStash)
        })
    }
    return alloc
  })()

  // Calculate total cash needed from pull calculator (uses estimated_pulls, per-game double gems)
  const totalCashNeeded = (() => {
    let totalCash = 0
    banners
      .filter(hasEstimate)
      .forEach((b) => {
        const pullsNeeded = Math.max(0, b.estimated_pulls - b.pulls)
        const allocated = stashAllocation.get(b.id) ?? 0
        const pullsToCash = Math.max(0, pullsNeeded - allocated)
        const currencyToCash = pullsToCash * getCurrencyPerPull(b.game)
        const gameStash = getGameStash(b.game)
        const gameDoubleGems = gameStash?.double_gems_available ?? true
        const cashCost = calculateCashCost(currencyToCash, gameDoubleGems, b.game)
        totalCash += cashCost
      })
    return totalCash
  })()

  function openStashEdit(game: string) {
    const gameStash = getGameStash(game)
    setStashCurrency(String(gameStash?.premium_currency ?? 0))
    setStashPasses(String(gameStash?.passes ?? 0))
    setStashDouble(gameStash?.double_gems_available ?? true)
    setEditingStashGame(game)
  }

  const handleSaveStash = async () => {
    if (editingStashGame === null) return
    const currency = parseInt(stashCurrency, 10)
    const passes = parseInt(stashPasses, 10)
    if (isNaN(currency) || isNaN(passes)) return
    await fetch(`/api/v1/gacha/stash/game?game=${encodeURIComponent(editingStashGame)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ premium_currency: currency, passes, double_gems_available: stashDouble }),
    })
    setEditingStashGame(null)
    setRefreshKey((k) => k + 1)
  }

  const makeBannerBody = (b: GachaBanner, overrides: Partial<Pick<GachaBanner, 'char_target' | 'weapon_target' | 'char_current' | 'weapon_current' | 'estimated_pulls'>>) => ({
    game: b.game, banner: b.banner, cost: b.cost, start_date: b.start_date,
    end_date: b.end_date, priority: b.priority, pulls: b.pulls,
    char_target: overrides.char_target !== undefined ? overrides.char_target : b.char_target,
    weapon_target: overrides.weapon_target !== undefined ? overrides.weapon_target : b.weapon_target,
    char_current: overrides.char_current !== undefined ? overrides.char_current : b.char_current,
    weapon_current: overrides.weapon_current !== undefined ? overrides.weapon_current : b.weapon_current,
    estimated_pulls: overrides.estimated_pulls ?? b.estimated_pulls,
    image_url: b.image_url,
  })

  const handleSetCharTarget = async (bannerId: number, charTarget: CharTarget | null) => {
    const b = banners.find((x) => x.id === bannerId)
    if (b === undefined) return
    await fetch(`/api/v1/gacha/banners/${String(bannerId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(makeBannerBody(b, { char_target: charTarget })),
    })
    setRefreshKey((k) => k + 1)
  }

  const handleSetWeaponTarget = async (bannerId: number, weaponTarget: WeaponTarget | null) => {
    const b = banners.find((x) => x.id === bannerId)
    if (b === undefined) return
    await fetch(`/api/v1/gacha/banners/${String(bannerId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(makeBannerBody(b, { weapon_target: weaponTarget })),
    })
    setRefreshKey((k) => k + 1)
  }

  const handleSetEstimatedPulls = async (bannerId: number, estimatedPulls: number) => {
    const b = banners.find((x) => x.id === bannerId)
    if (b === undefined) return
    await fetch(`/api/v1/gacha/banners/${String(bannerId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(makeBannerBody(b, { estimated_pulls: estimatedPulls })),
    })
    setRefreshKey((k) => k + 1)
  }

  const handleSetCharCurrent = async (bannerId: number, charCurrent: CharTarget | null) => {
    const b = banners.find((x) => x.id === bannerId)
    if (b === undefined) return
    await fetch(`/api/v1/gacha/banners/${String(bannerId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(makeBannerBody(b, { char_current: charCurrent })),
    })
    setRefreshKey((k) => k + 1)
  }

  const handleSetWeaponCurrent = async (bannerId: number, weaponCurrent: WeaponTarget | null) => {
    const b = banners.find((x) => x.id === bannerId)
    if (b === undefined) return
    await fetch(`/api/v1/gacha/banners/${String(bannerId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(makeBannerBody(b, { weapon_current: weaponCurrent })),
    })
    setRefreshKey((k) => k + 1)
  }

  const handleSaveManualBalance = async () => {
    const val = parseFloat(manualBalanceInput)
    if (isNaN(val)) return
    await fetch('/api/v1/settings/', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ manual_balance: val }),
    })
    setEditingManualBalance(false)
    setRefreshKey((k) => k + 1)
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100 }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
            🎲 Gacha Tracker
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            Planeje seus pulls e controle o impacto financeiro
          </p>
        </div>
        <Button
          onClick={() => {
            setShowForm((v) => !v)
          }}
          variant={showForm ? 'outline' : 'primary'}
        >
          {showForm ? 'Cancelar' : '+ Adicionar Banner'}
        </Button>
      </div>

      {/* Budget Indicator */}
      <div
        className="rounded-2xl p-5 mb-6"
        style={{
          background: statusStyle.bg,
          border: `1px solid ${statusStyle.border}`,
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm mb-1" style={{ color: 'var(--color-muted)' }}>
              Saldo disponível:{' '}
              {editingManualBalance ? (
                <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                  <CurrencyInput
                    value={parseFloat(manualBalanceInput) || 0}
                    onChange={(v) => { setManualBalanceInput(String(v)) }}
                    placeholder="R$ 0,00"
                  />
                  <button onClick={() => { void handleSaveManualBalance() }} style={{ background: 'var(--color-green)', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontSize: 11 }}>OK</button>
                  <button onClick={() => { setEditingManualBalance(false) }} style={{ background: 'var(--color-surface2)', color: 'var(--color-muted)', border: '1px solid var(--color-border)', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontSize: 11 }}>×</button>
                </span>
              ) : (
                <>
                  <strong style={{ color: 'var(--color-text)' }}>
                    <AnimatedNumber value={availableBalance} formatter={formatCurrency} />
                  </strong>
                  {transactionBalance === 0 && (
                    <button
                      onClick={() => { setManualBalanceInput(String(manualBalance)); setEditingManualBalance(true) }}
                      style={{ background: 'none', border: 'none', color: 'var(--color-purple)', cursor: 'pointer', fontSize: 10, marginLeft: 4 }}
                    >
                      {manualBalance > 0 ? '(manual) ✏️' : '(definir saldo) ✏️'}
                    </button>
                  )}
                </>
              )}
              {'  ·  '}
              Cash necessário (calculadora):{' '}
              <strong style={{ color: totalCashNeeded > 0 ? 'var(--color-yellow)' : 'var(--color-green)' }}>
                <AnimatedNumber value={totalCashNeeded} formatter={formatCurrency} />
              </strong>
            </p>
            <p className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
              {totalCashNeeded === 0 ? (
                <>Estoque cobre todos os pulls — sem gasto necessário</>
              ) : availableBalance >= totalCashNeeded ? (
                <>Saldo cobre o cash · Sobraria <AnimatedNumber value={availableBalance - totalCashNeeded} formatter={formatCurrency} /></>
              ) : (
                <>Faltariam <AnimatedNumber value={totalCashNeeded - availableBalance} formatter={formatCurrency} /> para cobrir todos os pulls</>
              )}
            </p>
          </div>
          <Badge color={statusStyle.color} size="lg" pulse={budget.status === 'danger'}>
            {budget.label}
          </Badge>
        </div>
      </div>

      {/* Stash Panel */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
            💎 Estoque de Recursos
          </p>
        </div>

        {activeGames.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Adicione banners para ver o estoque por jogo</p>
        ) : (
          <div className="flex flex-col gap-3">
            {activeGames.map((game) => {
              const gameStash = getGameStash(game)
              const labels = getCurrencyLabels(game)
              const currencyPerPull = getCurrencyPerPull(game)
              const gameCurrency = gameStash?.premium_currency ?? 0
              const gamePasses = gameStash?.passes ?? 0
              const gameDouble = gameStash?.double_gems_available ?? true
              const pullsFromCurrency = Math.floor(gameCurrency / currencyPerPull)
              const gameTotalPulls = pullsFromCurrency + gamePasses
              const leftover = gameCurrency % currencyPerPull
              const emoji = GAME_EMOJIS.get(game) ?? '🎮'
              const isEditing = editingStashGame === game

              return (
                <div
                  key={game}
                  className="rounded-xl p-3"
                  style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                      {emoji} {game}
                    </span>
                    {!isEditing && (
                      <button
                        onClick={() => { openStashEdit(game) }}
                        className="text-xs font-medium px-2 py-1 rounded-md"
                        style={{
                          background: 'rgba(139,92,246,0.1)',
                          color: 'var(--color-purple)',
                          cursor: 'pointer',
                          border: 'none',
                        }}
                      >
                        Atualizar
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="grid grid-cols-4 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs" style={{ color: 'var(--color-muted)' }}>{labels.premium}</label>
                        <input
                          type="number"
                          value={stashCurrency}
                          onChange={(e) => { setStashCurrency(e.target.value) }}
                          placeholder="0"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs" style={{ color: 'var(--color-muted)' }}>{labels.passes}</label>
                        <input
                          type="number"
                          value={stashPasses}
                          onChange={(e) => { setStashPasses(e.target.value) }}
                          placeholder="0"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs" style={{ color: 'var(--color-muted)' }}>Double Gems</label>
                        <select
                          value={stashDouble ? 'yes' : 'no'}
                          onChange={(e) => { setStashDouble(e.target.value === 'yes') }}
                        >
                          <option value="yes">Disponível</option>
                          <option value="no">Não disponível</option>
                        </select>
                      </div>
                      <div className="flex items-end gap-2">
                        <Button size="sm" onClick={() => { void handleSaveStash() }}>Salvar</Button>
                        <Button size="sm" variant="outline" onClick={() => { setEditingStashGame(null) }}>×</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-4 items-center">
                      <div>
                        <p className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
                          <AnimatedNumber value={gameCurrency} formatter={formatInteger} />
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{labels.premium}</p>
                      </div>
                      <div>
                        <p className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
                          <AnimatedNumber value={gamePasses} />
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{labels.passes}</p>
                      </div>
                      <div style={{ width: 1, background: 'var(--color-border)', alignSelf: 'stretch', margin: '2px 0' }} />
                      <div>
                        <p className="text-base font-bold" style={{ color: '#a78bfa' }}>
                          <AnimatedNumber value={gameTotalPulls} />
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                          Pulls{leftover > 0 && <span> (+{leftover})</span>}
                        </p>
                      </div>
                      <div style={{ width: 1, background: 'var(--color-border)', alignSelf: 'stretch', margin: '2px 0' }} />
                      <div>
                        <p className="text-xs" style={{ color: gameDouble ? '#f59e0b' : 'var(--color-muted)' }}>
                          {gameDouble ? '✨ Double Gems' : '💰 Normal'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Per-banner pull calculator */}
        {banners.some(hasEstimate) && (
          <div style={{ borderTop: '1px solid var(--color-border)', marginTop: 12, paddingTop: 12 }}>
            <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
              Calculadora de Pulls
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {banners
                .filter(hasEstimate)
                .sort((a, b) => a.priority - b.priority)
                .map((b) => {
                  const pullsNeeded = Math.max(0, b.estimated_pulls - b.pulls)
                  const allocated = stashAllocation.get(b.id) ?? 0
                  const pullsToCash = Math.max(0, pullsNeeded - allocated)
                  const currencyToCash = pullsToCash * getCurrencyPerPull(b.game)
                  const gameDoubleGems = getGameStash(b.game)?.double_gems_available ?? true
                  const cashCost = calculateCashCost(currencyToCash, gameDoubleGems, b.game)
                  const targetLabel = getTargetSummary(b.game, b.char_target, b.weapon_target)
                  const progress = Math.min(b.pulls + allocated, b.estimated_pulls)

                  return (
                    <div
                      key={b.id}
                      className="flex items-center justify-between p-3 rounded-xl"
                      style={{ background: 'var(--color-surface2)' }}
                    >
                      <div className="flex items-center gap-3" style={{ flex: 1, minWidth: 0 }}>
                        <span className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>
                          {b.banner}
                        </span>
                        {targetLabel !== 'Sem objetivo' && (
                          <Badge color="purple" size="xs">{targetLabel}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4" style={{ flexShrink: 0 }}>
                        <div className="text-right">
                          <span className="text-xs" style={{ color: progress >= b.estimated_pulls ? 'var(--color-green)' : 'var(--color-muted)' }}>
                            {progress}/{b.estimated_pulls} pulls
                          </span>
                        </div>
                        <div className="text-right" style={{ minWidth: 80 }}>
                          {pullsNeeded === 0 ? (
                            <span className="text-xs font-bold" style={{ color: 'var(--color-green)' }}>✓ Completo</span>
                          ) : allocated >= pullsNeeded ? (
                            <span className="text-xs font-bold" style={{ color: 'var(--color-green)' }}>
                              ✓ Coberto ({allocated} pulls)
                            </span>
                          ) : (
                            <div>
                              {allocated > 0 && (
                                <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                                  {allocated} do estoque +{' '}
                                </span>
                              )}
                              <span className="text-xs font-bold" style={{ color: 'var(--color-red)' }}>
                                {pullsToCash} a cashar
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-right" style={{ minWidth: 90 }}>
                          <span
                            className="text-sm font-bold"
                            style={{ color: cashCost === 0 ? 'var(--color-green)' : 'var(--color-yellow)' }}
                          >
                            {cashCost === 0 ? 'R$ 0' : formatCurrency(cashCost)}
                          </span>
                        </div>
                        </div>
                      </div>
                    )
                  })}
            </div>
          </div>
        )}
      </Card>

      {/* Add Form */}
      {showForm && (
        <Card className="mb-6 animate-fade-in">
          <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--color-text)' }}>
            Novo Banner
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>
                Jogo
              </label>
              <select value={formGame} onChange={(e) => { setFormGame(e.target.value) }}>
                <option value="">Selecionar jogo...</option>
                {SUPPORTED_GAMES.map((g) => (
                  <option key={g} value={g}>{GAME_EMOJIS.get(g) ?? '🎮'} {g}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>
                Personagem / Banner
              </label>
              <input
                placeholder="ex: Silver Wolf Lv.999"
                value={formBanner}
                onChange={(e) => {
                  setFormBanner(e.target.value)
                }}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1 mt-4">
            <label className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>
              Imagem principal
            </label>
            <div className="flex items-center gap-3">
              <ImageCropUpload
                aspectRatio={1}
                onUploadComplete={(url) => { setFormImageUrl(url) }}
                buttonLabel="Upload Imagem"
              />
              {formImageUrl && (
                <div className="flex items-center gap-2">
                  <img src={formImageUrl} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} />
                  <button
                    type="button"
                    onClick={() => { setFormImageUrl('') }}
                    style={{ background: 'none', border: 'none', color: 'var(--color-red)', cursor: 'pointer', fontSize: 16 }}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>
                Custo Estimado (R$)
              </label>
              <CurrencyInput
                value={parseFloat(formCost) || 0}
                onChange={(v) => { setFormCost(String(v)) }}
                placeholder="R$ 0,00"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>
                Início — Fim
              </label>
              <div className="flex gap-3">
                <input
                  type="date"
                  value={formStartDate}
                  onChange={(e) => {
                    setFormStartDate(e.target.value)
                  }}
                  style={{ flex: 1 }}
                />
                <input
                  type="date"
                  value={formEndDate}
                  onChange={(e) => {
                    setFormEndDate(e.target.value)
                  }}
                  style={{ flex: 1 }}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <span className="text-sm" style={{ color: 'var(--color-muted)' }}>
              Prioridade:
            </span>
            <div className="flex gap-1">
              {PRIORITY_LEVELS.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setFormPriority(p)
                  }}
                  className="text-xl transition-all"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    opacity: p <= formPriority ? 1 : 0.25,
                    filter: p <= formPriority ? 'drop-shadow(0 0 4px #f59e0b)' : 'none',
                  }}
                >
                  ★
                </button>
              ))}
            </div>
            <Button
              onClick={() => {
                void handleAdd()
              }}
              className="ml-auto"
            >
              Salvar
            </Button>
          </div>
        </Card>
      )}

      {/* Banner List */}
      {banners.length === 0 ? (
        <p className="text-center py-8" style={{ color: 'var(--color-muted)' }}>
          Nenhum banner cadastrado
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {sortedBanners.map((banner) => (
            <div
              key={banner.id}
              style={{ gridColumn: editingId === banner.id ? '1 / -1' : undefined }}
            >
              <BannerCard
                banner={banner}
                onRemove={(id) => { void handleRemove(id) }}
                editing={editingId === banner.id}
                onEdit={() => { setEditingId(banner.id) }}
                onSave={(id, data) => { void handleSave(id, data) }}
                onCancel={() => { setEditingId(null) }}
                onImagesChanged={() => { setRefreshKey((k) => k + 1) }}
                onSetCharTarget={(id, t) => { void handleSetCharTarget(id, t) }}
                onSetWeaponTarget={(id, t) => { void handleSetWeaponTarget(id, t) }}
                onSetCharCurrent={(id, t) => { void handleSetCharCurrent(id, t) }}
                onSetWeaponCurrent={(id, t) => { void handleSetWeaponCurrent(id, t) }}
                onSetEstimatedPulls={(id, p) => { void handleSetEstimatedPulls(id, p) }}
                allocatedPulls={stashAllocation.get(banner.id) ?? 0}
                doubleGemsAvailable={getGameStash(banner.game)?.double_gems_available ?? true}
              />
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes carouselFadeIn {
          0% { opacity: 0; transform: scale(1.04); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
