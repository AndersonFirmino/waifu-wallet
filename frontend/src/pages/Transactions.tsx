import { useState } from 'react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import StatCard from '../components/ui/StatCard'
import { formatCurrency } from '../utils/currency'
import { type Transaction, type TransactionType } from '../types'

// ─── Fake Data ────────────────────────────────────────────────────────────────

const FAKE_TRANSACTIONS: Transaction[] = [
  { id: 1, tipo: 'receita', desc: 'Salário', categoria: 'Trabalho', emoji: '💼', valor: 6500, data: '2026-03-05' },
  { id: 2, tipo: 'despesa', desc: 'Aluguel', categoria: 'Moradia', emoji: '🏠', valor: 1500, data: '2026-03-05' },
  { id: 3, tipo: 'despesa', desc: 'Condomínio', categoria: 'Moradia', emoji: '🏗️', valor: 320, data: '2026-03-05' },
  { id: 4, tipo: 'despesa', desc: 'Conta de Luz', categoria: 'Contas', emoji: '💡', valor: 145, data: '2026-03-07' },
  { id: 5, tipo: 'despesa', desc: 'Internet', categoria: 'Contas', emoji: '📡', valor: 120, data: '2026-03-07' },
  { id: 6, tipo: 'despesa', desc: 'Plano de Saúde', categoria: 'Saúde', emoji: '🏥', valor: 280, data: '2026-03-07' },
  { id: 7, tipo: 'despesa', desc: 'Supermercado', categoria: 'Alimentação', emoji: '🛒', valor: 280, data: '2026-03-08' },
  { id: 8, tipo: 'despesa', desc: 'Farmácia', categoria: 'Saúde', emoji: '💊', valor: 85, data: '2026-03-09' },
  { id: 9, tipo: 'despesa', desc: 'Uber', categoria: 'Transporte', emoji: '🚗', valor: 35, data: '2026-03-09' },
  { id: 10, tipo: 'despesa', desc: 'Netflix', categoria: 'Lazer', emoji: '🎬', valor: 55.90, data: '2026-03-10' },
  { id: 11, tipo: 'despesa', desc: 'Spotify', categoria: 'Lazer', emoji: '🎵', valor: 22.90, data: '2026-03-10' },
  { id: 12, tipo: 'despesa', desc: 'Restaurante', categoria: 'Alimentação', emoji: '🍽️', valor: 95, data: '2026-03-10' },
  { id: 13, tipo: 'despesa', desc: 'Mercado Extra', categoria: 'Alimentação', emoji: '🛒', valor: 148, data: '2026-03-11' },
  { id: 14, tipo: 'receita', desc: 'Freelance', categoria: 'Renda Extra', emoji: '💻', valor: 1000, data: '2026-03-11' },
  { id: 15, tipo: 'despesa', desc: 'Gasolina', categoria: 'Transporte', emoji: '⛽', valor: 120, data: '2026-03-11' },
]

const CATEGORIAS = ['Todas', 'Trabalho', 'Renda Extra', 'Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Lazer', 'Contas']

type FilterType = 'todas' | TransactionType

interface FormState {
  tipo: TransactionType
  valor: string
  desc: string
  categoria: string
  data: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>(FAKE_TRANSACTIONS)
  const [filter, setFilter] = useState<FilterType>('todas')
  const [catFilter, setCatFilter] = useState('Todas')
  const [form, setForm] = useState<FormState>({
    tipo: 'despesa',
    valor: '',
    desc: '',
    categoria: 'Alimentação',
    data: '2026-03-11',
  })

  const filtered = transactions.filter((t) => {
    const typeOk = filter === 'todas' || t.tipo === filter
    const catOk = catFilter === 'Todas' || t.categoria === catFilter
    return typeOk && catOk
  })

  const totalReceitas = transactions.filter((t) => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0)
  const totalDespesas = transactions.filter((t) => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0)
  const saldo = totalReceitas - totalDespesas

