import { useState } from 'react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import ProgressBar from '../components/ui/ProgressBar'
import Button from '../components/ui/Button'
import { formatCurrency } from '../utils/currency'
import { daysUntil, formatDateShort } from '../utils/date'
import { type Debt, type Loan } from '../types'

// ─── Fake Data ────────────────────────────────────────────────────────────────

const FAKE_DEBTS: Debt[] = [
  { id: 1, nome: 'Cartão Nubank', total: 5000, restante: 2340, taxa: 3.5, vencimento: '2026-03-15', parcelas: '8/20', urgente: false },
  { id: 2, nome: 'Cartão Santander', total: 8000, restante: 5600, taxa: 4.2, vencimento: '2026-03-13', parcelas: '3/12', urgente: true },
  { id: 3, nome: 'Fatura C6 Bank', total: 1200, restante: 1200, taxa: 0, vencimento: '2026-03-20', parcelas: '1/1', urgente: false },
]

const FAKE_LOANS: Loan[] = [
  { id: 1, nome: 'Empréstimo Pessoal Itaú', total: 15000, restante: 9800, taxa: 2.1, parcela: 850, proximaParcela: '2026-03-20', parcelas: '7/20' },
  { id: 2, nome: 'Financiamento Notebook', total: 3600, restante: 2400, taxa: 1.8, parcela: 300, proximaParcela: '2026-03-25', parcelas: '4/12' },
]

type ActiveTab = 'dividas' | 'emprestimos'

// ─── Helper ───────────────────────────────────────────────────────────────────

function urgencyLabel(days: number): { label: string; color: 'red' | 'yellow' | 'green' } {
  if (days <= 2) return { label: 'URGENTE', color: 'red' }
  if (days <= 7) return { label: `${days} dias`, color: 'yellow' }
  return { label: `${days} dias`, color: 'green' }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Debts() {
  const [tab, setTab] = useState<ActiveTab>('dividas')

  const totalDevendo = FAKE_DEBTS.reduce((s, d) => s + d.restante, 0) + FAKE_LOANS.reduce((s, l) => s + l.restante, 0)
  const jurosEstimado = FAKE_DEBTS.reduce((s, d) => s + d.restante * (d.taxa / 100), 0) + FAKE_LOANS.reduce((s, l) => s + l.restante * (l.taxa / 100), 0)
  const totalAtivos = FAKE_DEBTS.length + FAKE_LOANS.length

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100 }}>
      {/* Header with red gradient */}
      <div
        className="rounded-2xl p-6 mb-6"
        style={{
          background: 'linear-gradient(135deg, rgba(239,68,68,0.18) 0%, rgba(127,29,29,0.25) 100%)',
          border: '1px solid rgba(239,68,68,0.2)',
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
              💳 Dívidas & Empréstimos
            </h1>
            <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>
              Gerencie e acompanhe todas as suas obrigações financeiras
            </p>
          </div>
          <Badge color="red" size="md">
            {totalAtivos} obrigações ativas
          </Badge>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-5">
          <div
            className="rounded-xl p-4"
            style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(239,68,68,0.15)' }}
          >
            <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>Total Devendo</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--color-red)' }}>
              {formatCurrency(totalDevendo)}
            </p>
          </div>
          <div
            className="rounded-xl p-4"
            style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(239,68,68,0.15)' }}
          >
            <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>Juros / Mês (est.)</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--color-orange)' }}>
              {formatCurrency(jurosEstimado)}
            </p>
          </div>
          <div
            className="rounded-xl p-4"
            style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(239,68,68,0.15)' }}
          >
            <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>Obrigações Ativas</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--color-yellow)' }}>
              {totalAtivos}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 p-1 rounded-xl mb-5"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', width: 'fit-content' }}
      >
        {([['dividas', '💳 Dívidas'], ['emprestimos', '🏦 Empréstimos']] as [ActiveTab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="px-5 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: tab === key ? 'var(--color-red)' : 'transparent',
              color: tab === key ? '#fff' : 'var(--color-muted)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Dívidas */}
      {tab === 'dividas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {FAKE_DEBTS.map((debt) => {
            const days = daysUntil(debt.vencimento)
            const urgency = urgencyLabel(days)
            const paidPct = Math.round(((debt.total - debt.restante) / debt.total) * 100)

            return (
              <Card key={debt.id} hover>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-base" style={{ color: 'var(--color-text)' }}>
                        {debt.nome}
                      </h4>
                      {debt.urgente && (
                        <Badge color="red" pulse>
                          ⚠ URGENTE
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                        Parcela {debt.parcelas}
                      </span>
                      {debt.taxa > 0 && (
                        <Badge color="orange" size="xs">
                          {debt.taxa}% a.m.
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold" style={{ color: 'var(--color-red)' }}>
                      {formatCurrency(debt.restante)}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                      de {formatCurrency(debt.total)}
                    </p>
                  </div>
                </div>

                <ProgressBar
                  value={debt.total - debt.restante}
                  max={debt.total}
                  color="auto"
                  height={10}
                  label={`Pago: ${formatCurrency(debt.total - debt.restante)} (${paidPct}%)`}
                />

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                      Vencimento: {formatDateShort(debt.vencimento)}
                    </span>
                    <Badge color={urgency.color} size="xs">
                      {urgency.label}
                    </Badge>
                  </div>
                  <Button variant="outline" size="sm">
                    Registrar Pagamento
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Empréstimos */}
      {tab === 'emprestimos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {FAKE_LOANS.map((loan) => {
            const days = daysUntil(loan.proximaParcela)
            const urgency = urgencyLabel(days)
            const paidPct = Math.round(((loan.total - loan.restante) / loan.total) * 100)

            return (
              <Card key={loan.id} hover>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-base mb-1" style={{ color: 'var(--color-text)' }}>
                      🏦 {loan.nome}
                    </h4>
                    <div className="flex items-center gap-3">
                      <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                        Parcela {loan.parcelas}
                      </span>
                      <Badge color="orange" size="xs">
                        {loan.taxa}% a.m.
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold" style={{ color: 'var(--color-red)' }}>
                      {formatCurrency(loan.restante)}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                      restante de {formatCurrency(loan.total)}
                    </p>
                  </div>
                </div>

                <ProgressBar
                  value={loan.total - loan.restante}
                  max={loan.total}
                  color="auto"
                  height={10}
                  label={`Pago: ${paidPct}%`}
                />

                <div className="flex items-center justify-between mt-3">
                  <div>
                    <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                      Próxima parcela: <strong style={{ color: 'var(--color-text)' }}>{formatCurrency(loan.parcela)}</strong>
                      {' — '}{formatDateShort(loan.proximaParcela)}
                      {' '}
                      <Badge color={urgency.color} size="xs">{urgency.label}</Badge>
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Registrar Parcela
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
