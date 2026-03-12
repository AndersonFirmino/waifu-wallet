import { useState } from 'react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import ProgressBar from '../components/ui/ProgressBar'
import Button from '../components/ui/Button'
import StatCard from '../components/ui/StatCard'
import { formatCurrency } from '../utils/currency'
import { type FixedExpense, type FixedExpenseKind } from '../types'

// ─── Fake Data ────────────────────────────────────────────────────────────────

const FAKE_EXPENSES: FixedExpense[] = [
  { id: 1, nome: 'Aluguel', valor: 1500, tipo: 'Fixo', confianca: 100, previsao: 1500 },
  { id: 2, nome: 'Condomínio', valor: 320, tipo: 'Fixo', confianca: 95, previsao: 320 },
  { id: 3, nome: 'Internet', valor: 120, tipo: 'Fixo', confianca: 100, previsao: 120 },
  { id: 4, nome: 'Plano de Saúde', valor: 280, tipo: 'Fixo', confianca: 100, previsao: 280 },
  { id: 5, nome: 'Netflix', valor: 55.90, tipo: 'Fixo', confianca: 100, previsao: 55.90 },
  { id: 6, nome: 'Spotify', valor: 22.90, tipo: 'Fixo', confianca: 100, previsao: 22.90 },
  { id: 7, nome: 'Conta de Luz', valor: 145, tipo: 'Variável', confianca: 71, previsao: 138 },
  { id: 8, nome: 'Supermercado', valor: 428, tipo: 'Variável', confianca: 63, previsao: 445 },
  { id: 9, nome: 'Combustível', valor: 180, tipo: 'Variável', confianca: 55, previsao: 165 },
]

interface FormState {
  nome: string
  valor: string
  tipo: FixedExpenseKind
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FixedExpenses() {
  const [expenses, setExpenses] = useState<FixedExpense[]>(FAKE_EXPENSES)
  const [form, setForm] = useState<FormState>({ nome: '', valor: '', tipo: 'Fixo' })

  const totalMes = expenses.reduce((s, e) => s + e.valor, 0)
  const totalPrevisao = expenses.reduce((s, e) => s + e.previsao, 0)
  const fixos = expenses.filter((e) => e.tipo === 'Fixo')
  const variaveis = expenses.filter((e) => e.tipo === 'Variável')

  const handleAdd = () => {
    const valor = parseFloat(form.valor.replace(',', '.'))
    if (!form.nome || isNaN(valor) || valor <= 0) return
    const next: FixedExpense = {
      id: Date.now(),
      nome: form.nome,
      valor,
      tipo: form.tipo,
      confianca: form.tipo === 'Fixo' ? 100 : 70,
      previsao: valor,
    }
    setExpenses((prev) => [...prev, next])
    setForm({ nome: '', valor: '', tipo: 'Fixo' })
  }

  const handleRemove = (id: number) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id))
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100 }}>
      <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
        Gastos Fixos
      </h1>
      <p className="mb-6 text-sm" style={{ color: 'var(--color-muted)' }}>
        Controle de despesas recorrentes — Março 2026
      </p>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon="📋" label="Total Mês Atual" value={formatCurrency(totalMes)} sub={`${expenses.length} itens`} color="blue" />
        <StatCard icon="🔮" label="Previsão Próximo Mês" value={formatCurrency(totalPrevisao)} sub="baseado em EMA" color="purple" />
        <StatCard icon="📌" label="Gastos Fixos" value={`${fixos.length} de ${expenses.length}`} sub={formatCurrency(fixos.reduce((s, e) => s + e.valor, 0))} color="yellow" />
      </div>

      {/* Add Form */}
      <Card className="mb-6">
        <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--color-text)' }}>
          Adicionar Gasto Recorrente
        </h3>
        <div className="flex gap-3 flex-wrap items-center">
          <input
            placeholder="Nome (ex: Netflix)"
            value={form.nome}
            onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
            style={{ flex: 1, minWidth: 200 }}
          />
          <input
            placeholder="Valor"
            value={form.valor}
            onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
            style={{ width: 140 }}
          />
          <div
            className="flex rounded-lg overflow-hidden border"
            style={{ borderColor: 'var(--color-border)', flexShrink: 0 }}
          >
            {(['Fixo', 'Variável'] as FixedExpenseKind[]).map((t) => (
              <button
                key={t}
                onClick={() => setForm((f) => ({ ...f, tipo: t }))}
                className="px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  background: form.tipo === t ? 'var(--color-blue)' : 'transparent',
                  color: form.tipo === t ? '#fff' : 'var(--color-muted)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {t}
              </button>
            ))}
          </div>
          <Button onClick={handleAdd}>Adicionar</Button>
        </div>
      </Card>

      {/* Expense Groups */}
      {[{ label: 'Fixos', data: fixos, color: 'var(--color-blue)' }, { label: 'Variáveis', data: variaveis, color: 'var(--color-purple)' }].map(
        (group) => (
          <div key={group.label} className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
                {group.label}
              </h3>
              <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
              <span className="text-xs font-medium" style={{ color: group.color }}>
                {formatCurrency(group.data.reduce((s, e) => s + e.valor, 0))}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {group.data.map((expense) => {
                const diff = expense.previsao - expense.valor
                return (
                  <Card key={expense.id} hover>
                    <div className="flex items-center justify-between">
                      <div style={{ flex: 1 }}>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>
                            {expense.nome}
                          </span>
                          <Badge color={expense.tipo === 'Fixo' ? 'blue' : 'purple'} size="xs">
                            {expense.tipo}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-6">
                          <div>
                            <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>
                              Mês atual
                            </p>
                            <p className="font-bold text-base" style={{ color: 'var(--color-text)' }}>
                              {formatCurrency(expense.valor)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>
                              Previsão próx.
                            </p>
                            <p
                              className="font-semibold text-sm"
                              style={{
                                color: diff > 0 ? 'var(--color-red)' : diff < 0 ? 'var(--color-green)' : 'var(--color-muted)',
                              }}
                            >
                              {formatCurrency(expense.previsao)}
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
                              Confiança: {expense.confianca}%
                            </p>
                            <ProgressBar
                              value={expense.confianca}
                              max={100}
                              color={expense.confianca >= 80 ? 'green' : expense.confianca >= 60 ? 'yellow' : 'orange'}
                              showPercent={false}
                              height={6}
                            />
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemove(expense.id)}
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
          </div>
        ),
      )}
    </div>
  )
}