  const handleAdd = () => {
    const valor = parseFloat(form.valor.replace(',', '.'))
    if (!form.desc || isNaN(valor) || valor <= 0) return
    const next: Transaction = {
      id: Date.now(),
      tipo: form.tipo,
      desc: form.desc,
      categoria: form.categoria,
      emoji: form.tipo === 'receita' ? '💰' : '💸',
      valor,
      data: form.data,
    }
    setTransactions((prev) => [next, ...prev])
    setForm((f) => ({ ...f, valor: '', desc: '' }))
  }

  const handleRemove = (id: number) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200 }}>
      <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
        Transações
      </h1>
      <p className="mb-6 text-sm" style={{ color: 'var(--color-muted)' }}>
        Março de 2026
      </p>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon="📈" label="Receitas" value={formatCurrency(totalReceitas)} color="green" />
        <StatCard icon="📉" label="Despesas" value={formatCurrency(totalDespesas)} color="red" />
        <StatCard icon="💰" label="Saldo" value={formatCurrency(saldo)} color={saldo >= 0 ? 'blue' : 'red'} />
      </div>

      {/* Add Form */}
      <Card className="mb-6">
        <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--color-text)' }}>
          Nova Transação
        </h3>
        <div className="flex gap-3 flex-wrap">
          {/* Toggle Tipo */}
          <div
            className="flex rounded-lg overflow-hidden border"
            style={{ borderColor: 'var(--color-border)', flexShrink: 0 }}
          >
            {(['receita', 'despesa'] as TransactionType[]).map((t) => (
              <button
                key={t}
                onClick={() => setForm((f) => ({ ...f, tipo: t }))}
                className="px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  background: form.tipo === t
                    ? t === 'receita' ? 'var(--color-green)' : 'var(--color-red)'
                    : 'transparent',
                  color: form.tipo === t ? '#fff' : 'var(--color-muted)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {t === 'receita' ? '+ Receita' : '− Despesa'}
              </button>
            ))}
          </div>

          <input
            placeholder="Valor (ex: 150,00)"
            value={form.valor}
            onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
            style={{ width: 160 }}
          />
          <input
            placeholder="Descrição"
            value={form.desc}
            onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))}
            style={{ flex: 1, minWidth: 180 }}
          />
          <select
            value={form.categoria}
            onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
            style={{ width: 170 }}
          >
            {CATEGORIAS.filter((c) => c !== 'Todas').map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            type="date"
            value={form.data}
            onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
            style={{ width: 150 }}
          />
          <Button onClick={handleAdd} variant="primary">
            Adicionar
          </Button>
        </div>
      </Card>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex gap-1.5">
          {(['todas', 'receita', 'despesa'] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: filter === f ? 'var(--color-blue)' : 'var(--color-surface)',
                color: filter === f ? '#fff' : 'var(--color-muted)',
                border: `1px solid ${filter === f ? 'var(--color-blue)' : 'var(--color-border)'}`,
                cursor: 'pointer',
              }}
            >
              {f === 'todas' ? 'Todas' : f === 'receita' ? 'Receitas' : 'Despesas'}
            </button>
          ))}
        </div>
        <div style={{ width: 1, height: 20, background: 'var(--color-border)' }} />
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          style={{ width: 180 }}
        >
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>{c}</option>
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
                      backgroundColor:
                        tx.tipo === 'receita' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)',
                    }}
                  >
                    {tx.emoji}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text)', margin: 0 }}>
                      {tx.desc}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge color="gray" size="xs">
                        {tx.categoria}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p
                      className="text-sm font-bold"
                      style={{
                        color: tx.tipo === 'receita' ? 'var(--color-green)' : 'var(--color-red)',
                        margin: 0,
                      }}
                    >
                      {tx.tipo === 'receita' ? '+' : '−'}
                      {formatCurrency(tx.valor)}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-muted)', margin: 0 }}>
                      {tx.data.slice(8)}/{tx.data.slice(5, 7)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemove(tx.id)}
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
