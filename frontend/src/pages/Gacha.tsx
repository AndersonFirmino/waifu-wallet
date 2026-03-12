import { useState } from 'react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { formatCurrency } from '../utils/currency'
import { daysUntil, formatDateShort } from '../utils/date'
import { type GachaBanner, type GachaPriority } from '../types'
import { useFetch } from '../hooks/useApi'
import { decodeGachaBanner, decodeBannerList, decodeSummary } from '../lib/decode'

const GAME_EMOJIS = new Map<string, string>([
  ['Genshin Impact', '🌸'],
  ['Wuthering Waves', '🌊'],
  ['Blue Archive', '📘'],
  ['Azur Lane', '⚓'],
])

// ─── Helpers ─────────────────────────────────────────────────────────────────

function priorityStars(p: GachaPriority): string {
  return '★'.repeat(p) + '☆'.repeat(5 - p)
}

function priorityColor(p: GachaPriority): 'yellow' | 'orange' | 'red' | 'blue' | 'gray' {
  if (p >= 5) return 'yellow'
  if (p >= 4) return 'orange'
  if (p >= 3) return 'blue'
  return 'gray'
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

const STATUS_COLORS: Record<SafetyStatus, { color: 'green' | 'yellow' | 'red'; bg: string }> = {
  safe: { color: 'green', bg: 'rgba(16,185,129,0.1)' },
  caution: { color: 'yellow', bg: 'rgba(245,158,11,0.1)' },
  danger: { color: 'red', bg: 'rgba(239,68,68,0.1)' },
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Gacha() {
  const { data: serverBanners } = useFetch('/gacha/banners', decodeBannerList)
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

  const banners = [...additions, ...(serverBanners ?? []).filter((b) => !deletedIds.includes(b.id))]
  const availableBalance = summary?.monthly_finances.balance ?? 0
  const budget = analyzeBudget(banners, availableBalance)
  const statusStyle = STATUS_COLORS[budget.status]

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
  }

  const handleRemove = async (id: number) => {
    await fetch(`/api/v1/gacha/banners/${String(id)}`, { method: 'DELETE' })
    setAdditions((prev) => prev.filter((b) => b.id !== id))
    setDeletedIds((prev) => [...prev, id])
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100 }}>
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
          border: `1px solid ${budget.status === 'safe' ? 'rgba(16,185,129,0.25)' : budget.status === 'caution' ? 'rgba(245,158,11,0.25)' : 'rgba(239,68,68,0.25)'}`,
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm mb-1" style={{ color: 'var(--color-muted)' }}>
              Saldo disponível:{' '}
              <strong style={{ color: 'var(--color-text)' }}>{formatCurrency(availableBalance)}</strong>
              {'  ·  '}
              Total em pulls: <strong style={{ color: 'var(--color-text)' }}>{formatCurrency(budget.total)}</strong>
            </p>
            <p className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
              {budget.remaining > 0
                ? `Sobraria ${formatCurrency(budget.remaining)} após todos os pulls`
                : `Faltariam ${formatCurrency(Math.abs(budget.remaining))} para cobrir todos os pulls`}
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
            <input
              placeholder="Jogo (ex: Genshin Impact)"
              value={formGame}
              onChange={(e) => {
                setFormGame(e.target.value)
              }}
            />
            <input
              placeholder="Nome do Banner"
              value={formBanner}
              onChange={(e) => {
                setFormBanner(e.target.value)
              }}
            />
            <input
              placeholder="Custo estimado (R$)"
              value={formCost}
              onChange={(e) => {
                setFormCost(e.target.value)
              }}
            />
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

      {/* Banner Grid */}
      {banners.length === 0 ? (
        <p className="text-center py-8" style={{ color: 'var(--color-muted)' }}>
          Nenhum banner cadastrado
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {[...banners]
            .sort((a, b) => b.priority - a.priority)
            .map((banner) => {
              const daysLeft = daysUntil(banner.end_date)
              const emoji = GAME_EMOJIS.get(banner.game) ?? '🎮'

              return (
                <Card key={banner.id} hover>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ background: 'var(--color-surface2)' }}
                      >
                        {emoji}
                      </div>
                      <div>
                        <p className="text-xs mb-0.5" style={{ color: 'var(--color-muted)' }}>
                          {banner.game}
                        </p>
                        <h4 className="font-bold text-base" style={{ color: 'var(--color-text)' }}>
                          {banner.banner}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span style={{ color: '#f59e0b', fontSize: 14 }}>{priorityStars(banner.priority)}</span>
                          <Badge color={priorityColor(banner.priority)} size="xs">
                            P{banner.priority}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        void handleRemove(banner.id)
                      }}
                      className="opacity-40 hover:opacity-100 transition-opacity w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                      style={{
                        background: 'rgba(239,68,68,0.1)',
                        color: 'var(--color-red)',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  <div
                    className="grid grid-cols-3 gap-3 mt-3 pt-3"
                    style={{ borderTop: '1px solid var(--color-border)' }}
                  >
                    <div>
                      <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>
                        Custo est.
                      </p>
                      <p className="font-bold" style={{ color: 'var(--color-yellow)' }}>
                        {formatCurrency(banner.cost)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>
                        Puxadas
                      </p>
                      <p className="font-bold" style={{ color: 'var(--color-text)' }}>
                        {banner.pulls}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>
                        Termina
                      </p>
                      <p
                        className="font-bold"
                        style={{ color: daysLeft <= 5 ? 'var(--color-red)' : 'var(--color-muted)' }}
                      >
                        {daysLeft <= 0
                          ? 'Encerrado'
                          : daysLeft === 1
                            ? 'Hoje!'
                            : `${String(daysLeft)}d — ${formatDateShort(banner.end_date)}`}
                      </p>
                    </div>
                  </div>
                </Card>
              )
            })}
        </div>
      )}
    </div>
  )
}
