import { useState, useEffect } from 'react'
import CurrencyInput from '../components/ui/CurrencyInput'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import ProgressBar from '../components/ui/ProgressBar'
import Button from '../components/ui/Button'
import StatCard from '../components/ui/StatCard'
import { formatCurrency } from '../utils/currency'
import { type SavingsAccount } from '../types'
import { useFetch } from '../hooks/useApi'
import { decodeSavingsAccount, decodeSavingsAccountList } from '../lib/decode'

// ─── Form state ───────────────────────────────────────────────────────────────

interface AccountFormState {
  name: string
  bank: string
  balance: number
  goal: number
  emoji: string
  active: boolean
}

const EMPTY_FORM: AccountFormState = {
  name: '',
  bank: '',
  balance: 0,
  goal: 0,
  emoji: '🐷',
  active: true,
}

function accountToForm(account: SavingsAccount): AccountFormState {
  return {
    name: account.name,
    bank: account.bank,
    balance: account.balance,
    goal: account.goal,
    emoji: account.emoji,
    active: account.active,
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Savings() {
  const { data: serverData } = useFetch('/savings/', decodeSavingsAccountList)

  const [additions, setAdditions] = useState<SavingsAccount[]>([])
  const [deletedIds, setDeletedIds] = useState<number[]>([])
  const [editedMap, setEditedMap] = useState<Map<number, SavingsAccount>>(new Map())

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<AccountFormState>(EMPTY_FORM)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const serverAccounts = serverData ?? []

  const accounts: SavingsAccount[] = [
    ...additions.map((a) => editedMap.get(a.id) ?? a),
    ...serverAccounts
      .filter((a) => !deletedIds.includes(a.id) && !additions.some((x) => x.id === a.id))
      .map((a) => editedMap.get(a.id) ?? a),
  ]

  const activeAccounts = accounts.filter((a) => a.active)
  const totalSaved = activeAccounts.reduce((s, a) => s + a.balance, 0)
  const totalGoal = activeAccounts.filter((a) => a.goal > 0).reduce((s, a) => s + a.goal, 0)
  const overallProgress = totalGoal > 0 ? Math.min(100, Math.round((totalSaved / totalGoal) * 100)) : null
  const biggestAccount = activeAccounts.reduce<SavingsAccount | null>(
    (best, a) => (best === null || a.balance > best.balance ? a : best),
    null,
  )

  // ── Form helpers ──────────────────────────────────────────────────────────

  function openAddForm() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEditForm(account: SavingsAccount) {
    setEditingId(account.id)
    setForm(accountToForm(account))
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError(null)
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') closeForm()
    }
    if (showForm) {
      window.addEventListener('keydown', handleKeyDown)
      return () => { window.removeEventListener('keydown', handleKeyDown) }
    }
  }, [showForm])

  function setField<K extends keyof AccountFormState>(key: K, value: AccountFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const handleSave = async () => {
    if (!form.name) { setFormError('Informe o nome do cofrinho.'); return }
    if (!form.bank) { setFormError('Informe o banco.'); return }
    if (form.balance < 0) { setFormError('O saldo não pode ser negativo.'); return }

    setFormError(null)
    setSaving(true)
    try {
      const body = {
        name: form.name,
        bank: form.bank,
        balance: form.balance,
        goal: form.goal,
        emoji: form.emoji || '🐷',
        active: form.active,
      }

      if (editingId !== null) {
        const r = await fetch(`/api/v1/savings/${String(editingId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!r.ok) { setFormError('Erro ao salvar. Tente novamente.'); return }
        const raw: unknown = await r.json()
        const updated = decodeSavingsAccount(raw)
        setEditedMap((prev) => {
          const next = new Map(prev)
          next.set(updated.id, updated)
          return next
        })
      } else {
        const r = await fetch('/api/v1/savings/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!r.ok) { setFormError('Erro ao salvar. Tente novamente.'); return }
        const raw: unknown = await r.json()
        const created = decodeSavingsAccount(raw)
        setAdditions((prev) => [...prev, created])
      }

      closeForm()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    await fetch(`/api/v1/savings/${String(id)}`, { method: 'DELETE' })
    setAdditions((prev) => prev.filter((a) => a.id !== id))
    setDeletedIds((prev) => [...prev, id])
    setConfirmDeleteId(null)
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100 }}>
      <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
        🐷 Cofrinhos
      </h1>
      <p className="mb-6 text-sm" style={{ color: 'var(--color-muted)' }}>
        Reservas, fundos de emergência e metas de poupança
      </p>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          icon="💰"
          label="Total Guardado"
          value={formatCurrency(totalSaved)}
          numericValue={totalSaved}
          numericFormatter={formatCurrency}
          sub={`${String(activeAccounts.length)} conta${activeAccounts.length !== 1 ? 's' : ''} ativa${activeAccounts.length !== 1 ? 's' : ''}`}
          color="green"
        />
        <StatCard
          icon="🏦"
          label="Contas Ativas"
          value={String(activeAccounts.length)}
          sub={`${String(accounts.length)} no total`}
          color="blue"
        />
        <StatCard
          icon="🏆"
          label="Maior Reserva"
          value={biggestAccount !== null ? formatCurrency(biggestAccount.balance) : '—'}
          numericValue={biggestAccount?.balance}
          numericFormatter={formatCurrency}
          sub={biggestAccount !== null ? biggestAccount.name : 'Nenhuma conta'}
          color="yellow"
        />
        <StatCard
          icon="🎯"
          label="Progresso Geral"
          value={overallProgress !== null ? `${String(overallProgress)}%` : '—'}
          sub={totalGoal > 0 ? `meta: ${formatCurrency(totalGoal)}` : 'Sem metas definidas'}
          color="purple"
        />
      </div>

      {/* Add button + form */}
      <div className="flex justify-end mb-4">
        <Button
          onClick={() => {
            if (showForm) {
              closeForm()
            } else {
              openAddForm()
            }
          }}
          variant={showForm ? 'outline' : 'primary'}
        >
          {showForm ? 'Cancelar' : '+ Novo Cofrinho'}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--color-text)' }}>
            {editingId !== null ? 'Editar Cofrinho' : 'Novo Cofrinho'}
          </h3>
          <AccountForm
            form={form}
            setField={setField}
            onSave={handleSave}
            onCancel={closeForm}
            isEditing={editingId !== null}
            saving={saving}
            formError={formError}
          />
        </Card>
      )}

      {/* Account list */}
      {accounts.length === 0 && (
        <p className="text-center py-12" style={{ color: 'var(--color-muted)' }}>
          Nenhum cofrinho cadastrado
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {accounts.map((account) => {
          const hasGoal = account.goal > 0
          const goalPct = hasGoal ? Math.min(100, Math.round((account.balance / account.goal) * 100)) : 0

          return (
            <Card key={account.id} hover>
              <div className="flex items-start justify-between">
                <div style={{ flex: 1 }}>
                  {/* Header row */}
                  <div className="flex items-center gap-3 mb-3">
                    <span style={{ fontSize: 28 }}>{account.emoji}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-base" style={{ color: 'var(--color-text)' }}>
                          {account.name}
                        </h4>
                        {!account.active && (
                          <Badge color="gray" size="xs">
                            Inativa
                          </Badge>
                        )}
                      </div>
                      <Badge color="blue" size="xs">
                        {account.bank}
                      </Badge>
                    </div>
                  </div>

                  {/* Balance */}
                  <p className="text-2xl font-bold mb-3" style={{ color: 'var(--color-green)' }}>
                    {formatCurrency(account.balance)}
                  </p>

                  {/* Goal progress */}
                  {hasGoal ? (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                          Meta: {formatCurrency(account.goal)}
                        </span>
                        <span
                          className="text-xs font-medium"
                          style={{ color: goalPct >= 100 ? 'var(--color-green)' : 'var(--color-purple)' }}
                        >
                          {String(goalPct)}%
                        </span>
                      </div>
                      <ProgressBar
                        value={account.balance}
                        max={account.goal}
                        color={goalPct >= 100 ? 'green' : 'purple'}
                        showPercent={false}
                        height={8}
                      />
                    </div>
                  ) : (
                    <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                      Sem meta definida
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4" style={{ flexShrink: 0 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      openEditForm(account)
                    }}
                  >
                    Editar
                  </Button>
                  {confirmDeleteId === account.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { void handleDelete(account.id) }}
                        className="text-xs px-2 py-1 rounded-lg"
                        style={{ background: 'var(--color-red)', color: '#fff', border: 'none', cursor: 'pointer' }}
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => { setConfirmDeleteId(null) }}
                        className="text-xs px-2 py-1 rounded-lg"
                        style={{ background: 'transparent', color: 'var(--color-muted)', border: '1px solid var(--color-border)', cursor: 'pointer' }}
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setConfirmDeleteId(account.id) }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: 'rgba(239,68,68,0.1)',
                        color: 'var(--color-red)',
                        border: '1px solid rgba(239,68,68,0.3)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Excluir
                    </button>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// ─── AccountForm ──────────────────────────────────────────────────────────────

interface AccountFormProps {
  form: AccountFormState
  setField: <K extends keyof AccountFormState>(key: K, value: AccountFormState[K]) => void
  onSave: () => Promise<void>
  onCancel: () => void
  isEditing: boolean
  saving: boolean
  formError: string | null
}

function AccountForm({ form, setField, onSave, onCancel, isEditing, saving, formError }: AccountFormProps) {
  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <input
          placeholder="Nome (ex: Fundo de Emergência)"
          value={form.name}
          onChange={(e) => {
            setField('name', e.target.value)
          }}
        />
        <input
          placeholder="Banco (ex: Neon)"
          value={form.bank}
          onChange={(e) => {
            setField('bank', e.target.value)
          }}
        />
        <input
          placeholder="Emoji (ex: 🐷)"
          value={form.emoji}
          onChange={(e) => {
            setField('emoji', e.target.value)
          }}
        />
        <CurrencyInput
          value={form.balance}
          onChange={(v) => {
            setField('balance', v)
          }}
          placeholder="Saldo atual (R$)"
        />
        <CurrencyInput
          value={form.goal}
          onChange={(v) => {
            setField('goal', v)
          }}
          placeholder="Meta (R$)"
        />

        {/* Active toggle */}
        <div className="flex items-center">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
              onClick={() => {
                setField('active', !form.active)
              }}
              className="w-10 h-6 rounded-full relative transition-colors"
              style={{
                background: form.active ? 'var(--color-green)' : 'var(--color-border)',
                cursor: 'pointer',
              }}
            >
              <div
                className="w-4 h-4 rounded-full bg-white absolute top-1 transition-transform"
                style={{ left: form.active ? 22 : 4 }}
              />
            </div>
            <span className="text-sm" style={{ color: form.active ? 'var(--color-green)' : 'var(--color-muted)' }}>
              {form.active ? 'Ativa' : 'Inativa'}
            </span>
          </label>
        </div>
      </div>

      {formError !== null && (
        <p className="text-xs mt-3 px-3 py-2 rounded-lg"
          style={{ color: 'var(--color-red)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          ⚠ {formError}
        </p>
      )}

      <div className="flex gap-3 justify-end mt-4">
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button
          onClick={() => {
            void onSave()
          }}
          disabled={saving}
        >
          {saving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Adicionar'}
        </Button>
      </div>
    </div>
  )
}
