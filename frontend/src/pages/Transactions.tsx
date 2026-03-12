import { useState } from 'react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import StatCard from '../components/ui/StatCard'
import CurrencyInput from '../components/ui/CurrencyInput'
import { formatCurrency } from '../utils/currency'
import { type Transaction, type TransactionType } from '../types'
import { useFetch } from '../hooks/useApi'
import { decodeTransaction, decodeTransactionList } from '../lib/decode'

const CATEGORIES = [
  'Todas',
  'Trabalho',
  'Renda Extra',
  'Moradia',
  'Alimentação',
  'Transporte',
  'Saúde',
  'Lazer',
  'Contas',
]

type FilterType = 'all' | TransactionType

const TRANSACTION_TYPES: TransactionType[] = ['income', 'expense']
const FILTER_TYPES: FilterType[] = ['all', 'income', 'expense']

interface FormState {
  type: TransactionType
  amount: number
  description: string
  category: string
  date: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Transactions() {
  const today = new Date().toISOString().slice(0, 10)

  const { data: serverData } = useFetch('/transactions/', decodeTransactionList)
  const [additions, setAdditions] = useState<Transaction[]>([])
  const [deletedIds, setDeletedIds] = useState<number[]>([])
  const [filter, setFilter] = useState<FilterType>('all')
  const [catFilter, setCatFilter] = useState('Todas')
  const [form, setForm] = useState<FormState>({
    type: 'expense',
    amount: 0,
    description: '',
    category: 'Alimentação',
    date: today,
  })

  const transactions = [...additions, ...(serverData ?? []).filter((t) => !deletedIds.includes(t.id))]

  const filtered = transactions.filter((t) => {
    const typeOk = filter === 'all' || t.type === filter
    const catOk = catFilter === 'Todas' || t.category === catFilter
    return typeOk && catOk
  })

  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpenses = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = totalIncome - totalExpenses

  const handleAdd = async () => {
    if (!form.description || form.amount <= 0) return
    const body = {
      type: form.type,
      description: form.description,
      category: form.category,
      emoji: form.type === 'income' ? '💰' : '💸',
      amount: form.amount,
      date: form.date,
    }
    const r = await fetch('/api/v1/transactions/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!r.ok) return
    const raw: unknown = await r.json()
    const created = decodeTransaction(raw)
    setAdditions((prev) => [created, ...prev])
    setForm((f) => ({ ...f, amount: 0, description: '' }))
  }

  const handleRemove = async (id: number) => {
    await fetch(`/api/v1/transactions/${String(id)}`, { method: 'DELETE' })
    setAdditions((prev) => prev.filter((t) => t.id !== id))
    setDeletedIds((prev) => [...prev, id])
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200 }}>
      <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
        Transações
      </h1>
      <p className="mb-6 text-sm" style={{ color: 'var(--color-muted)' }}>
        Todas as transações
      </p>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon="📈" label="Receitas" value={formatCurrency(totalIncome)} numericValue={totalIncome} numericFormatter={formatCurrency} color="green" />
        <StatCard icon="📉" label="Despesas" value={formatCurrency(totalExpenses)} numericValue={totalExpenses} numericFormatter={formatCurrency} color="red" />
        <StatCard icon="💰" label="Saldo" value={formatCurrency(balance)} numericValue={balance} numericFormatter={formatCurrency} color={balance >= 0 ? 'blue' : 'red'} />
      </div>

      {/* Add Form */}
      <Card className="mb-6">
        <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--color-text)' }}>
          Nova Transação
        </h3>
        <div className="flex gap-3 flex-wrap">
          {/* Toggle Type */}
          <div
            className="flex rounded-lg overflow-hidden border"
            style={{ borderColor: 'var(--color-border)', flexShrink: 0 }}
          >
            {TRANSACTION_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => {
                  setForm((f) => ({ ...f, type: t }))
                }}
                className="px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  background:
                    form.type === t ? (t === 'income' ? 'var(--color-green)' : 'var(--color-red)') : 'transparent',
                  color: form.type === t ? '#fff' : 'var(--color-muted)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {t === 'income' ? '+ Receita' : '− Despesa'}
              </button>
            ))}
          </div>

          <CurrencyInput
            value={form.amount}
            onChange={(v) => {
              setForm((f) => ({ ...f, amount: v }))
            }}
            placeholder="R$ 0,00"
            style={{ width: 160 }}
          />
          <input
            placeholder="Descrição"
            value={form.description}
            onChange={(e) => {
              setForm((f) => ({ ...f, description: e.target.value }))
            }}
            style={{ flex: 1, minWidth: 180 }}
          />
          <select
            value={form.category}
            onChange={(e) => {
              setForm((f) => ({ ...f, category: e.target.value }))
            }}
            style={{ width: 170 }}
          >
            {CATEGORIES.filter((c) => c !== 'Todas').map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={form.date}
            onChange={(e) => {
              setForm((f) => ({ ...f, date: e.target.value }))
            }}
            style={{ width: 150 }}
          />
          <Button
            onClick={() => {
              void handleAdd()
            }}
            variant="primary"
          >
            Adicionar
          </Button>
        </div>
      </Card>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex gap-1.5">
          {FILTER_TYPES.map((f) => (
            <button
              key={f}
              onClick={() => {
                setFilter(f)
              }}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: filter === f ? 'var(--color-blue)' : 'var(--color-surface)',
                color: filter === f ? '#fff' : 'var(--color-muted)',
                border: `1px solid ${filter === f ? 'var(--color-blue)' : 'var(--color-border)'}`,
                cursor: 'pointer',
              }}
            >
              {f === 'all' ? 'Todas' : f === 'income' ? 'Receitas' : 'Despesas'}
            </button>
          ))}
        </div>
        <div style={{ width: 1, height: 20, background: 'var(--color-border)' }} />
        <select
          value={catFilter}
          onChange={(e) => {
            setCatFilter(e.target.value)
          }}
          style={{ width: 180 }}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <span className="text-xs ml-auto" style={{ color: 'var(--color-muted)' }}>
          {filtered.length} transação{filtered.length !== 1 ? 'ões' : ''}
        </span>
      </div>

      {/* List */}
      <Card>
        {filtered.length === 0 ? (
          <p className="text-center py-8" style={{ color: 'var(--color-muted)' }}>
            Nenhuma transação encontrada
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filtered.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between px-3 py-3 rounded-lg group"
                style={{ transition: 'background 0.12s' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface2)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                    style={{
                      backgroundColor: tx.type === 'income' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)',
                    }}
                  >
                    {tx.emoji}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text)', margin: 0 }}>
                      {tx.description}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge color="gray" size="xs">
                        {tx.category}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p
                      className="text-sm font-bold"
                      style={{
                        color: tx.type === 'income' ? 'var(--color-green)' : 'var(--color-red)',
                        margin: 0,
                      }}
                    >
                      {tx.type === 'income' ? '+' : '−'}
                      {formatCurrency(tx.amount)}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-muted)', margin: 0 }}>
                      {tx.date.slice(8)}/{tx.date.slice(5, 7)}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      void handleRemove(tx.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-opacity"
                    style={{
                      background: 'rgba(239,68,68,0.12)',
                      color: 'var(--color-red)',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
