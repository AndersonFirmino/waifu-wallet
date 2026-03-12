import { useState } from 'react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import ProgressBar from '../components/ui/ProgressBar'
import { formatCurrency } from '../utils/currency'
import { type CreditCard, type CardStatus } from '../types'

// ─── Fake Data ────────────────────────────────────────────────────────────────

const FAKE_CARDS: CreditCard[] = [
  {
    id: 1,
    nome: 'Nubank Roxo',
    bandeira: 'Mastercard',
    final: '4531',
    limite: 8000,
    usado: 3240,
    gradientFrom: '#7c3aed',
    gradientTo: '#4c1d95',
    fatura: 1240,
    fechamento: 15,
    vencimento: 22,
    status: 'aberta',
    historico: [
      { mes: 'Jan', valor: 1450, status: 'paga' },
      { mes: 'Fev', valor: 2100, status: 'paga' },
      { mes: 'Mar', valor: 1240, status: 'aberta' },
    ],
    itens: [
      { desc: 'Amazon Prime', valor: 21.9, data: '10/03' },
      { desc: 'Restaurante Outback', valor: 187.5, data: '07/03' },
      { desc: 'Uber Eats', valor: 52.9, data: '06/03' },
      { desc: 'Steam — CS2 Skins', valor: 189.9, data: '05/03' },
      { desc: 'iFood', valor: 78.8, data: '04/03' },
      { desc: 'Assinatura Claude', valor: 115, data: '03/03' },
      { desc: 'Magazine Luiza', valor: 594, data: '01/03' },
    ],
  },
  {
    id: 2,
    nome: 'Itaú Gold',
    bandeira: 'Visa',
    final: '7892',
    limite: 5000,
    usado: 1843,
    gradientFrom: '#d97706',
    gradientTo: '#92400e',
    fatura: 1843,
    fechamento: 10,
    vencimento: 17,
    status: 'fechada',
    historico: [
      { mes: 'Jan', valor: 2200, status: 'paga' },
      { mes: 'Fev', valor: 1900, status: 'paga' },
      { mes: 'Mar', valor: 1843, status: 'fechada' },
    ],
    itens: [
      { desc: 'Posto Ipiranga', valor: 280, data: '02/03' },
      { desc: 'Supermercado Extra', valor: 320, data: '04/03' },
      { desc: 'Farmácia Drogasil', valor: 85, data: '05/03' },
      { desc: 'Renner — Camisa', valor: 158, data: '06/03' },
      { desc: 'Rappi Market', valor: 142, data: '08/03' },
      { desc: 'Decathlon', valor: 858, data: '09/03' },
    ],
  },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

interface CreditCardVisualProps {
  card: CreditCard
  selected: boolean
  onSelect: () => void
}

function CreditCardVisual({ card, selected, onSelect }: CreditCardVisualProps) {
  const usePct = Math.round((card.usado / card.limite) * 100)

  return (
    <div onClick={onSelect} style={{ cursor: 'pointer' }}>
      {/* Card Visual */}
      <div
        className="rounded-2xl p-5 mb-3 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${card.gradientFrom}, ${card.gradientTo})`,
          outline: selected ? '2px solid rgba(255,255,255,0.5)' : '2px solid transparent',
          transition: 'outline 0.15s, transform 0.15s',
          transform: selected ? 'scale(1.02)' : 'scale(1)',
          boxShadow: selected ? `0 8px 32px ${card.gradientFrom}55` : 'none',
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
            <p className="text-xl font-bold text-white">💵 {card.nome}</p>
            <span className="text-white font-bold text-sm opacity-90">{card.bandeira}</span>
          </div>
          <p className="text-white font-mono tracking-widest text-base mb-5 opacity-85">**** **** **** {card.final}</p>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs text-white opacity-60 mb-1">Limite disponível</p>
              <p className="text-white font-bold">{formatCurrency(card.limite - card.usado)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-white opacity-60 mb-1">Limite total</p>
              <p className="text-white font-semibold">{formatCurrency(card.limite)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Limit Bar */}
      <div className="px-1">
        <div className="flex justify-between text-xs mb-1">
          <span style={{ color: 'var(--color-muted)' }}>Uso do limite</span>
          <span style={{ color: usePct > 70 ? 'var(--color-red)' : 'var(--color-green)' }}>
            {formatCurrency(card.usado)} ({usePct}%)
          </span>
        </div>
        <ProgressBar value={card.usado} max={card.limite} color="auto" showPercent={false} height={6} />
      </div>
    </div>
  )
}

function statusBadge(status: CardStatus) {
  if (status === 'paga')
    return (
      <Badge color="green" size="xs">
        Paga ✓
      </Badge>
    )
  if (status === 'fechada')
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
  const [selectedId, setSelectedId] = useState<number>(FAKE_CARDS[0]?.id ?? 1)

  const selected = FAKE_CARDS.find((c) => c.id === selectedId) ?? FAKE_CARDS[0]

  if (!selected) return null

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200 }}>
      <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
        Cartões de Crédito
      </h1>
      <p className="mb-6 text-sm" style={{ color: 'var(--color-muted)' }}>
        {FAKE_CARDS.length} cartão{FAKE_CARDS.length !== 1 ? 'ões' : ''} cadastrado{FAKE_CARDS.length !== 1 ? 's' : ''}
      </p>

      <div className="grid gap-6" style={{ gridTemplateColumns: '320px 1fr' }}>
        {/* Left: Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {FAKE_CARDS.map((card) => (
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
          {/* Fatura Info */}
          <Card className="mb-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--color-text)' }}>
                  {selected.nome}
                </h3>
                <div className="flex items-center gap-3">
                  {statusBadge(selected.status)}
                  <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                    Fecha dia {selected.fechamento} · Vence dia {selected.vencimento}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>
                  Fatura atual
                </p>
                <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                  {formatCurrency(selected.fatura)}
                </p>
              </div>
            </div>

            {/* Bill Items */}
            <div>
              <p className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
                Lançamentos recentes
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {selected.itens.map((item, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center px-2 py-2.5 rounded-lg"
                    style={{ transition: 'background 0.12s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div className="flex items-center gap-2">
                      <span style={{ color: 'var(--color-muted)', fontSize: 12 }}>{item.data}</span>
                      <span className="text-sm" style={{ color: 'var(--color-text)' }}>
                        {item.desc}
                      </span>
                    </div>
                    <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                      {formatCurrency(item.valor)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* History */}
          <Card>
            <p className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
              Histórico de Faturas
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...selected.historico].reverse().map((h, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: 'var(--color-surface2)' }}
                >
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                    {h.mes} 2026
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold" style={{ color: 'var(--color-text)' }}>
                      {formatCurrency(h.valor)}
                    </span>
                    {statusBadge(h.status)}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
