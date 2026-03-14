import { useState, useCallback } from 'react'
import CurrencyInput from '../components/ui/CurrencyInput'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import StatCard from '../components/ui/StatCard'
import ProgressBar from '../components/ui/ProgressBar'
import { formatCurrency } from '../utils/currency'
import { formatDate } from '../utils/date'
import { type SalaryPlan, type SalaryScheduleMonth } from '../types'
import { useFetch } from '../hooks/useApi'
import {
  decodeSalaryPlan,
  decodeSalaryPlanList,
  decodeSalaryScheduleList,
} from '../lib/decode'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  employer: string
  current_salary: number
  target_salary: number
  increment: number
  increment_interval_months: string
  next_increment_date: string
  split_enabled: boolean
  split_start_date: string
  split_first_pct: string
  split_first_day: string
  split_second_pct: string
  split_second_day: string
  active: boolean
}

const EMPTY_FORM: FormState = {
  employer: '',
  current_salary: 0,
  target_salary: 0,
  increment: 0,
  increment_interval_months: '12',
  next_increment_date: '',
  split_enabled: false,
  split_start_date: '',
  split_first_pct: '100',
  split_first_day: '5',
  split_second_pct: '0',
  split_second_day: '20',
  active: true,
}

function planToForm(plan: SalaryPlan): FormState {
  return {
    employer: plan.employer,
    current_salary: plan.current_salary,
    target_salary: plan.target_salary,
    increment: plan.increment,
    increment_interval_months: String(plan.increment_interval_months),
    next_increment_date: plan.next_increment_date,
    split_enabled: plan.split_enabled,
    split_start_date: plan.split_start_date ?? '',
    split_first_pct: String(plan.split_first_pct),
    split_first_day: String(plan.split_first_day),
    split_second_pct: String(plan.split_second_pct),
    split_second_day: String(plan.split_second_day),
    active: plan.active,
  }
}

function validateForm(form: FormState): string | null {
  if (!form.employer.trim()) return 'Informe o nome da empresa'
  if (form.current_salary <= 0) return 'Salário atual inválido'
  if (form.increment > 0) {
    if (form.target_salary <= 0) return 'Salário alvo inválido'
    const interval = parseInt(form.increment_interval_months, 10)
    if (isNaN(interval) || interval <= 0) return 'Intervalo inválido'
    if (!form.next_increment_date) return 'Informe a data do próximo incremento'
  }
  if (form.split_enabled) {
    const p1 = parseFloat(form.split_first_pct)
    const p2 = parseFloat(form.split_second_pct)
    if (isNaN(p1) || isNaN(p2)) return 'Percentuais inválidos'
    if (Math.round(p1 + p2) !== 100) return 'A soma dos percentuais deve ser 100%'
    const d1 = parseInt(form.split_first_day, 10)
    const d2 = parseInt(form.split_second_day, 10)
    if (isNaN(d1) || d1 < 1 || d1 > 31) return 'Dia do 1º pagamento inválido (1-31)'
    if (isNaN(d2) || d2 < 1 || d2 > 31) return 'Dia do 2º pagamento inválido (1-31)'
  } else {
    const d1 = parseInt(form.split_first_day, 10)
    if (isNaN(d1) || d1 < 1 || d1 > 31) return 'Dia do pagamento inválido (1-31)'
  }
  return null
}

function buildPayload(form: FormState): Record<string, unknown> {
  const splitEnabled = form.split_enabled
  const hasIncrement = form.increment > 0
  return {
    employer: form.employer.trim(),
    current_salary: form.current_salary,
    target_salary: hasIncrement ? form.target_salary : form.current_salary,
    increment: form.increment,
    increment_interval_months: hasIncrement ? parseInt(form.increment_interval_months, 10) : 12,
    next_increment_date: hasIncrement && form.next_increment_date !== '' ? form.next_increment_date : new Date().toISOString().slice(0, 10),
    split_enabled: splitEnabled,
    split_start_date: splitEnabled && form.split_start_date !== '' ? form.split_start_date : null,
    split_first_pct: splitEnabled ? parseFloat(form.split_first_pct) : 100,
    split_first_day: parseInt(form.split_first_day, 10),
    split_second_pct: splitEnabled ? parseFloat(form.split_second_pct) : 0,
    split_second_day: splitEnabled ? parseInt(form.split_second_day, 10) : 0,
    active: form.active,
  }
}

