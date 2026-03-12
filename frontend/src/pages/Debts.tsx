import { useState } from 'react'
import CurrencyInput from '../components/ui/CurrencyInput'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import AnimatedNumber from '../components/ui/AnimatedNumber'
import ProgressBar from '../components/ui/ProgressBar'
import Button from '../components/ui/Button'
import { formatCurrency } from '../utils/currency'
import { daysUntil, formatDateShort } from '../utils/date'
import { type Debt, type Loan } from '../types'
import { useFetch } from '../hooks/useApi'
import { decodeDebt, decodeDebtList, decodeLoan, decodeLoanList } from '../lib/decode'

type ActiveTab = 'debts' | 'loans'

const TABS: [ActiveTab, string][] = [
  ['debts', '💳 Dívidas'],
  ['loans', '🏦 Empréstimos'],
]

// ─── Form state ───────────────────────────────────────────────────────────────

interface DebtFormState {
  name: string
  total: number
  remaining: number
  rate: string
  due_date: string
  installments: string
  urgent: boolean
}

const EMPTY_DEBT_FORM: DebtFormState = {
  name: '',
  total: 0,
  remaining: 0,
  rate: '',
  due_date: '',
  installments: '',
  urgent: false,
}

function debtToForm(debt: Debt): DebtFormState {
  return {
    name: debt.name,
    total: debt.total,
    remaining: debt.remaining,
    rate: String(debt.rate),
    due_date: debt.due_date,
    installments: debt.installments,
    urgent: debt.urgent,
  }
}

interface LoanFormState {
  name: string
  total: number
  remaining: number
  rate: string
  installment: number
  next_payment: string
  installments: string
}

const EMPTY_LOAN_FORM: LoanFormState = {
  name: '',
  total: 0,
  remaining: 0,
  rate: '',
  installment: 0,
  next_payment: '',
  installments: '',
}

