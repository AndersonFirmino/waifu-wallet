import { useState } from 'react'
import Card from '../components/ui/Card'
import StatCard from '../components/ui/StatCard'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import ProgressBar from '../components/ui/ProgressBar'
import { formatCurrency } from '../utils/currency'
import { type CreditCard, type CardStatus, type CardBrand } from '../types'
import { useFetch } from '../hooks/useApi'
import { decodeCreditCard, decodeCreditCardList } from '../lib/decode'

// ─── Constants ────────────────────────────────────────────────────────────────

const CARD_BRANDS: CardBrand[] = ['Mastercard', 'Visa', 'Elo', 'Amex']
const CARD_STATUSES: CardStatus[] = ['open', 'closed', 'paid', 'pending']

function parseCardBrand(val: string): CardBrand {
  const found = CARD_BRANDS.find((b) => b === val)
  if (found === undefined) throw new Error(`Invalid CardBrand: ${val}`)
  return found
}

function parseCardStatus(val: string): CardStatus {
  const found = CARD_STATUSES.find((s) => s === val)
  if (found === undefined) throw new Error(`Invalid CardStatus: ${val}`)
  return found
}

const STATUS_LABELS: Record<CardStatus, string> = {
  open: 'Aberta',
  closed: 'Fechada',
  paid: 'Paga',
  pending: 'Pendente',
}

// ─── Form state ───────────────────────────────────────────────────────────────

interface CardFormState {
  name: string
  brand: CardBrand
  last_four: string
  limit: string
  used: string
  gradient_from: string
  gradient_to: string
  bill: string
  closing_day: string
  due_day: string
  status: CardStatus
}

const EMPTY_FORM: CardFormState = {
  name: '',
  brand: 'Visa',
  last_four: '',
  limit: '',
  used: '',
  gradient_from: '#3b82f6',
  gradient_to: '#60a5fa',
  bill: '',
  closing_day: '',
  due_day: '',
  status: 'open',
}

function cardToForm(card: CreditCard): CardFormState {
  return {
    name: card.name,
    brand: card.brand,
    last_four: card.last_four,
    limit: String(card.limit),
    used: String(card.used),
    gradient_from: card.gradient_from,
    gradient_to: card.gradient_to,
    bill: String(card.bill),
    closing_day: String(card.closing_day),
    due_day: String(card.due_day),
    status: card.status,
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface CreditCardVisualProps {
  card: CreditCard
  selected: boolean
  onSelect: () => void
}

function CreditCardVisual({ card, selected, onSelect }: CreditCardVisualProps) {
  const usedPct = Math.round((card.used / card.limit) * 100)

  return (
    <div onClick={onSelect} style={{ cursor: 'pointer' }}>
      {/* Card Visual */}
      <div
        className="rounded-2xl p-5 mb-3 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${card.gradient_from}, ${card.gradient_to})`,
          outline: selected ? '2px solid rgba(255,255,255,0.5)' : '2px solid transparent',
          transition: 'outline 0.15s, transform 0.15s',
          transform: selected ? 'scale(1.02)' : 'scale(1)',
          boxShadow: selected ? `0 8px 32px ${card.gradient_from}55` : 'none',
        }}
      >
        {/* Pattern overlay */}
        <div
          style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 160,
            height: 160,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.07)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -50,
            left: 20,
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
          }}
        />

        <div className="relative">
          <div className="flex justify-between items-start mb-6">
            <p className="text-xl font-bold text-white">💵 {card.name}</p>
            <span className="text-white font-bold text-sm opacity-90">{card.brand}</span>
          </div>
          <p className="text-white font-mono tracking-widest text-base mb-5 opacity-85">
            **** **** **** {card.last_four}
          </p>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs text-white opacity-60 mb-1">Limite disponível</p>
              <p className="text-white font-bold">{formatCurrency(card.limit - card.used)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-white opacity-60 mb-1">Limite total</p>
              <p className="text-white font-semibold">{formatCurrency(card.limit)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Limit Bar */}
      <div className="px-1">
        <div className="flex justify-between text-xs mb-1">
          <span style={{ color: 'var(--color-muted)' }}>Uso do limite</span>
          <span style={{ color: usedPct > 70 ? 'var(--color-red)' : 'var(--color-green)' }}>
            {formatCurrency(card.used)} ({usedPct}%)
          </span>
        </div>
        <ProgressBar value={card.used} max={card.limit} color="auto" showPercent={false} height={6} />
      </div>
    </div>
  )
}

