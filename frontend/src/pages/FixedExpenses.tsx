import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import ProgressBar from '../components/ui/ProgressBar'
import Button from '../components/ui/Button'
import StatCard from '../components/ui/StatCard'
import CurrencyInput from '../components/ui/CurrencyInput'
import { formatCurrency } from '../utils/currency'
import { type FixedExpense, type FixedExpenseKind } from '../types'
import { useFetch } from '../hooks/useApi'
import { decodeFixedExpense, decodeFixedExpenseList } from '../lib/decode'
import { useLocale } from '../hooks/useLocale'

interface FormState {
  name: string
  amount: number
  type: FixedExpenseKind
}

interface EditFormState {
  name: string
  amount: number
  type: FixedExpenseKind
  confidence: number
  estimate: number
}

const EXPENSE_KINDS: FixedExpenseKind[] = ['fixed', 'variable']

// ─── Component ────────────────────────────────────────────────────────────────

export default function FixedExpenses() {
  const { t } = useTranslation()
  const { language, currency } = useLocale()

  const { data: serverData } = useFetch('/fixed-expenses/', decodeFixedExpenseList)
  const [additions, setAdditions] = useState<FixedExpense[]>([])
  const [deletedIds, setDeletedIds] = useState<number[]>([])
  const [form, setForm] = useState<FormState>({ name: '', amount: 0, type: 'fixed' })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<EditFormState>({
    name: '',
    amount: 0,
    type: 'fixed',
    confidence: 100,
    estimate: 0,
  })
  const [addSaving, setAddSaving] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  // Esc closes the inline edit form
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        setEditingId(null)
        setEditError(null)
      }
    }
    if (editingId !== null) {
      window.addEventListener('keydown', handleKeyDown)
      return () => { window.removeEventListener('keydown', handleKeyDown) }
    }
  }, [editingId])

  const serverIds = new Set((serverData ?? []).map((e) => e.id))
  const pendingAdditions = additions.filter((a) => !serverIds.has(a.id))
  const expenses = [...pendingAdditions, ...(serverData ?? []).filter((e) => !deletedIds.includes(e.id))]

  const totalMonth = expenses.reduce((s, e) => s + e.amount, 0)
  const totalForecast = expenses.reduce((s, e) => s + e.estimate, 0)
  const fixedItems = expenses.filter((e) => e.type === 'fixed')
  const variableItems = expenses.filter((e) => e.type === 'variable')

  const kindLabels: Record<FixedExpenseKind, string> = {
    fixed: t('fixed_expenses.fixed'),
    variable: t('fixed_expenses.variable'),
  }

  const handleAdd = async () => {
    setAddError(null)
    if (!form.name) {
      setAddError('Preencha o nome do gasto.')
      return
    }
    if (form.amount <= 0) {
      setAddError('Informe um valor maior que zero.')
      return
    }
    const body = {
      name: form.name,
      amount: form.amount,
      type: form.type,
      confidence: form.type === 'fixed' ? 100 : 70,
      estimate: form.amount,
    }
    setAddSaving(true)
    try {
      const r = await fetch('/api/v1/fixed-expenses/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!r.ok) {
        setAddError(`Erro ao salvar (HTTP ${String(r.status)}).`)
        return
      }
      const raw: unknown = await r.json()
      const created = decodeFixedExpense(raw)
      setAdditions((prev) => [...prev, created])
      setForm({ name: '', amount: 0, type: 'fixed' })
    } finally {
      setAddSaving(false)
    }
  }

  const handleRemove = async (id: number) => {
    await fetch(`/api/v1/fixed-expenses/${String(id)}`, { method: 'DELETE' })
    setAdditions((prev) => prev.filter((e) => e.id !== id))
    setDeletedIds((prev) => [...prev, id])
    setConfirmDeleteId(null)
  }

  const handleEditStart = (expense: FixedExpense) => {
    setEditingId(expense.id)
    setEditError(null)
    setEditForm({
      name: expense.name,
      amount: expense.amount,
      type: expense.type,
      confidence: expense.confidence,
      estimate: expense.estimate,
    })
  }

  const handleEditCancel = () => {
    setEditingId(null)
    setEditError(null)
  }

  const handleEditSave = async (id: number) => {
    setEditError(null)
    if (!editForm.name) {
      setEditError('Preencha o nome do gasto.')
      return
    }
    if (editForm.amount <= 0) {
      setEditError('Informe um valor maior que zero.')
      return
    }
    const body = {
      name: editForm.name,
      amount: editForm.amount,
      type: editForm.type,
      confidence: editForm.confidence,
      estimate: editForm.estimate,
    }
    setEditSaving(true)
    try {
      const r = await fetch(`/api/v1/fixed-expenses/${String(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!r.ok) {
        setEditError(`Erro ao salvar (HTTP ${String(r.status)}).`)
        return
      }
      const raw: unknown = await r.json()
      const updated = decodeFixedExpense(raw)
      setAdditions((prev) => {
        const inAdditions = prev.some((e) => e.id === id)
        if (inAdditions) return prev.map((e) => (e.id === id ? updated : e))
        return [...prev, updated]
      })
      setDeletedIds((prev) => [...prev, id])
      setEditingId(null)
    } finally {
      setEditSaving(false)
    }
  }

  const expenseGroups = [
    { labelKey: 'fixed_expenses.fixed', data: fixedItems, color: 'var(--color-blue)' },
    { labelKey: 'fixed_expenses.variable', data: variableItems, color: 'var(--color-purple)' },
  ] as const

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100 }}>
      <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
        {t('fixed_expenses.title')}
      </h1>
      <p className="mb-6 text-sm" style={{ color: 'var(--color-muted)' }}>
        {t('fixed_expenses.subtitle')}
      </p>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard
          icon="📋"
          label={t('fixed_expenses.current_month_total')}
          value={formatCurrency(totalMonth, currency, language)}
          numericValue={totalMonth}
          numericFormatter={(v: number) => formatCurrency(v, currency, language)}
          sub={t('fixed_expenses.items_count', { count: expenses.length })}
          color="blue"
        />
        <StatCard
          icon="🔮"
          label={t('fixed_expenses.next_month_forecast')}
          value={formatCurrency(totalForecast, currency, language)}
          numericValue={totalForecast}
          numericFormatter={(v: number) => formatCurrency(v, currency, language)}
          sub={t('fixed_expenses.based_on_ema')}
          color="purple"
        />
        <StatCard
          icon="📌"
          label={t('fixed_expenses.fixed')}
          value={`${String(fixedItems.length)} de ${String(expenses.length)}`}
          sub={formatCurrency(fixedItems.reduce((s, e) => s + e.amount, 0), currency, language)}
          color="yellow"
        />
      </div>

      {/* Add Form */}
      <Card className="mb-6">
        <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--color-text)' }}>
          {t('fixed_expenses.add_recurring')}
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
          <CurrencyInput
            value={form.amount}
            onChange={(v) => {
              setForm((f) => ({ ...f, amount: v }))
            }}
            placeholder="R$ 0,00"
            style={{ width: 140 }}
          />
          <div
            className="flex rounded-lg overflow-hidden border"
            style={{ borderColor: 'var(--color-border)', flexShrink: 0 }}
          >
            {EXPENSE_KINDS.map((kindKey) => (
              <button
                key={kindKey}
                onClick={() => {
                  setForm((f) => ({ ...f, type: kindKey }))
                }}
                className="px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  background: form.type === kindKey ? 'var(--color-blue)' : 'transparent',
                  color: form.type === kindKey ? '#fff' : 'var(--color-muted)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {kindLabels[kindKey]}
              </button>
            ))}
          </div>
          <Button
            onClick={() => {
              void handleAdd()
            }}
            disabled={addSaving}
          >
            {addSaving ? t('transactions.saving') : t('common.add')}
          </Button>
        </div>
        {addError !== null && (
          <p
            className="text-xs mt-3 px-3 py-2 rounded-lg"
            style={{
              color: 'var(--color-red)',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
            }}
          >
            ⚠ {addError}
          </p>
        )}
      </Card>

      {/* Empty state — no expenses at all */}
      {expenses.length === 0 && (
        <p className="text-center py-12" style={{ color: 'var(--color-muted)' }}>
          {t('fixed_expenses.empty_state')}
        </p>
      )}

      {/* Expense Groups */}
      {expenseGroups.map((group) => (
        <div key={group.labelKey} className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
              {t(group.labelKey)}
            </h3>
            <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
            <span className="text-xs font-medium" style={{ color: group.color }}>
              {formatCurrency(group.data.reduce((s, e) => s + e.amount, 0), currency, language)}
            </span>
          </div>
          {group.data.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
              {t('fixed_expenses.no_items')}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {group.data.map((expense) => {
                const isEditing = editingId === expense.id
                if (isEditing) {
                  return (
                    <Card key={expense.id}>
                      <div className="flex flex-col gap-3">
                        <div className="flex gap-3 flex-wrap items-center">
                          <input
                            placeholder="Nome"
                            value={editForm.name}
                            onChange={(e) => {
                              setEditForm((f) => ({ ...f, name: e.target.value }))
                            }}
                            style={{ flex: 1, minWidth: 160 }}
                          />
                          <CurrencyInput
                            value={editForm.amount}
                            onChange={(v) => {
                              setEditForm((f) => ({ ...f, amount: v }))
                            }}
                            placeholder="R$ 0,00"
                            style={{ width: 140 }}
                          />
                          <CurrencyInput
                            value={editForm.estimate}
                            onChange={(v) => {
                              setEditForm((f) => ({ ...f, estimate: v }))
                            }}
                            placeholder="Previsão"
                            style={{ width: 140 }}
                          />
                          <div
                            className="flex rounded-lg overflow-hidden border"
                            style={{ borderColor: 'var(--color-border)', flexShrink: 0 }}
                          >
                            {EXPENSE_KINDS.map((kindKey) => (
                              <button
                                key={kindKey}
                                onClick={() => {
                                  setEditForm((f) => ({ ...f, type: kindKey }))
                                }}
                                className="px-4 py-2 text-sm font-medium transition-colors"
                                style={{
                                  background: editForm.type === kindKey ? 'var(--color-blue)' : 'transparent',
                                  color: editForm.type === kindKey ? '#fff' : 'var(--color-muted)',
                                  border: 'none',
                                  cursor: 'pointer',
                                }}
                              >
                                {kindLabels[kindKey]}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <label className="text-xs flex items-center gap-2" style={{ color: 'var(--color-muted)' }}>
                            {t('fixed_expenses.confidence')}:
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={editForm.confidence}
                              onChange={(e) => {
                                setEditForm((f) => ({ ...f, confidence: Number(e.target.value) }))
                              }}
                              style={{ width: 64 }}
                            />
                            %
                          </label>
                          <div className="flex gap-2 ml-auto flex-col items-end">
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  void handleEditSave(expense.id)
                                }}
                                disabled={editSaving}
                                className="px-4 py-1.5 rounded-lg text-sm font-medium"
                                style={{
                                  background: 'var(--color-blue)',
                                  color: '#fff',
                                  border: 'none',
                                  cursor: editSaving ? 'not-allowed' : 'pointer',
                                  opacity: editSaving ? 0.6 : 1,
                                }}
                              >
                                {editSaving ? t('transactions.saving') : t('common.save')}
                              </button>
                              <button
                                onClick={handleEditCancel}
                                className="px-4 py-1.5 rounded-lg text-sm font-medium"
                                style={{
                                  background: 'transparent',
                                  color: 'var(--color-muted)',
                                  border: '1px solid var(--color-border)',
                                  cursor: 'pointer',
                                }}
                              >
                                {t('common.cancel')}
                              </button>
                            </div>
                            {editError !== null && (
                              <p
                                className="text-xs px-3 py-2 rounded-lg"
                                style={{
                                  color: 'var(--color-red)',
                                  background: 'rgba(239,68,68,0.08)',
                                  border: '1px solid rgba(239,68,68,0.2)',
                                }}
                              >
                                ⚠ {editError}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                }

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
                            {kindLabels[expense.type]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-6">
                          <div>
                            <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>
                              {t('fixed_expenses.current_month')}
                            </p>
                            <p className="font-bold text-base" style={{ color: 'var(--color-text)' }}>
                              {formatCurrency(expense.amount, currency, language)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>
                              {t('fixed_expenses.next_month_short')}
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
                              {formatCurrency(expense.estimate, currency, language)}
                              {diff !== 0 && (
                                <span className="text-xs ml-1.5">
                                  ({diff > 0 ? '+' : ''}
                                  {formatCurrency(diff, currency, language)})
                                </span>
                              )}
                            </p>
                          </div>
                          <div style={{ flex: 1 }}>
                            <p className="text-xs mb-1.5" style={{ color: 'var(--color-muted)' }}>
                              {t('fixed_expenses.confidence')}: {expense.confidence}%
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
                      <div className="ml-4 flex gap-1 items-center" style={{ flexShrink: 0 }}>
                        <button
                          onClick={() => {
                            handleEditStart(expense)
                          }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm opacity-40 hover:opacity-100 transition-opacity"
                          style={{
                            background: 'rgba(59,130,246,0.1)',
                            color: 'var(--color-blue)',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          ✏
                        </button>
                        {confirmDeleteId === expense.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => { void handleRemove(expense.id) }}
                              className="text-xs px-2 py-1 rounded-lg"
                              style={{
                                background: 'var(--color-red)',
                                color: '#fff',
                                border: 'none',
                                cursor: 'pointer',
                              }}
                            >
                              {t('common.confirm')}
                            </button>
                            <button
                              onClick={() => { setConfirmDeleteId(null) }}
                              className="text-xs px-2 py-1 rounded-lg"
                              style={{
                                background: 'transparent',
                                color: 'var(--color-muted)',
                                border: '1px solid var(--color-border)',
                                cursor: 'pointer',
                              }}
                            >
                              {t('common.cancel')}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setConfirmDeleteId(expense.id) }}
                            title={t('common.delete')}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm opacity-40 hover:opacity-100 transition-opacity"
                            style={{
                              background: 'rgba(239,68,68,0.1)',
                              color: 'var(--color-red)',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
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
