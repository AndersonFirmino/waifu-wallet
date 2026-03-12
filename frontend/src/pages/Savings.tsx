import { useState } from 'react'
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
  balance: string
  goal: string
  emoji: string
  active: boolean
}

const EMPTY_FORM: AccountFormState = {
  name: '',
  bank: '',
  balance: '',
  goal: '',
  emoji: '🐷',
  active: true,
}

function accountToForm(account: SavingsAccount): AccountFormState {
  return {
    name: account.name,
    bank: account.bank,
    balance: String(account.balance),
    goal: String(account.goal),
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
  }

  function setField<K extends keyof AccountFormState>(key: K, value: AccountFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const handleSave = async () => {
    const balance = parseFloat(form.balance.replace(',', '.'))
    const goal = parseFloat(form.goal.replace(',', '.') || '0')

    if (!form.name || !form.bank || isNaN(balance) || balance < 0) return

    const body = {
      name: form.name,
      bank: form.bank,
      balance,
      goal: isNaN(goal) ? 0 : goal,
      emoji: form.emoji || '🐷',
      active: form.active,
    }

    if (editingId !== null) {
      const r = await fetch(`/api/v1/savings/${String(editingId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!r.ok) return
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
      if (!r.ok) return
      const raw: unknown = await r.json()
      const created = decodeSavingsAccount(raw)
      setAdditions((prev) => [...prev, created])
    }

    closeForm()
  }

  const handleDelete = async (id: number) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id)
      return
    }
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
                  <button
                    onClick={() => {
                      void handleDelete(account.id)
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background:
                        confirmDeleteId === account.id ? 'var(--color-red)' : 'rgba(239,68,68,0.1)',
                      color: confirmDeleteId === account.id ? '#fff' : 'var(--color-red)',
                      border: `1px solid ${confirmDeleteId === account.id ? 'var(--color-red)' : 'rgba(239,68,68,0.3)'}`,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {confirmDeleteId === account.id ? 'Confirmar?' : 'Excluir'}
                  </button>
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
}

function AccountForm({ form, setField, onSave, onCancel, isEditing }: AccountFormProps) {
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
        <input
          placeholder="Saldo atual (R$)"
          value={form.balance}
          onChange={(e) => {
            setField('balance', e.target.value)
          }}
        />
        <input
          placeholder="Meta (R$) — 0 para sem meta"
          value={form.goal}
          onChange={(e) => {
            setField('goal', e.target.value)
          }}
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
