import { useState } from 'react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import ProgressBar from '../components/ui/ProgressBar'
import Button from '../components/ui/Button'
import StatCard from '../components/ui/StatCard'
import { formatCurrency } from '../utils/currency'
import { type FixedExpense, type FixedExpenseKind } from '../types'
import { useFetch } from '../hooks/useApi'
import { decodeFixedExpense, decodeFixedExpenseList } from '../lib/decode'

interface FormState {
  name: string
  amount: string
  type: FixedExpenseKind
}

const EXPENSE_KINDS: FixedExpenseKind[] = ['fixed', 'variable']

const KIND_LABELS: Record<FixedExpenseKind, string> = {
  fixed: 'Fixo',
  variable: 'Variável',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FixedExpenses() {
  const { data: serverData } = useFetch('/fixed-expenses/', decodeFixedExpenseList)
  const [additions, setAdditions] = useState<FixedExpense[]>([])
  const [deletedIds, setDeletedIds] = useState<number[]>([])
  const [form, setForm] = useState<FormState>({ name: '', amount: '', type: 'fixed' })

  const expenses = [...additions, ...(serverData ?? []).filter((e) => !deletedIds.includes(e.id))]

  const totalMonth = expenses.reduce((s, e) => s + e.amount, 0)
  const totalForecast = expenses.reduce((s, e) => s + e.estimate, 0)
  const fixedItems = expenses.filter((e) => e.type === 'fixed')
  const variableItems = expenses.filter((e) => e.type === 'variable')

  const handleAdd = async () => {
    const amount = parseFloat(form.amount.replace(',', '.'))
    if (!form.name || isNaN(amount) || amount <= 0) return
    const body = {
      name: form.name,
      amount,
      type: form.type,
      confidence: form.type === 'fixed' ? 100 : 70,
      estimate: amount,
    }
    const r = await fetch('/api/v1/fixed-expenses/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!r.ok) return
    const raw: unknown = await r.json()
    const created = decodeFixedExpense(raw)
    setAdditions((prev) => [...prev, created])
    setForm({ name: '', amount: '', type: 'fixed' })
  }

  const handleRemove = async (id: number) => {
    await fetch(`/api/v1/fixed-expenses/${String(id)}`, { method: 'DELETE' })
    setAdditions((prev) => prev.filter((e) => e.id !== id))
    setDeletedIds((prev) => [...prev, id])
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100 }}>
      <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
        Gastos Fixos
      </h1>
      <p className="mb-6 text-sm" style={{ color: 'var(--color-muted)' }}>
        Controle de despesas recorrentes
      </p>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard
          icon="📋"
          label="Total Mês Atual"
          value={formatCurrency(totalMonth)}
          numericValue={totalMonth}
          numericFormatter={formatCurrency}
          sub={`${String(expenses.length)} itens`}
          color="blue"
        />
        <StatCard
          icon="🔮"
          label="Previsão Próximo Mês"
          value={formatCurrency(totalForecast)}
          numericValue={totalForecast}
          numericFormatter={formatCurrency}
          sub="baseado em EMA"
          color="purple"
        />
        <StatCard
          icon="📌"
          label="Gastos Fixos"
          value={`${String(fixedItems.length)} de ${String(expenses.length)}`}
          sub={formatCurrency(fixedItems.reduce((s, e) => s + e.amount, 0))}
          color="yellow"
        />
      </div>

      {/* Add Form */}
      <Card className="mb-6">
        <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--color-text)' }}>
          Adicionar Gasto Recorrente
        </h3>
        <div className="flex gap-3 flex-wrap items-center">
          <input
            placeholder="Nome (ex: Netflix)"
            value={form.name}
            onChange={(e) => {
              setForm((f) => ({ ...f, name: e.target.value }))
            }}
            style={{ flex: 1, minWidth: 200 }}
          />
          <input
            placeholder="Valor"
            value={form.amount}
            onChange={(e) => {
              setForm((f) => ({ ...f, amount: e.target.value }))
            }}
            style={{ width: 140 }}
          />
          <div
            className="flex rounded-lg overflow-hidden border"
            style={{ borderColor: 'var(--color-border)', flexShrink: 0 }}
          >
            {EXPENSE_KINDS.map((t) => (
              <button
                key={t}
                onClick={() => {
                  setForm((f) => ({ ...f, type: t }))
                }}
                className="px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  background: form.type === t ? 'var(--color-blue)' : 'transparent',
                  color: form.type === t ? '#fff' : 'var(--color-muted)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {KIND_LABELS[t]}
              </button>
            ))}
          </div>
          <Button
            onClick={() => {
              void handleAdd()
            }}
          >
            Adicionar
          </Button>
        </div>
      </Card>

      {/* Expense Groups */}
      {[
        { label: 'Fixos', data: fixedItems, color: 'var(--color-blue)' },
        { label: 'Variáveis', data: variableItems, color: 'var(--color-purple)' },
      ].map((group) => (
        <div key={group.label} className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
              {group.label}
            </h3>
            <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
            <span className="text-xs font-medium" style={{ color: group.color }}>
              {formatCurrency(group.data.reduce((s, e) => s + e.amount, 0))}
            </span>
          </div>
          {group.data.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
              Nenhum item
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {group.data.map((expense) => {
                const diff = expense.estimate - expense.amount
                return (
                  <Card key={expense.id} hover>
                    <div className="flex items-center justify-between">
                      <div style={{ flex: 1 }}>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>
                            {expense.name}
                          </span>
                          <Badge color={expense.type === 'fixed' ? 'blue' : 'purple'} size="xs">
                            {KIND_LABELS[expense.type]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-6">
                          <div>
                            <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>
                              Mês atual
                            </p>
                            <p className="font-bold text-base" style={{ color: 'var(--color-text)' }}>
                              {formatCurrency(expense.amount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>
                              Previsão próx.
                            </p>
                            <p
                              className="font-semibold text-sm"
                              style={{
                                color:
                                  diff > 0
                                    ? 'var(--color-red)'
                                    : diff < 0
                                      ? 'var(--color-green)'
                                      : 'var(--color-muted)',
                              }}
                            >
                              {formatCurrency(expense.estimate)}
                              {diff !== 0 && (
                                <span className="text-xs ml-1.5">
                                  ({diff > 0 ? '+' : ''}
                                  {formatCurrency(diff)})
                                </span>
                              )}
                            </p>
                          </div>
                          <div style={{ flex: 1 }}>
                            <p className="text-xs mb-1.5" style={{ color: 'var(--color-muted)' }}>
                              Confiança: {expense.confidence}%
                            </p>
                            <ProgressBar
                              value={expense.confidence}
                              max={100}
                              color={
                                expense.confidence >= 80 ? 'green' : expense.confidence >= 60 ? 'yellow' : 'orange'
                              }
                              showPercent={false}
                              height={6}
                            />
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          void handleRemove(expense.id)
                        }}
                        className="ml-4 w-8 h-8 rounded-lg flex items-center justify-center text-sm opacity-40 hover:opacity-100 transition-opacity"
                        style={{
                          background: 'rgba(239,68,68,0.1)',
                          color: 'var(--color-red)',
                          border: 'none',
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
