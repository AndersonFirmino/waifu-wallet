import { useState } from 'react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import ProgressBar from '../components/ui/ProgressBar'
import Button from '../components/ui/Button'
import { formatCurrency } from '../utils/currency'
import { daysUntil, formatDateShort } from '../utils/date'
import { type Debt, type Loan } from '../types'
import { useFetch } from '../hooks/useApi'
import { decodeDebtList, decodeLoanList } from '../lib/decode'

type ActiveTab = 'debts' | 'loans'

const TABS: [ActiveTab, string][] = [
  ['debts', '💳 Dívidas'],
  ['loans', '🏦 Empréstimos'],
]

// ─── Helper ───────────────────────────────────────────────────────────────────

function urgencyLabel(days: number): { label: string; color: 'red' | 'yellow' | 'green' } {
  if (days <= 2) return { label: 'URGENTE', color: 'red' }
  if (days <= 7) return { label: `${String(days)} dias`, color: 'yellow' }
  return { label: `${String(days)} dias`, color: 'green' }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Debts() {
  const [tab, setTab] = useState<ActiveTab>('debts')

  const { data: fetchedDebts } = useFetch('/debts/', decodeDebtList)
  const { data: fetchedLoans } = useFetch('/loans/', decodeLoanList)

  const debts: Debt[] = fetchedDebts ?? []
  const loans: Loan[] = fetchedLoans ?? []

  const totalOwed =
    debts.reduce((s, d) => s + d.remaining, 0) + loans.reduce((s, l) => s + l.remaining, 0)
  const estimatedInterest =
    debts.reduce((s, d) => s + d.remaining * (d.rate / 100), 0) +
    loans.reduce((s, l) => s + l.remaining * (l.rate / 100), 0)
  const totalActive = debts.length + loans.length

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
            {totalActive} obrigações ativas
          </Badge>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-5">
          <div
            className="rounded-xl p-4"
            style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(239,68,68,0.15)' }}
          >
            <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>
              Total Devendo
            </p>
            <p className="text-2xl font-bold" style={{ color: 'var(--color-red)' }}>
              {formatCurrency(totalOwed)}
            </p>
          </div>
          <div
            className="rounded-xl p-4"
            style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(239,68,68,0.15)' }}
          >
            <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>
              Juros / Mês (est.)
            </p>
            <p className="text-2xl font-bold" style={{ color: 'var(--color-orange)' }}>
              {formatCurrency(estimatedInterest)}
            </p>
          </div>
          <div
            className="rounded-xl p-4"
            style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(239,68,68,0.15)' }}
          >
            <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>
              Obrigações Ativas
            </p>
            <p className="text-2xl font-bold" style={{ color: 'var(--color-yellow)' }}>
              {totalActive}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 p-1 rounded-xl mb-5"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', width: 'fit-content' }}
      >
        {TABS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => {
              setTab(key)
            }}
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
      {tab === 'debts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {debts.length === 0 && (
            <p className="text-center py-8" style={{ color: 'var(--color-muted)' }}>
              Nenhuma dívida cadastrada
            </p>
          )}
          {debts.map((debt) => {
            const days = daysUntil(debt.due_date)
            const urgency = urgencyLabel(days)
            const paidPct = Math.round(((debt.total - debt.remaining) / debt.total) * 100)

            return (
              <Card key={debt.id} hover>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-base" style={{ color: 'var(--color-text)' }}>
                        {debt.name}
                      </h4>
                      {debt.urgent && (
                        <Badge color="red" pulse>
                          ⚠ URGENTE
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                        Parcela {debt.installments}
                      </span>
                      {debt.rate > 0 && (
                        <Badge color="orange" size="xs">
                          {debt.rate}% a.m.
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold" style={{ color: 'var(--color-red)' }}>
                      {formatCurrency(debt.remaining)}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                      de {formatCurrency(debt.total)}
                    </p>
                  </div>
                </div>

                <ProgressBar
                  value={debt.total - debt.remaining}
                  max={debt.total}
                  color="auto"
                  height={10}
                  label={`Pago: ${formatCurrency(debt.total - debt.remaining)} (${String(paidPct)}%)`}
                />

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                      Vencimento: {formatDateShort(debt.due_date)}
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
      {tab === 'loans' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loans.length === 0 && (
            <p className="text-center py-8" style={{ color: 'var(--color-muted)' }}>
              Nenhum empréstimo cadastrado
            </p>
          )}
          {loans.map((loan) => {
            const days = daysUntil(loan.next_payment)
            const urgency = urgencyLabel(days)
            const paidPct = Math.round(((loan.total - loan.remaining) / loan.total) * 100)

            return (
              <Card key={loan.id} hover>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-base mb-1" style={{ color: 'var(--color-text)' }}>
                      🏦 {loan.name}
                    </h4>
                    <div className="flex items-center gap-3">
                      <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                        Parcela {loan.installments}
                      </span>
                      <Badge color="orange" size="xs">
                        {loan.rate}% a.m.
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold" style={{ color: 'var(--color-red)' }}>
                      {formatCurrency(loan.remaining)}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                      restante de {formatCurrency(loan.total)}
                    </p>
                  </div>
                </div>

                <ProgressBar
                  value={loan.total - loan.remaining}
                  max={loan.total}
                  color="auto"
                  height={10}
                  label={`Pago: ${String(paidPct)}%`}
                />

                <div className="flex items-center justify-between mt-3">
                  <div>
                    <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                      Próxima parcela:{' '}
                      <strong style={{ color: 'var(--color-text)' }}>{formatCurrency(loan.installment)}</strong>
                      {' — '}
                      {formatDateShort(loan.next_payment)}{' '}
                      <Badge color={urgency.color} size="xs">
                        {urgency.label}
                      </Badge>
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
