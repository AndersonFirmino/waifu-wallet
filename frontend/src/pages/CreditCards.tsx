import { useState } from 'react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import ProgressBar from '../components/ui/ProgressBar'
import { formatCurrency } from '../utils/currency'
import { type CreditCard, type CardStatus } from '../types'
import { useFetch } from '../hooks/useApi'
import { decodeCreditCardList } from '../lib/decode'

// ─── Sub-components ───────────────────────────────────────────────────────────

interface CreditCardVisualProps {
  card: CreditCard
  selected: boolean
  onSelect: () => void
}

function CreditCardVisual({ card, selected, onSelect }: CreditCardVisualProps) {
  const usedPct = Math.round((card.used / card.limit) * 100)

  return (
    <div onClick={onSelect} style={{ cursor: 'pointer' }}>
      {/* Card Visual */}
      <div
        className="rounded-2xl p-5 mb-3 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${card.gradient_from}, ${card.gradient_to})`,
          outline: selected ? '2px solid rgba(255,255,255,0.5)' : '2px solid transparent',
          transition: 'outline 0.15s, transform 0.15s',
          transform: selected ? 'scale(1.02)' : 'scale(1)',
          boxShadow: selected ? `0 8px 32px ${card.gradient_from}55` : 'none',
        }}
      >
        {/* Pattern overlay */}
        <div
          style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 160,
            height: 160,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.07)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -50,
            left: 20,
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
          }}
        />

        <div className="relative">
          <div className="flex justify-between items-start mb-6">
            <p className="text-xl font-bold text-white">💵 {card.name}</p>
            <span className="text-white font-bold text-sm opacity-90">{card.brand}</span>
          </div>
          <p className="text-white font-mono tracking-widest text-base mb-5 opacity-85">
            **** **** **** {card.last_four}
          </p>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs text-white opacity-60 mb-1">Limite disponível</p>
              <p className="text-white font-bold">{formatCurrency(card.limit - card.used)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-white opacity-60 mb-1">Limite total</p>
              <p className="text-white font-semibold">{formatCurrency(card.limit)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Limit Bar */}
      <div className="px-1">
        <div className="flex justify-between text-xs mb-1">
          <span style={{ color: 'var(--color-muted)' }}>Uso do limite</span>
          <span style={{ color: usedPct > 70 ? 'var(--color-red)' : 'var(--color-green)' }}>
            {formatCurrency(card.used)} ({usedPct}%)
          </span>
        </div>
        <ProgressBar value={card.used} max={card.limit} color="auto" showPercent={false} height={6} />
      </div>
    </div>
  )
}

function statusBadge(status: CardStatus) {
  if (status === 'paid')
    return (
      <Badge color="green" size="xs">
        Paga ✓
      </Badge>
    )
  if (status === 'closed')
    return (
      <Badge color="yellow" size="xs">
        Fechada
      </Badge>
    )
  return (
    <Badge color="blue" size="xs">
      Aberta
    </Badge>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CreditCards() {
  const { data: cards } = useFetch('/credit-cards/', decodeCreditCardList)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const cardList = cards ?? []
  const effectiveId = selectedId ?? cardList[0]?.id ?? null
  const selected = cardList.find((c) => c.id === effectiveId) ?? cardList[0]

  if (cardList.length === 0) {
    return (
      <div style={{ padding: '28px 32px' }}>
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
          Cartões de Crédito
        </h1>
        <p className="text-sm mt-4" style={{ color: 'var(--color-muted)' }}>
          Nenhum cartão cadastrado
        </p>
      </div>
    )
  }

  if (!selected) return null

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200 }}>
      <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
        Cartões de Crédito
      </h1>
      <p className="mb-6 text-sm" style={{ color: 'var(--color-muted)' }}>
        {cardList.length} cartão{cardList.length !== 1 ? 'ões' : ''} cadastrado
        {cardList.length !== 1 ? 's' : ''}
      </p>

      <div className="grid gap-6" style={{ gridTemplateColumns: '320px 1fr' }}>
        {/* Left: Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {cardList.map((card) => (
            <CreditCardVisual
              key={card.id}
              card={card}
              selected={selectedId === card.id}
              onSelect={() => {
                setSelectedId(card.id)
              }}
            />
          ))}
        </div>

        {/* Right: Detail */}
        <div>
          {/* Bill Info */}
          <Card className="mb-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--color-text)' }}>
                  {selected.name}
                </h3>
                <div className="flex items-center gap-3">
                  {statusBadge(selected.status)}
                  <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                    Fecha dia {selected.closing_day} · Vence dia {selected.due_day}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>
                  Fatura atual
                </p>
                <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                  {formatCurrency(selected.bill)}
                </p>
              </div>
            </div>

            {/* Bill Items */}
            <div>
              <p className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
                Lançamentos recentes
              </p>
              {selected.items.length === 0 ? (
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                  Nenhum lançamento
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {selected.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center px-2 py-2.5 rounded-lg"
                      style={{ transition: 'background 0.12s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface2)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div className="flex items-center gap-2">
                        <span style={{ color: 'var(--color-muted)', fontSize: 12 }}>{item.date}</span>
                        <span className="text-sm" style={{ color: 'var(--color-text)' }}>
                          {item.description}
                        </span>
                      </div>
                      <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* History */}
          <Card>
            <p className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
              Histórico de Faturas
            </p>
            {selected.history.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                Sem histórico
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[...selected.history].reverse().map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between p-3 rounded-xl"
                    style={{ background: 'var(--color-surface2)' }}
                  >
                    <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                      {h.month}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="font-bold" style={{ color: 'var(--color-text)' }}>
                        {formatCurrency(h.amount)}
                      </span>
                      {statusBadge(h.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
