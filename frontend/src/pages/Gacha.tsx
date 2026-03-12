import { useState } from 'react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { formatCurrency } from '../utils/currency'
import { daysUntil, formatDateShort } from '../utils/date'
import { type GachaBanner, type GachaPriority } from '../types'

// ─── Fake Data ────────────────────────────────────────────────────────────────

const FAKE_BANNERS: GachaBanner[] = [
  {
    id: 1,
    jogo: 'Genshin Impact',
    banner: 'Shenhe (Rerun)',
    custo: 180,
    inicio: '2026-03-05',
    fim: '2026-03-26',
    prioridade: 5,
    puxadas: 45,
  },
  {
    id: 2,
    jogo: 'Wuthering Waves',
    banner: 'Camellya',
    custo: 120,
    inicio: '2026-03-12',
    fim: '2026-04-02',
    prioridade: 4,
    puxadas: 30,
  },
  {
    id: 3,
    jogo: 'Blue Archive',
    banner: 'Himari (Limited)',
    custo: 250,
    inicio: '2026-03-15',
    fim: '2026-04-05',
    prioridade: 5,
    puxadas: 0,
  },
  {
    id: 4,
    jogo: 'Azur Lane',
    banner: 'META Repair',
    custo: 80,
    inicio: '2026-03-01',
    fim: '2026-03-31',
    prioridade: 3,
    puxadas: 20,
  },
]

const SALDO_DISPONIVEL = 3842

const GAME_EMOJIS: Record<string, string> = {
  'Genshin Impact': '🌸',
  'Wuthering Waves': '🌊',
  'Blue Archive': '📘',
  'Azur Lane': '⚓',
}

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

function analyzeBudget(banners: GachaBanner[], saldo: number): BudgetAnalysis {
  const total = banners.reduce((s, b) => s + b.custo, 0)
  const remaining = saldo - total
  let status: SafetyStatus
  let label: string

  if (remaining > saldo * 0.4) {
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
  const [banners, setBanners] = useState<GachaBanner[]>(FAKE_BANNERS)
  const [showForm, setShowForm] = useState(false)
  const [formJogo, setFormJogo] = useState('')
  const [formBanner, setFormBanner] = useState('')
  const [formCusto, setFormCusto] = useState('')
  const [formInicio, setFormInicio] = useState('2026-03-11')
  const [formFim, setFormFim] = useState('')
  const [formPrioridade, setFormPrioridade] = useState<GachaPriority>(3)

  const budget = analyzeBudget(banners, SALDO_DISPONIVEL)
  const statusStyle = STATUS_COLORS[budget.status]

  const handleAdd = () => {
    const custo = parseFloat(formCusto)
    if (!formJogo || !formBanner || isNaN(custo) || !formFim) return
    const next: GachaBanner = {
      id: Date.now(),
      jogo: formJogo,
      banner: formBanner,
      custo,
      inicio: formInicio,
      fim: formFim,
      prioridade: formPrioridade,
      puxadas: 0,
    }
    setBanners((prev) => [...prev, next])
    setShowForm(false)
    setFormJogo('')
    setFormBanner('')
    setFormCusto('')
    setFormFim('')
  }

  const handleRemove = (id: number) => {
    setBanners((prev) => prev.filter((b) => b.id !== id))
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
              <strong style={{ color: 'var(--color-text)' }}>{formatCurrency(SALDO_DISPONIVEL)}</strong>
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
              value={formJogo}
              onChange={(e) => {
                setFormJogo(e.target.value)
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
              value={formCusto}
              onChange={(e) => {
                setFormCusto(e.target.value)
              }}
            />
            <div className="flex gap-3">
              <input
                type="date"
                value={formInicio}
                onChange={(e) => {
                  setFormInicio(e.target.value)
                }}
                style={{ flex: 1 }}
              />
              <input
                type="date"
                value={formFim}
                onChange={(e) => {
                  setFormFim(e.target.value)
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
                    setFormPrioridade(p)
                  }}
                  className="text-xl transition-all"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    opacity: p <= formPrioridade ? 1 : 0.25,
                    filter: p <= formPrioridade ? 'drop-shadow(0 0 4px #f59e0b)' : 'none',
                  }}
                >
                  ★
                </button>
              ))}
            </div>
            <Button onClick={handleAdd} className="ml-auto">
              Salvar
            </Button>
          </div>
        </Card>
      )}

      {/* Banner Grid */}
      <div className="grid grid-cols-2 gap-4">
        {banners
          .sort((a, b) => b.prioridade - a.prioridade)
          .map((banner) => {
            const daysLeft = daysUntil(banner.fim)
            const emoji = GAME_EMOJIS[banner.jogo] ?? '🎮'

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
                        {banner.jogo}
                      </p>
                      <h4 className="font-bold text-base" style={{ color: 'var(--color-text)' }}>
                        {banner.banner}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span style={{ color: '#f59e0b', fontSize: 14 }}>{priorityStars(banner.prioridade)}</span>
                        <Badge color={priorityColor(banner.prioridade)} size="xs">
                          P{banner.prioridade}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      handleRemove(banner.id)
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
                      {formatCurrency(banner.custo)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>
                      Puxadas
                    </p>
                    <p className="font-bold" style={{ color: 'var(--color-text)' }}>
                      {banner.puxadas}
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
                          : `${String(daysLeft)}d — ${formatDateShort(banner.fim)}`}
                    </p>
                  </div>
                </div>
              </Card>
            )
          })}
      </div>
    </div>
  )
}