function statusBadge(status: CardStatus) {
  if (status === 'paid')
    return (
      <Badge color="green" size="xs">
        Paga ✓
      </Badge>
    )
  if (status === 'closed')
    return (
      <Badge color="yellow" size="xs">
        Fechada
      </Badge>
    )
  if (status === 'pending')
    return (
      <Badge color="orange" size="xs">
        Pendente
      </Badge>
    )
  return (
    <Badge color="blue" size="xs">
      Aberta
    </Badge>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CreditCards() {
  const { data: serverData } = useFetch('/credit-cards/', decodeCreditCardList)
  const [additions, setAdditions] = useState<CreditCard[]>([])
  const [deletedIds, setDeletedIds] = useState<number[]>([])
  const [editedCards, setEditedCards] = useState<Map<number, CreditCard>>(new Map())
  const [selectedId, setSelectedId] = useState<number | null>(null)

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<CardFormState>(EMPTY_FORM)

  // Delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  const cardList = [
    ...additions.map((c) => editedCards.get(c.id) ?? c),
    ...(serverData ?? [])
      .filter((c) => !deletedIds.includes(c.id) && !additions.some((a) => a.id === c.id))
      .map((c) => editedCards.get(c.id) ?? c),
  ]

  const effectiveId = selectedId ?? cardList[0]?.id ?? null
  const selected = cardList.find((c) => c.id === effectiveId) ?? cardList[0]

  const totalLimit = cardList.reduce((s, c) => s + c.limit, 0)
  const totalUsed = cardList.reduce((s, c) => s + c.used, 0)
  const totalAvailable = totalLimit - totalUsed
  const usedPct = totalLimit > 0 ? Math.round((totalUsed / totalLimit) * 100) : 0
  const totalBills = cardList.reduce((s, c) => s + c.bill, 0)

  function openAddForm() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEditForm(card: CreditCard) {
    setEditingId(card.id)
    setForm(cardToForm(card))
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  function setField<K extends keyof CardFormState>(key: K, value: CardFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const handleSave = async () => {
    const limit = parseFloat(form.limit)
    const used = parseFloat(form.used)
    const bill = parseFloat(form.bill)
    const closing_day = parseInt(form.closing_day, 10)
    const due_day = parseInt(form.due_day, 10)

    if (
      !form.name ||
      !form.last_four ||
      isNaN(limit) ||
      isNaN(used) ||
      isNaN(bill) ||
      isNaN(closing_day) ||
      isNaN(due_day)
    )
      return

    const body = {
      name: form.name,
      brand: form.brand,
      last_four: form.last_four,
      limit,
      used,
      gradient_from: form.gradient_from,
      gradient_to: form.gradient_to,
      bill,
      closing_day,
      due_day,
      status: form.status,
    }

    if (editingId !== null) {
      const r = await fetch(`/api/v1/credit-cards/${String(editingId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!r.ok) return
      const raw: unknown = await r.json()
      const updated = decodeCreditCard(raw)
      setEditedCards((prev) => {
        const next = new Map(prev)
        next.set(updated.id, updated)
        return next
      })
    } else {
      const r = await fetch('/api/v1/credit-cards/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!r.ok) return
      const raw: unknown = await r.json()
      const created = decodeCreditCard(raw)
      setAdditions((prev) => [...prev, created])
    }

    closeForm()
  }

  const handleDelete = async (id: number) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id)
      return
    }
    await fetch(`/api/v1/credit-cards/${String(id)}`, { method: 'DELETE' })
    setAdditions((prev) => prev.filter((c) => c.id !== id))
    setDeletedIds((prev) => [...prev, id])
    setConfirmDeleteId(null)
    if (selectedId === id) setSelectedId(null)
  }

  if (cardList.length === 0 && !showForm) {
    return (
      <div style={{ padding: '28px 32px' }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
              Cartões de Crédito
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
              Nenhum cartão cadastrado
            </p>
          </div>
          <Button onClick={openAddForm}>+ Adicionar Cartão</Button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200 }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
          Cartões de Crédito
        </h1>
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
          {showForm ? 'Cancelar' : '+ Adicionar Cartão'}
        </Button>
      </div>
      <p className="mb-6 text-sm" style={{ color: 'var(--color-muted)' }}>
        {cardList.length} cartão{cardList.length !== 1 ? 'ões' : ''} cadastrado
        {cardList.length !== 1 ? 's' : ''}
      </p>

      {/* Add / Edit Form */}
      {showForm && (
        <Card className="mb-6">
          <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--color-text)' }}>
            {editingId !== null ? 'Editar Cartão' : 'Novo Cartão'}
          </h3>
          <CardForm
            form={form}
            setField={setField}
            onSave={handleSave}
            onCancel={closeForm}
            isEditing={editingId !== null}
          />
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard icon="💳" label="Limite Total" value={formatCurrency(totalLimit)} color="blue" />
        <StatCard
          icon="🔥"
          label="Total Usado"
          value={formatCurrency(totalUsed)}
          sub={`${String(usedPct)}% do limite`}
          color="red"
        />
        <StatCard
          icon="✅"
          label="Disponível"
          value={formatCurrency(totalAvailable)}
          sub={`${String(100 - usedPct)}% livre`}
          color={totalAvailable > 0 ? 'green' : 'red'}
        />
        <StatCard
          icon="📄"
          label="Faturas Pendentes"
          value={formatCurrency(totalBills)}
          sub="a pagar este mês"
          color="orange"
        />
      </div>

      <div className="grid gap-6" style={{ gridTemplateColumns: '320px 1fr' }}>
        {/* Left: Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {cardList.map((card) => (
            <CreditCardVisual
              key={card.id}
              card={card}
              selected={effectiveId === card.id}
              onSelect={() => {
                setSelectedId(card.id)
              }}
            />
          ))}
        </div>

        {/* Right: Detail */}
        {selected !== undefined && (
          <div>
            {/* Bill Info */}
            <Card className="mb-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--color-text)' }}>
                    {selected.name}
                  </h3>
                  <div className="flex items-center gap-3">
                    {statusBadge(selected.status)}
                    <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                      Fecha dia {selected.closing_day} · Vence dia {selected.due_day}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right mr-2">
                    <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>
                      Fatura atual
                    </p>
                    <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                      {formatCurrency(selected.bill)}
                    </p>
                  </div>
                  {/* Edit button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      openEditForm(selected)
                    }}
                  >
                    Editar
                  </Button>
                  {/* Delete button with confirmation */}
                  <button
                    onClick={() => {
                      void handleDelete(selected.id)
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background:
                        confirmDeleteId === selected.id ? 'var(--color-red)' : 'rgba(239,68,68,0.1)',
                      color: confirmDeleteId === selected.id ? '#fff' : 'var(--color-red)',
                      border: `1px solid ${confirmDeleteId === selected.id ? 'var(--color-red)' : 'rgba(239,68,68,0.3)'}`,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {confirmDeleteId === selected.id ? 'Confirmar?' : 'Excluir'}
                  </button>
                </div>
              </div>

              {/* Bill Items */}
              <div>
                <p className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
                  Lançamentos recentes
                </p>
                {selected.items.length === 0 ? (
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                    Nenhum lançamento
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {selected.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center px-2 py-2.5 rounded-lg"
                        style={{ transition: 'background 0.12s' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div className="flex items-center gap-2">
                          <span style={{ color: 'var(--color-muted)', fontSize: 12 }}>{item.date}</span>
                          <span className="text-sm" style={{ color: 'var(--color-text)' }}>
                            {item.description}
                          </span>
                        </div>
                        <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                          {formatCurrency(item.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* History */}
            <Card>
              <p className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
                Histórico de Faturas
              </p>
              {selected.history.length === 0 ? (
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                  Sem histórico
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[...selected.history].reverse().map((h) => (
                    <div
                      key={h.id}
                      className="flex items-center justify-between p-3 rounded-xl"
                      style={{ background: 'var(--color-surface2)' }}
                    >
                      <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                        {h.month}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="font-bold" style={{ color: 'var(--color-text)' }}>
                          {formatCurrency(h.amount)}
                        </span>
                        {statusBadge(h.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── CardForm ─────────────────────────────────────────────────────────────────

interface CardFormProps {
  form: CardFormState
  setField: <K extends keyof CardFormState>(key: K, value: CardFormState[K]) => void
  onSave: () => Promise<void>
  onCancel: () => void
  isEditing: boolean
}

function CardForm({ form, setField, onSave, onCancel, isEditing }: CardFormProps) {
  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <input
          placeholder="Nome do cartão"
          value={form.name}
          onChange={(e) => {
            setField('name', e.target.value)
          }}
        />
        <select
          value={form.brand}
          onChange={(e) => {
            setField('brand', parseCardBrand(e.target.value))
          }}
        >
          {CARD_BRANDS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <input
          placeholder="Últimos 4 dígitos"
          value={form.last_four}
          maxLength={4}
          onChange={(e) => {
            setField('last_four', e.target.value)
          }}
        />
        <input
          placeholder="Limite (R$)"
          value={form.limit}
          onChange={(e) => {
            setField('limit', e.target.value)
          }}
        />
        <input
          placeholder="Valor usado (R$)"
          value={form.used}
          onChange={(e) => {
            setField('used', e.target.value)
          }}
        />
        <input
          placeholder="Fatura atual (R$)"
          value={form.bill}
          onChange={(e) => {
            setField('bill', e.target.value)
          }}
        />
        <input
          placeholder="Dia fechamento (1-31)"
          value={form.closing_day}
          onChange={(e) => {
            setField('closing_day', e.target.value)
          }}
        />
        <input
          placeholder="Dia vencimento (1-31)"
          value={form.due_day}
          onChange={(e) => {
            setField('due_day', e.target.value)
          }}
        />
        <select
          value={form.status}
          onChange={(e) => {
            setField('status', parseCardStatus(e.target.value))
          }}
        >
          {CARD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {/* Gradient colors */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-xs" style={{ color: 'var(--color-muted)' }}>
            Cor inicial:
          </label>
          <input
            type="color"
            value={form.gradient_from}
            onChange={(e) => {
              setField('gradient_from', e.target.value)
            }}
            style={{ width: 40, height: 32, padding: 2, borderRadius: 6, border: '1px solid var(--color-border)', cursor: 'pointer' }}
          />
          <input
            value={form.gradient_from}
            onChange={(e) => {
              setField('gradient_from', e.target.value)
            }}
            style={{ width: 100 }}
            placeholder="#3b82f6"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs" style={{ color: 'var(--color-muted)' }}>
            Cor final:
          </label>
          <input
            type="color"
            value={form.gradient_to}
            onChange={(e) => {
              setField('gradient_to', e.target.value)
            }}
            style={{ width: 40, height: 32, padding: 2, borderRadius: 6, border: '1px solid var(--color-border)', cursor: 'pointer' }}
          />
          <input
            value={form.gradient_to}
            onChange={(e) => {
              setField('gradient_to', e.target.value)
            }}
            style={{ width: 100 }}
            placeholder="#60a5fa"
          />
        </div>
        {/* Preview */}
        <div
          className="rounded-xl flex-1 h-8 ml-2"
          style={{ background: `linear-gradient(135deg, ${form.gradient_from}, ${form.gradient_to})`, minWidth: 80 }}
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
