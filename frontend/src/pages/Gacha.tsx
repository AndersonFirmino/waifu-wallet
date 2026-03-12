import { useState, useEffect } from 'react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import AnimatedNumber from '../components/ui/AnimatedNumber'
import CurrencyInput from '../components/ui/CurrencyInput'
import ImageCropUpload from '../components/ImageCropUpload'
import { formatCurrency } from '../utils/currency'
import { daysUntil } from '../utils/date'
import { type GachaBanner, type GachaPriority } from '../types'
import { useFetch } from '../hooks/useApi'
import { decodeGachaBanner, decodeBannerList, decodeSummary } from '../lib/decode'

const GAME_EMOJIS = new Map<string, string>([
  ['Genshin Impact', '🌸'],
  ['Wuthering Waves', '🌊'],
  ['Blue Archive', '📘'],
  ['Azur Lane', '⚓'],
  ['Honkai: Star Rail', '🚂'],
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

// ─── BannerCard ───────────────────────────────────────────────────────────────

interface BannerEditData {
  game: string
  banner: string
  cost: number
  start_date: string
  end_date: string
  priority: GachaPriority
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
}

function BannerCard({ banner, onRemove, editing, onEdit, onSave, onCancel, onImagesChanged }: BannerCardProps) {
  const phase = getBannerPhase(banner.start_date, banner.end_date)
  const emoji = GAME_EMOJIS.get(banner.game) ?? '🎮'

  const daysToEnd = daysUntil(banner.end_date)

  // Carousel state
  const allImages: string[] = [
    ...banner.images.map((img) => img.url),
    ...(banner.images.length === 0 && banner.image_url != null ? [banner.image_url] : []),
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
                <input
                  value={editGame}
                  onChange={(e) => { setEditGame(e.target.value) }}
                  placeholder="ex: Honkai: Star Rail"
                />
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

            {/* Row 6: Stats inline */}
            <div
              style={{
                marginTop: 'auto',
                paddingTop: 8,
                borderTop: '1px solid var(--color-border)',
                display: 'flex',
                gap: 14,
                fontSize: 13,
              }}
            >
              <span>
                <span style={{ color: 'var(--color-muted)' }}>💰 </span>
                <span style={{ color: 'var(--color-yellow)', fontWeight: 600 }}>
                  <AnimatedNumber value={banner.cost} formatter={formatCurrency} />
                </span>
              </span>
              <span>
                <span style={{ color: 'var(--color-muted)' }}>🎯 </span>
                <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                  <AnimatedNumber value={banner.pulls} />
                </span>
              </span>
              <span>
                <span style={{ color: 'var(--color-muted)' }}>📅 </span>
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
                  {banner.end_date.split('-').slice(1).join('/').replace('-', '/')}
                </span>
              </span>
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
  const [additions, setAdditions] = useState<GachaBanner[]>([])
  const [deletedIds, setDeletedIds] = useState<number[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formGame, setFormGame] = useState('')
  const [formBanner, setFormBanner] = useState('')
  const [formCost, setFormCost] = useState('')
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [formEndDate, setFormEndDate] = useState('')
  const [formPriority, setFormPriority] = useState<GachaPriority>(3)
  const [formImageUrl, setFormImageUrl] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)

  const banners = [...additions, ...(serverBanners ?? []).filter((b) => !deletedIds.includes(b.id))]
  const availableBalance = summary?.monthly_finances.balance ?? 0
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
              <strong style={{ color: 'var(--color-text)' }}>
                <AnimatedNumber value={availableBalance} formatter={formatCurrency} />
              </strong>
              {'  ·  '}
              Total em pulls:{' '}
              <strong style={{ color: 'var(--color-text)' }}>
                <AnimatedNumber value={budget.total} formatter={formatCurrency} />
              </strong>
            </p>
            <p className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
              {budget.remaining > 0 ? (
                <>Sobraria <AnimatedNumber value={budget.remaining} formatter={formatCurrency} /> após todos os pulls</>
              ) : (
                <>Faltariam <AnimatedNumber value={Math.abs(budget.remaining)} formatter={formatCurrency} /> para cobrir todos os pulls</>
              )}
            </p>
          </div>
          <Badge color={statusStyle.color} size="lg" pulse={budget.status === 'danger'}>
            {budget.label}
          </Badge>
        </div>
      </div>

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
              <input
                placeholder="ex: Honkai: Star Rail"
                value={formGame}
                onChange={(e) => {
                  setFormGame(e.target.value)
                }}
              />
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
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