// ─── Schedule sub-component ───────────────────────────────────────────────────

interface ScheduleTableProps {
  planId: number
}

function ScheduleTable({ planId }: ScheduleTableProps) {
  const url = `/salary-plans/${String(planId)}/schedule?months=12`
  const decode = useCallback((raw: unknown) => decodeSalaryScheduleList(raw), [])
  const { data, loading, error } = useFetch(url, decode)

  if (loading) {
    return (
      <p className="text-xs py-3 text-center" style={{ color: 'var(--color-muted)' }}>
        Carregando projeção...
      </p>
    )
  }
  if (error !== null || data === null) {
    return (
      <p className="text-xs py-3 text-center" style={{ color: 'var(--color-red)' }}>
        Erro ao carregar projeção
      </p>
    )
  }

  return (
    <div style={{ overflowX: 'auto', marginTop: 12 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            {['Mês', 'Salário', 'Pagamento 1', 'Pagamento 2'].map((h) => (
              <th
                key={h}
                style={{
                  padding: '6px 10px',
                  textAlign: 'left',
                  color: 'var(--color-muted)',
                  fontWeight: 600,
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row: SalaryScheduleMonth) => (
            <tr
              key={row.month}
              style={{ borderBottom: '1px solid var(--color-border)', opacity: 0.9 }}
            >
              <td style={{ padding: '7px 10px', color: 'var(--color-text)', fontWeight: 500 }}>
                {row.month}
              </td>
              <td style={{ padding: '7px 10px', color: 'var(--color-green)', fontWeight: 600 }}>
                {formatCurrency(row.salary)}
              </td>
              <td style={{ padding: '7px 10px', color: 'var(--color-text)' }}>
                {row.payments[0] !== undefined
                  ? `${formatCurrency(row.payments[0].amount)} (dia ${String(row.payments[0].day)})`
                  : '—'}
              </td>
              <td style={{ padding: '7px 10px', color: 'var(--color-muted)' }}>
                {row.payments[1] !== undefined
                  ? `${formatCurrency(row.payments[1].amount)} (dia ${String(row.payments[1].day)})`
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Plan card ────────────────────────────────────────────────────────────────

interface PlanCardProps {
  plan: SalaryPlan
  onEdit: (plan: SalaryPlan) => void
  onDelete: (id: number) => void
}

function PlanCard({ plan, onEdit, onDelete }: PlanCardProps) {
  const [showSchedule, setShowSchedule] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const atCeiling = plan.current_salary >= plan.target_salary
  const splitLabel = plan.split_enabled
    ? `${String(plan.split_first_pct)}% dia ${String(plan.split_first_day)} / ${String(plan.split_second_pct)}% dia ${String(plan.split_second_day)}`
    : `100% dia ${String(plan.split_first_day)}`
  const splitStartLabel =
    plan.split_enabled && plan.split_start_date !== null
      ? `Split a partir de ${plan.split_start_date}`
      : null

  return (
    <Card>
      {/* Header row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: 'var(--color-surface2, rgba(255,255,255,0.06))' }}
          >
            💼
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base" style={{ color: 'var(--color-text)' }}>
                {plan.employer}
              </h3>
              <Badge color={plan.active ? 'green' : 'gray'} size="xs">
                {plan.active ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
              📆 {splitLabel}
            </p>
            {splitStartLabel !== null && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                🗓 {splitStartLabel}
              </p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              onEdit(plan)
            }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm opacity-60 hover:opacity-100 transition-opacity"
            style={{
              background: 'rgba(59,130,246,0.1)',
              color: 'var(--color-blue)',
              border: 'none',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            title="Editar"
          >
            ✏
          </button>
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  onDelete(plan.id)
                }}
                className="text-xs px-2 py-1 rounded-lg"
                style={{
                  background: 'var(--color-red)',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Confirmar
              </button>
              <button
                onClick={() => {
                  setConfirmDelete(false)
                }}
                className="text-xs px-2 py-1 rounded-lg"
                style={{
                  background: 'transparent',
                  color: 'var(--color-muted)',
                  border: '1px solid var(--color-border)',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setConfirmDelete(true)
              }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm opacity-40 hover:opacity-100 transition-opacity"
              style={{
                background: 'rgba(239,68,68,0.1)',
                color: 'var(--color-red)',
                border: 'none',
                cursor: 'pointer',
                flexShrink: 0,
              }}
              title="Excluir"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Salary progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
            Progresso salarial
          </span>
          <span className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>
            {formatCurrency(plan.current_salary)}
            <span style={{ color: 'var(--color-muted)' }}> → </span>
            {formatCurrency(plan.target_salary)}
          </span>
        </div>
        <ProgressBar
          value={plan.current_salary}
          max={plan.target_salary}
          color="green"
          showPercent
          height={10}
        />
      </div>

      {/* Info row — only shown when plan has progression */}
      {plan.increment > 0 && (
        <div
          className="grid grid-cols-2 gap-3 pt-3"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          <div>
            <p className="text-xs mb-0.5" style={{ color: 'var(--color-muted)' }}>
              Incremento
            </p>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-blue)' }}>
              +{formatCurrency(plan.increment)} a cada {String(plan.increment_interval_months)} meses
            </p>
          </div>
          <div>
            <p className="text-xs mb-0.5" style={{ color: 'var(--color-muted)' }}>
              {atCeiling ? 'Status' : 'Próximo incremento'}
            </p>
            {atCeiling ? (
              <Badge color="yellow" size="xs">
                Teto atingido
              </Badge>
            ) : (
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                {formatDate(plan.next_increment_date)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Schedule toggle */}
      {plan.active && (
        <div className="mt-3" style={{ borderTop: '1px solid var(--color-border)', paddingTop: 10 }}>
          <button
            onClick={() => {
              setShowSchedule((v) => !v)
            }}
            className="flex items-center gap-2 text-xs font-medium transition-colors"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-blue)',
              padding: 0,
            }}
          >
            <span style={{ fontSize: 12 }}>{showSchedule ? '▲' : '▼'}</span>
            {showSchedule ? 'Ocultar projeção 12 meses' : 'Ver projeção 12 meses'}
          </button>
          {showSchedule && <ScheduleTable planId={plan.id} />}
        </div>
      )}
    </Card>
  )
}

// ─── Add / Edit form ──────────────────────────────────────────────────────────

interface PlanFormProps {
  form: FormState
  editingId: number | null
  formError: string | null
  saving: boolean
  initialShowProgression: boolean
  onChange: (patch: Partial<FormState>) => void
  onSubmit: () => void
  onCancel: () => void
}

function PlanForm({ form, editingId, formError, saving, initialShowProgression, onChange, onSubmit, onCancel }: PlanFormProps) {
  const [showProgression, setShowProgression] = useState(initialShowProgression)

  return (
    <Card className="mb-6">
      <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--color-text)' }}>
        {editingId !== null ? 'Editar Plano Salarial' : 'Novo Plano Salarial'}
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {/* Employer */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label className="block text-xs mb-1" style={{ color: 'var(--color-muted)' }}>
            Empresa *
          </label>
          <input
            placeholder="Nome da empresa"
            value={form.employer}
            onChange={(e) => {
              onChange({ employer: e.target.value })
            }}
            style={{ width: '100%' }}
          />
        </div>

        {/* Current salary */}
        <div>
          <label className="block text-xs mb-1" style={{ color: 'var(--color-muted)' }}>
            Salário atual (R$) *
          </label>
          <CurrencyInput
            value={form.current_salary}
            onChange={(v) => {
              onChange({ current_salary: v })
            }}
            placeholder="R$ 0,00"
          />
        </div>

        {/* Target salary — only shown with progression */}
        {showProgression && (
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--color-muted)' }}>
              Salário alvo (R$) *
            </label>
            <CurrencyInput
              value={form.target_salary}
              onChange={(v) => {
                onChange({ target_salary: v })
              }}
              placeholder="R$ 0,00"
            />
          </div>
        )}

        {/* Progression toggle + increment fields */}
        <div style={{ gridColumn: showProgression ? 'auto' : '2 / -1' }}>
          <div className="flex items-center gap-2 mb-3">
            <button
              type="button"
              onClick={() => {
                const next = !showProgression
                setShowProgression(next)
                if (!next) onChange({ increment: 0 })
              }}
              style={{
                width: 36,
                height: 20,
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                background: showProgression ? 'var(--color-green)' : 'var(--color-surface2)',
                position: 'relative',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: '#fff',
                  position: 'absolute',
                  top: 2,
                  left: showProgression ? 18 : 2,
                  transition: 'left 0.2s',
                }}
              />
            </button>
            <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
              Salário com progressão (incrementos periódicos)
            </span>
          </div>
        </div>

        {showProgression && (
          <>
            {/* Increment */}
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--color-muted)' }}>
                Incremento (R$) *
              </label>
              <CurrencyInput
                value={form.increment}
                onChange={(v) => {
                  onChange({ increment: v })
                }}
                placeholder="R$ 0,00"
              />
            </div>

            {/* Interval */}
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--color-muted)' }}>
                Intervalo (meses) *
              </label>
              <input
                placeholder="Ex: 12"
                value={form.increment_interval_months}
                onChange={(e) => {
                  onChange({ increment_interval_months: e.target.value })
                }}
              />
            </div>

            {/* Next increment date */}
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--color-muted)' }}>
                Data do próximo incremento *
              </label>
              <input
                type="date"
                value={form.next_increment_date}
                onChange={(e) => {
                  onChange({ next_increment_date: e.target.value })
                }}
              />
            </div>
          </>
        )}

        {/* Active toggle */}
        <div className="flex items-center gap-3">
          <label className="text-xs" style={{ color: 'var(--color-muted)' }}>
            Status
          </label>
          <button
            type="button"
            onClick={() => {
              onChange({ active: !form.active })
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: form.active ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.15)',
              color: form.active ? 'var(--color-green)' : 'var(--color-muted)',
              border: `1px solid ${form.active ? 'rgba(16,185,129,0.3)' : 'rgba(100,116,139,0.3)'}`,
              cursor: 'pointer',
            }}
          >
            {form.active ? '✓ Ativo' : '— Inativo'}
          </button>
        </div>

        {/* Split toggle */}
        <div style={{ gridColumn: '1 / -1' }}>
          <div className="flex items-center gap-3 mb-3">
            <label className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>
              Pagamento parcelado
            </label>
            <button
              type="button"
              onClick={() => {
                const next = !form.split_enabled
                onChange({
                  split_enabled: next,
                  split_first_pct: next ? '60' : '100',
                  split_second_pct: next ? '40' : '0',
                })
              }}
              className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
              style={{
                background: form.split_enabled ? 'var(--color-blue)' : 'var(--color-border)',
                border: 'none',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <span
                className="inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform"
                style={{
                  transform: form.split_enabled ? 'translateX(18px)' : 'translateX(3px)',
                }}
              />
            </button>
            <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
              {form.split_enabled ? 'Dois pagamentos' : 'Pagamento único'}
            </span>
          </div>

          {/* Split start date — only when split is enabled */}
          {form.split_enabled && (
            <div className="mb-3">
              <label className="block text-xs mb-1" style={{ color: 'var(--color-muted)' }}>
                Split válido a partir de (mês/ano)
              </label>
              <input
                type="date"
                value={form.split_start_date}
                onChange={(e) => {
                  onChange({ split_start_date: e.target.value })
                }}
                placeholder="Deixe vazio para sempre"
              />
              <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                Antes dessa data o pagamento é integral no 1º dia. Deixe vazio para aplicar desde sempre.
              </p>
            </div>
          )}

          {/* Split fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--color-muted)' }}>
                {form.split_enabled ? '1º pagamento — % *' : 'Percentual (%)'}
              </label>
              <input
                placeholder="100"
                value={form.split_first_pct}
                disabled={!form.split_enabled}
                onChange={(e) => {
                  onChange({ split_first_pct: e.target.value })
                }}
                style={{ opacity: form.split_enabled ? 1 : 0.5 }}
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--color-muted)' }}>
                {form.split_enabled ? '1º pagamento — Dia *' : 'Dia do pagamento *'}
              </label>
              <input
                placeholder="5"
                value={form.split_first_day}
                onChange={(e) => {
                  onChange({ split_first_day: e.target.value })
                }}
              />
            </div>
            {form.split_enabled && (
              <>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--color-muted)' }}>
                    2º pagamento — % *
                  </label>
                  <input
                    placeholder="40"
                    value={form.split_second_pct}
                    onChange={(e) => {
                      onChange({ split_second_pct: e.target.value })
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--color-muted)' }}>
                    2º pagamento — Dia *
                  </label>
                  <input
                    placeholder="20"
                    value={form.split_second_day}
                    onChange={(e) => {
                      onChange({ split_second_day: e.target.value })
                    }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {formError !== null && (
        <p
          className="text-xs mt-3 px-3 py-2 rounded-lg"
          style={{
            color: 'var(--color-red)',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
          }}
        >
          ⚠ {formError}
        </p>
      )}

      <div className="flex gap-3 mt-4 justify-end">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          size="sm"
          disabled={saving}
          onClick={onSubmit}
        >
          {saving ? 'Salvando...' : editingId !== null ? 'Salvar alterações' : 'Criar plano'}
        </Button>
      </div>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SalaryPlans() {
  const { data: serverPlans } = useFetch('/salary-plans/', decodeSalaryPlanList)

  const [additions, setAdditions] = useState<SalaryPlan[]>([])
  const [deletedIds, setDeletedIds] = useState<number[]>([])
  const [updatedPlans, setUpdatedPlans] = useState<SalaryPlan[]>([])

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [initialShowProgression, setInitialShowProgression] = useState(false)

  // Merge server data with local mutations
  const serverIds = new Set((serverPlans ?? []).map((p) => p.id))
  const pendingAdditions = additions.filter((a) => !serverIds.has(a.id))
  const plans: SalaryPlan[] = [
    ...pendingAdditions,
    ...(serverPlans ?? [])
      .filter((p) => !deletedIds.includes(p.id))
      .map((p) => updatedPlans.find((u) => u.id === p.id) ?? p),
  ]

  const activePlans = plans.filter((p) => p.active)

  // ─── Stats ───────────────────────────────────────────────────────────────

  const totalCurrentIncome = activePlans.reduce((s, p) => s + p.current_salary, 0)
  const totalTargetIncome = activePlans.reduce((s, p) => s + p.target_salary, 0)
  const overallProgressPct =
    totalTargetIncome > 0 ? Math.round((totalCurrentIncome / totalTargetIncome) * 100) : 0

  const nextRaisePlan = activePlans
    .filter((p) => p.current_salary < p.target_salary)
    .sort((a, b) => a.next_increment_date.localeCompare(b.next_increment_date))[0]

  // ─── Handlers ────────────────────────────────────────────────────────────

  function openCreate(): void {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setInitialShowProgression(false)
    setShowForm(true)
  }

  function openEdit(plan: SalaryPlan): void {
    setEditingId(plan.id)
    setForm(planToForm(plan))
    setFormError(null)
    setInitialShowProgression(plan.increment > 0)
    setShowForm(true)
  }

  function closeForm(): void {
    setShowForm(false)
    setEditingId(null)
    setFormError(null)
  }

  function patchForm(patch: Partial<FormState>): void {
    setForm((prev) => ({ ...prev, ...patch }))
  }

  async function handleSubmit(): Promise<void> {
    const err = validateForm(form)
    if (err !== null) {
      setFormError(err)
      return
    }
    setFormError(null)
    setSaving(true)

    try {
      const payload = buildPayload(form)
      if (editingId !== null) {
        const r = await fetch(`/api/v1/salary-plans/${String(editingId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!r.ok) {
          setFormError('Erro ao salvar. Tente novamente.')
          return
        }
        const raw: unknown = await r.json()
        const updated = decodeSalaryPlan(raw)
        setUpdatedPlans((prev) => [...prev.filter((u) => u.id !== updated.id), updated])
        setAdditions((prev) => prev.filter((a) => a.id !== updated.id))
      } else {
        const r = await fetch('/api/v1/salary-plans/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!r.ok) {
          setFormError('Erro ao criar plano. Tente novamente.')
          return
        }
        const raw: unknown = await r.json()
        const created = decodeSalaryPlan(raw)
        setAdditions((prev) => [...prev, created])
      }
      closeForm()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number): Promise<void> {
    await fetch(`/api/v1/salary-plans/${String(id)}`, { method: 'DELETE' })
    setAdditions((prev) => prev.filter((p) => p.id !== id))
    setUpdatedPlans((prev) => prev.filter((p) => p.id !== id))
    setDeletedIds((prev) => [...prev, id])
    if (editingId === id) closeForm()
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100 }}>
      {/* Page header */}
      <div
        className="rounded-2xl p-6 mb-6"
        style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.18) 0%, rgba(5,78,55,0.25) 100%)',
          border: '1px solid rgba(16,185,129,0.2)',
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
              💼 Plano Salarial
            </h1>
            <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>
              Acompanhe a evolução do seu salário em cada empregador
            </p>
          </div>
          <Button
            onClick={showForm ? closeForm : openCreate}
            variant={showForm ? 'outline' : 'primary'}
          >
            {showForm ? 'Cancelar' : '+ Novo Plano'}
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          icon="💰"
          label="Renda Mensal Total"
          value={formatCurrency(totalCurrentIncome)}
          numericValue={totalCurrentIncome}
          numericFormatter={formatCurrency}
          sub={`${String(activePlans.length)} plano${activePlans.length !== 1 ? 's' : ''} ativo${activePlans.length !== 1 ? 's' : ''}`}
          color="green"
        />
        <StatCard
          icon="🎯"
          label="Meta Total"
          value={formatCurrency(totalTargetIncome)}
          numericValue={totalTargetIncome}
          numericFormatter={formatCurrency}
          sub="soma dos salários-alvo"
          color="blue"
        />
        <StatCard
          icon="📈"
          label="Progresso Geral"
          value={`${String(overallProgressPct)}%`}
          sub="atual vs meta"
          color="purple"
        />
        <StatCard
          icon="📅"
          label="Próximo Aumento"
          value={nextRaisePlan !== undefined ? formatDate(nextRaisePlan.next_increment_date) : '—'}
          sub={nextRaisePlan !== undefined ? nextRaisePlan.employer : 'Sem aumentos pendentes'}
          color="yellow"
        />
      </div>

      {/* Form */}
      {showForm && (
        <PlanForm
          form={form}
          editingId={editingId}
          formError={formError}
          saving={saving}
          initialShowProgression={initialShowProgression}
          onChange={patchForm}
          onSubmit={() => {
            void handleSubmit()
          }}
          onCancel={closeForm}
        />
      )}

      {/* Plans list */}
      {plans.length === 0 ? (
        <p className="text-center py-12" style={{ color: 'var(--color-muted)' }}>
          Nenhum plano salarial cadastrado. Clique em "+ Novo Plano" para começar.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[...plans]
            .sort((a, b) => (b.active ? 1 : 0) - (a.active ? 1 : 0))
            .map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onEdit={openEdit}
                onDelete={(id) => {
                  void handleDelete(id)
                }}
              />
            ))}
        </div>
      )}
    </div>
  )
}