function loanToForm(loan: Loan): LoanFormState {
  return {
    name: loan.name,
    total: loan.total,
    remaining: loan.remaining,
    rate: String(loan.rate),
    installment: loan.installment,
    next_payment: loan.next_payment,
    installments: loan.installments,
  }
}

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

  // Debts CRUD state
  const [debtAdditions, setDebtAdditions] = useState<Debt[]>([])
  const [debtDeletedIds, setDebtDeletedIds] = useState<number[]>([])
  const [debtEditedMap, setDebtEditedMap] = useState<Map<number, Debt>>(new Map())

  // Debt form state
  const [showDebtForm, setShowDebtForm] = useState(false)
  const [editingDebtId, setEditingDebtId] = useState<number | null>(null)
  const [debtForm, setDebtForm] = useState<DebtFormState>(EMPTY_DEBT_FORM)

  // Delete confirmation
  const [confirmDeleteDebtId, setConfirmDeleteDebtId] = useState<number | null>(null)

  // Loans CRUD state
  const [loanAdditions, setLoanAdditions] = useState<Loan[]>([])
  const [loanDeletedIds, setLoanDeletedIds] = useState<number[]>([])
  const [loanEditedMap, setLoanEditedMap] = useState<Map<number, Loan>>(new Map())

  // Loan form state
  const [showLoanForm, setShowLoanForm] = useState(false)
  const [editingLoanId, setEditingLoanId] = useState<number | null>(null)
  const [loanForm, setLoanForm] = useState<LoanFormState>(EMPTY_LOAN_FORM)

  // Loan delete confirmation
  const [confirmDeleteLoanId, setConfirmDeleteLoanId] = useState<number | null>(null)

  const serverDebts = fetchedDebts ?? []
  const serverLoans = fetchedLoans ?? []

  const debts: Debt[] = [
    ...debtAdditions.map((d) => debtEditedMap.get(d.id) ?? d),
    ...serverDebts
      .filter((d) => !debtDeletedIds.includes(d.id) && !debtAdditions.some((a) => a.id === d.id))
      .map((d) => debtEditedMap.get(d.id) ?? d),
  ]

  const loans: Loan[] = [
    ...loanAdditions.map((l) => loanEditedMap.get(l.id) ?? l),
    ...serverLoans
      .filter((l) => !loanDeletedIds.includes(l.id) && !loanAdditions.some((a) => a.id === l.id))
      .map((l) => loanEditedMap.get(l.id) ?? l),
  ]

  const totalOwed =
    debts.reduce((s, d) => s + d.remaining, 0) + loans.reduce((s, l) => s + l.remaining, 0)
  const estimatedInterest =
    debts.reduce((s, d) => s + d.remaining * (d.rate / 100), 0) +
    loans.reduce((s, l) => s + l.remaining * (l.rate / 100), 0)
  const totalActive = debts.length + loans.length

  // ── Debt form helpers ──────────────────────────────────────────────────────

  function openAddDebtForm() {
    setEditingDebtId(null)
    setDebtForm(EMPTY_DEBT_FORM)
    setShowDebtForm(true)
  }

  function openEditDebtForm(debt: Debt) {
    setEditingDebtId(debt.id)
    setDebtForm(debtToForm(debt))
    setShowDebtForm(true)
  }

  function closeDebtForm() {
    setShowDebtForm(false)
    setEditingDebtId(null)
    setDebtForm(EMPTY_DEBT_FORM)
  }

  function setDebtField<K extends keyof DebtFormState>(key: K, value: DebtFormState[K]) {
    setDebtForm((f) => ({ ...f, [key]: value }))
  }

  const handleSaveDebt = async () => {
    const rate = parseFloat(debtForm.rate)

    if (!debtForm.name || debtForm.total <= 0 || debtForm.remaining < 0 || isNaN(rate) || !debtForm.due_date)
      return

    const body = {
      name: debtForm.name,
      total: debtForm.total,
      remaining: debtForm.remaining,
      rate,
      due_date: debtForm.due_date,
      installments: debtForm.installments,
      urgent: debtForm.urgent,
    }

    if (editingDebtId !== null) {
      const r = await fetch(`/api/v1/debts/${String(editingDebtId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!r.ok) return
      const raw: unknown = await r.json()
      const updated = decodeDebt(raw)
      setDebtEditedMap((prev) => {
        const next = new Map(prev)
        next.set(updated.id, updated)
        return next
      })
    } else {
      const r = await fetch('/api/v1/debts/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!r.ok) return
      const raw: unknown = await r.json()
      const created = decodeDebt(raw)
      setDebtAdditions((prev) => [...prev, created])
    }

    closeDebtForm()
  }

  const handleDeleteDebt = async (id: number) => {
    if (confirmDeleteDebtId !== id) {
      setConfirmDeleteDebtId(id)
      return
    }
    await fetch(`/api/v1/debts/${String(id)}`, { method: 'DELETE' })
    setDebtAdditions((prev) => prev.filter((d) => d.id !== id))
    setDebtDeletedIds((prev) => [...prev, id])
    setConfirmDeleteDebtId(null)
  }

  // ── Loan form helpers ───────────────────────────────────────────────────────

  function openAddLoanForm() {
    setEditingLoanId(null)
    setLoanForm(EMPTY_LOAN_FORM)
    setShowLoanForm(true)
  }

  function openEditLoanForm(loan: Loan) {
    setEditingLoanId(loan.id)
    setLoanForm(loanToForm(loan))
    setShowLoanForm(true)
  }

  function closeLoanForm() {
    setShowLoanForm(false)
    setEditingLoanId(null)
    setLoanForm(EMPTY_LOAN_FORM)
  }

  function setLoanField<K extends keyof LoanFormState>(key: K, value: LoanFormState[K]) {
    setLoanForm((f) => ({ ...f, [key]: value }))
  }

  const handleSaveLoan = async () => {
    const rate = parseFloat(loanForm.rate)

    if (
      !loanForm.name ||
      loanForm.total <= 0 ||
      loanForm.remaining < 0 ||
      isNaN(rate) ||
      loanForm.installment <= 0 ||
      !loanForm.next_payment
    )
      return

    const body = {
      name: loanForm.name,
      total: loanForm.total,
      remaining: loanForm.remaining,
      rate,
      installment: loanForm.installment,
      next_payment: loanForm.next_payment,
      installments: loanForm.installments,
    }

    if (editingLoanId !== null) {
      const r = await fetch(`/api/v1/loans/${String(editingLoanId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!r.ok) return
      const raw: unknown = await r.json()
      const updated = decodeLoan(raw)
      setLoanEditedMap((prev) => {
        const next = new Map(prev)
        next.set(updated.id, updated)
        return next
      })
    } else {
      const r = await fetch('/api/v1/loans/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!r.ok) return
      const raw: unknown = await r.json()
      const created = decodeLoan(raw)
      setLoanAdditions((prev) => [...prev, created])
    }

    closeLoanForm()
  }

  const handleDeleteLoan = async (id: number) => {
    if (confirmDeleteLoanId !== id) {
      setConfirmDeleteLoanId(id)
      return
    }
    await fetch(`/api/v1/loans/${String(id)}`, { method: 'DELETE' })
    setLoanAdditions((prev) => prev.filter((l) => l.id !== id))
    setLoanDeletedIds((prev) => [...prev, id])
    setConfirmDeleteLoanId(null)
  }

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
              <AnimatedNumber value={totalOwed} formatter={formatCurrency} />
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
              <AnimatedNumber value={estimatedInterest} formatter={formatCurrency} />
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

      {/* ── Dívidas ── */}
      {tab === 'debts' && (
        <div>
          {/* Add debt button */}
          <div className="flex justify-end mb-4">
            <Button
              onClick={() => {
                if (showDebtForm) {
                  closeDebtForm()
                } else {
                  openAddDebtForm()
                }
              }}
              variant={showDebtForm ? 'outline' : 'primary'}
            >
              {showDebtForm ? 'Cancelar' : '+ Adicionar Dívida'}
            </Button>
          </div>

          {/* Add / Edit form */}
          {showDebtForm && (
            <Card className="mb-4">
              <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--color-text)' }}>
                {editingDebtId !== null ? 'Editar Dívida' : 'Nova Dívida'}
              </h3>
              <DebtForm
                form={debtForm}
                setField={setDebtField}
                onSave={handleSaveDebt}
                onCancel={closeDebtForm}
                isEditing={editingDebtId !== null}
              />
            </Card>
          )}

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
                    <div className="flex items-center gap-2">
                      <div className="text-right mr-2">
                        <p className="text-xl font-bold" style={{ color: 'var(--color-red)' }}>
                          {formatCurrency(debt.remaining)}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                          de {formatCurrency(debt.total)}
                        </p>
                      </div>
                      {/* Edit */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          openEditDebtForm(debt)
                        }}
                      >
                        Editar
                      </Button>
                      {/* Delete with confirmation */}
                      <button
                        onClick={() => {
                          void handleDeleteDebt(debt.id)
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{
                          background:
                            confirmDeleteDebtId === debt.id ? 'var(--color-red)' : 'rgba(239,68,68,0.1)',
                          color: confirmDeleteDebtId === debt.id ? '#fff' : 'var(--color-red)',
                          border: `1px solid ${confirmDeleteDebtId === debt.id ? 'var(--color-red)' : 'rgba(239,68,68,0.3)'}`,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {confirmDeleteDebtId === debt.id ? 'Confirmar?' : 'Excluir'}
                      </button>
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
        </div>
      )}

      {/* ── Empréstimos ── */}
      {tab === 'loans' && (
        <div>
          {/* Add loan button */}
          <div className="flex justify-end mb-4">
            <Button
              onClick={() => {
                if (showLoanForm) {
                  closeLoanForm()
                } else {
                  openAddLoanForm()
                }
              }}
              variant={showLoanForm ? 'outline' : 'primary'}
            >
              {showLoanForm ? 'Cancelar' : '+ Adicionar Empréstimo'}
            </Button>
          </div>

          {/* Add / Edit form */}
          {showLoanForm && (
            <Card className="mb-4">
              <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--color-text)' }}>
                {editingLoanId !== null ? 'Editar Empréstimo' : 'Novo Empréstimo'}
              </h3>
              <LoanForm
                form={loanForm}
                setField={setLoanField}
                onSave={handleSaveLoan}
                onCancel={closeLoanForm}
                isEditing={editingLoanId !== null}
              />
            </Card>
          )}

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
                    <div className="flex items-center gap-2">
                      <div className="text-right mr-2">
                        <p className="text-xl font-bold" style={{ color: 'var(--color-red)' }}>
                          {formatCurrency(loan.remaining)}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                          restante de {formatCurrency(loan.total)}
                        </p>
                      </div>
                      {/* Edit */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          openEditLoanForm(loan)
                        }}
                      >
                        Editar
                      </Button>
                      {/* Delete with confirmation */}
                      <button
                        onClick={() => {
                          void handleDeleteLoan(loan.id)
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{
                          background:
                            confirmDeleteLoanId === loan.id ? 'var(--color-red)' : 'rgba(239,68,68,0.1)',
                          color: confirmDeleteLoanId === loan.id ? '#fff' : 'var(--color-red)',
                          border: `1px solid ${confirmDeleteLoanId === loan.id ? 'var(--color-red)' : 'rgba(239,68,68,0.3)'}`,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {confirmDeleteLoanId === loan.id ? 'Confirmar?' : 'Excluir'}
                      </button>
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
        </div>
      )}
    </div>
  )
}

// ─── DebtForm ─────────────────────────────────────────────────────────────────

interface DebtFormProps {
  form: DebtFormState
  setField: <K extends keyof DebtFormState>(key: K, value: DebtFormState[K]) => void
  onSave: () => Promise<void>
  onCancel: () => void
  isEditing: boolean
}

function DebtForm({ form, setField, onSave, onCancel, isEditing }: DebtFormProps) {
  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <input
          placeholder="Nome da dívida"
          value={form.name}
          onChange={(e) => {
            setField('name', e.target.value)
          }}
        />
        <CurrencyInput
          value={form.total}
          onChange={(v) => {
            setField('total', v)
          }}
          placeholder="Total original (R$)"
        />
        <CurrencyInput
          value={form.remaining}
          onChange={(v) => {
            setField('remaining', v)
          }}
          placeholder="Restante (R$)"
        />
        <input
          placeholder="Juros a.m. (%)"
          value={form.rate}
          onChange={(e) => {
            setField('rate', e.target.value)
          }}
        />
        <input
          type="date"
          value={form.due_date}
          onChange={(e) => {
            setField('due_date', e.target.value)
          }}
        />
        <input
          placeholder='Parcelas (ex: 4/12)'
          value={form.installments}
          onChange={(e) => {
            setField('installments', e.target.value)
          }}
        />
      </div>

      {/* Urgent toggle */}
      <div className="flex items-center gap-3 mb-4">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div
            onClick={() => {
              setField('urgent', !form.urgent)
            }}
            className="w-10 h-6 rounded-full relative transition-colors"
            style={{
              background: form.urgent ? 'var(--color-red)' : 'var(--color-border)',
              cursor: 'pointer',
            }}
          >
            <div
              className="w-4 h-4 rounded-full bg-white absolute top-1 transition-transform"
              style={{ left: form.urgent ? 22 : 4 }}
            />
          </div>
          <span className="text-sm" style={{ color: form.urgent ? 'var(--color-red)' : 'var(--color-muted)' }}>
            {form.urgent ? '⚠ Urgente' : 'Urgente'}
          </span>
        </label>
      </div>

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          onClick={() => {
            void onSave()
          }}
        >
          {isEditing ? 'Salvar alterações' : 'Adicionar'}
        </Button>
      </div>
    </div>
  )
}

// ─── LoanForm ──────────────────────────────────────────────────────────────────

interface LoanFormProps {
  form: LoanFormState
  setField: <K extends keyof LoanFormState>(key: K, value: LoanFormState[K]) => void
  onSave: () => Promise<void>
  onCancel: () => void
  isEditing: boolean
}

function LoanForm({ form, setField, onSave, onCancel, isEditing }: LoanFormProps) {
  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <input
          placeholder="Nome do empréstimo"
          value={form.name}
          onChange={(e) => {
            setField('name', e.target.value)
          }}
        />
        <CurrencyInput
          value={form.total}
          onChange={(v) => {
            setField('total', v)
          }}
          placeholder="Total original (R$)"
        />
        <CurrencyInput
          value={form.remaining}
          onChange={(v) => {
            setField('remaining', v)
          }}
          placeholder="Restante (R$)"
        />
        <input
          placeholder="Juros a.m. (%)"
          value={form.rate}
          onChange={(e) => {
            setField('rate', e.target.value)
          }}
        />
        <CurrencyInput
          value={form.installment}
          onChange={(v) => {
            setField('installment', v)
          }}
          placeholder="Valor da parcela (R$)"
        />
        <input
          type="date"
          value={form.next_payment}
          onChange={(e) => {
            setField('next_payment', e.target.value)
          }}
        />
        <input
          placeholder='Parcelas (ex: 2/25)'
          value={form.installments}
          onChange={(e) => {
            setField('installments', e.target.value)
          }}
        />
      </div>

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          onClick={() => {
            void onSave()
          }}
        >
          {isEditing ? 'Salvar alterações' : 'Adicionar'}
        </Button>
      </div>
    </div>
  )
}
