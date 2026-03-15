import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Card from '../components/ui/Card'
import CurrencyInput from '../components/ui/CurrencyInput'
import StatCard from '../components/ui/StatCard'
import AnimatedNumber from '../components/ui/AnimatedNumber'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import ProgressBar from '../components/ui/ProgressBar'
import { formatCurrency } from '../utils/currency'
import { type CreditCard, type CardStatus, type CardBrand, type SubscriptionCurrency } from '../types'
import { useLocale } from '../hooks/useLocale'

const SUBSCRIPTION_CURRENCIES: SubscriptionCurrency[] = ['BRL', 'USD']

function parseSubscriptionCurrency(val: string): SubscriptionCurrency {
  const found = SUBSCRIPTION_CURRENCIES.find((c) => c === val)
  if (found === undefined) throw new Error(`Invalid SubscriptionCurrency: ${val}`)
  return found
}
import { useFetch } from '../hooks/useApi'
import { decodeCreditCardList } from '../lib/decode'

// ─── Constants ────────────────────────────────────────────────────────────────

const CARD_BRANDS: CardBrand[] = ['Mastercard', 'Visa', 'Elo', 'Amex']
const CARD_STATUSES: CardStatus[] = ['open', 'closed', 'paid', 'pending', 'blocked']

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

// ─── Form state ───────────────────────────────────────────────────────────────

interface CardFormState {
  name: string
  brand: CardBrand
  last_four: string
  limit: number
  used: number
  gradient_from: string
  gradient_to: string
  bill: number
  closing_day: string
  due_day: string
  status: CardStatus
}

const EMPTY_FORM: CardFormState = {
  name: '',
  brand: 'Visa',
  last_four: '',
  limit: 0,
  used: 0,
  gradient_from: '#3b82f6',
  gradient_to: '#60a5fa',
  bill: 0,
  closing_day: '',
  due_day: '',
  status: 'open',
}

function cardToForm(card: CreditCard): CardFormState {
  return {
    name: card.name,
    brand: card.brand,
    last_four: card.last_four,
    limit: card.limit,
    used: card.used,
    gradient_from: card.gradient_from,
    gradient_to: card.gradient_to,
    bill: card.bill,
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
  const { t } = useTranslation()
  const { currency, language } = useLocale()
  const usedPct = Math.round((card.used / card.limit) * 100)
  const isBlocked = card.status === 'blocked'

  return (
    <div onClick={onSelect} style={{ cursor: 'pointer' }}>
      {/* Card Visual */}
      <div
        className="rounded-2xl p-5 mb-3 relative overflow-hidden"
        style={{
          background: isBlocked
            ? 'linear-gradient(135deg, #374151, #1f2937)'
            : `linear-gradient(135deg, ${card.gradient_from}, ${card.gradient_to})`,
          outline: selected ? '2px solid rgba(255,255,255,0.5)' : '2px solid transparent',
          transition: 'outline 0.15s, transform 0.15s, background 0.5s, filter 0.5s',
          transform: selected ? 'scale(1.02)' : 'scale(1)',
          boxShadow: selected && !isBlocked ? `0 8px 32px ${card.gradient_from}55` : 'none',
          filter: isBlocked ? 'saturate(0.3)' : 'none',
          opacity: isBlocked ? 0.75 : 1,
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
            <p className="text-xl font-bold text-white">{isBlocked ? '🔒' : '💵'} {card.name}</p>
            <span className="text-white font-bold text-sm opacity-90">{card.brand}</span>
          </div>
          <p className="text-white font-mono tracking-widest text-base mb-5 opacity-85">
            **** **** **** {card.last_four}
          </p>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs text-white opacity-60 mb-1">{t('credit_cards.limit_available')}</p>
              <p className="text-white font-bold"><AnimatedNumber value={card.limit - card.used} formatter={(v) => formatCurrency(v, currency, language)} /></p>
            </div>
            <div className="text-right">
              <p className="text-xs text-white opacity-60 mb-1">{t('credit_cards.limit')}</p>
              <p className="text-white font-semibold"><AnimatedNumber value={card.limit} formatter={(v) => formatCurrency(v, currency, language)} /></p>
            </div>
          </div>
        </div>
      </div>

      {/* Limit Bar */}
      <div className="px-1">
        <div className="flex justify-between text-xs mb-1">
          <span style={{ color: 'var(--color-muted)' }}>{t('credit_cards.limit_usage')}</span>
          <span style={{ color: usedPct > 70 ? 'var(--color-red)' : 'var(--color-green)' }}>
            <AnimatedNumber value={card.used} formatter={(v) => formatCurrency(v, currency, language)} /> ({usedPct}%)
          </span>
        </div>
        <ProgressBar value={card.used} max={card.limit} color="auto" showPercent={false} height={6} />
      </div>
    </div>
  )
}

function statusBadge(status: CardStatus, t: (key: string) => string) {
  if (status === 'paid')
    return (
      <Badge color="green" size="xs">
        {t('credit_cards.status_paid')}
      </Badge>
    )
  if (status === 'closed')
    return (
      <Badge color="yellow" size="xs">
        {t('credit_cards.status_closed')}
      </Badge>
    )
  if (status === 'pending')
    return (
      <Badge color="orange" size="xs">
        {t('credit_cards.status_pending')}
      </Badge>
    )
  if (status === 'blocked')
    return (
      <Badge color="red" size="xs">
        {t('credit_cards.status_blocked')}
      </Badge>
    )
  return (
    <Badge color="blue" size="xs">
      {t('credit_cards.status_open_plain')}
    </Badge>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CreditCards() {
  const { t } = useTranslation()
  const { currency, language } = useLocale()

  const STATUS_LABELS: Record<CardStatus, string> = {
    open: t('credit_cards.status_open'),
    closed: t('credit_cards.status_closed'),
    paid: t('credit_cards.status_paid'),
    pending: t('credit_cards.status_pending'),
    blocked: t('credit_cards.status_blocked'),
  }

  const { data: serverData } = useFetch('/credit-cards/', decodeCreditCardList)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<CardFormState>(EMPTY_FORM)

  // Delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  // Saving indicator
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Subscription form state
  const [showSubForm, setShowSubForm] = useState(false)
  const [subName, setSubName] = useState('')
  const [subAmount, setSubAmount] = useState<number>(0)
  const [subCurrency, setSubCurrency] = useState<SubscriptionCurrency>('BRL')
  const [usdRate, setUsdRate] = useState<number | null>(null)
  const [subBillingDay, setSubBillingDay] = useState('')

  // Inline bill editing
  const [editingBill, setEditingBill] = useState(false)
  const [billInput, setBillInput] = useState(0)

  useEffect(() => {
    fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL')
      .then(async (r) => {
        const text = await r.text()
        const match = (/"bid":"([\d.]+)"/).exec(text)
        if (match?.[1] !== undefined) {
          const bid = parseFloat(match[1])
          if (!isNaN(bid)) setUsdRate(bid)
        }
      })
      .catch(() => { /* exchange rate unavailable */ })
  }, [])

  const cardList = serverData ?? []

  const effectiveId = selectedId ?? cardList[0]?.id ?? null
  const selected = cardList.find((c) => c.id === effectiveId) ?? cardList[0]

  const totalLimit = cardList.reduce((s, c) => s + c.limit, 0)
  const totalUsed = cardList.reduce((s, c) => s + c.used, 0)
  const totalAvailable = totalLimit - totalUsed
  const usedPct = totalLimit > 0 ? Math.round((totalUsed / totalLimit) * 100) : 0
  const totalBills = cardList.reduce((s, c) => s + c.bill, 0)

  // Subscription aggregates
  const allActiveSubs = cardList.flatMap((c) => c.subscriptions.filter((s) => s.active))
  const totalSubsBRL = allActiveSubs.filter((s) => s.currency === 'BRL').reduce((sum, s) => sum + s.amount, 0)
  const totalSubsUSD = allActiveSubs.filter((s) => s.currency === 'USD').reduce((sum, s) => sum + s.amount, 0)
  const cardsWithSubs = cardList.filter((c) => c.subscriptions.some((s) => s.active))

  const currencyFormatter = (v: number) => formatCurrency(v, currency, language)

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

  function setField<K extends keyof CardFormState>(key: K, value: CardFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const handleSave = async () => {
    const closing_day = parseInt(form.closing_day, 10)
    const due_day = parseInt(form.due_day, 10)

    if (!form.name) { setFormError('Informe o nome do cartão.'); return }
    if (!form.last_four) { setFormError('Informe os últimos 4 dígitos.'); return }
    if (form.limit <= 0) { setFormError('O limite deve ser maior que zero.'); return }
    if (form.used < 0 || form.bill < 0) { setFormError('Valores negativos não são permitidos.'); return }
    if (isNaN(closing_day) || isNaN(due_day)) { setFormError('Informe dias de fechamento e vencimento válidos.'); return }

    setFormError(null)
    setSaving(true)
    try {
      const body = {
        name: form.name,
        brand: form.brand,
        last_four: form.last_four,
        limit: form.limit,
        used: form.used,
        gradient_from: form.gradient_from,
        gradient_to: form.gradient_to,
        bill: form.bill,
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
        if (!r.ok) { setFormError('Erro ao salvar. Tente novamente.'); return }
      } else {
        const r = await fetch('/api/v1/credit-cards/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!r.ok) { setFormError('Erro ao salvar. Tente novamente.'); return }
      }

      closeForm()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    await fetch(`/api/v1/credit-cards/${String(id)}`, { method: 'DELETE' })
    setConfirmDeleteId(null)
    if (selectedId === id) setSelectedId(null)
  }

  function resetSubForm() {
    setSubName('')
    setSubAmount(0)
    setSubCurrency('BRL')
    setSubBillingDay('')
    setShowSubForm(false)
  }

  const handleAddSubscription = async (cardId: number) => {
    const billingDay = parseInt(subBillingDay, 10)
    if (!subName || subAmount <= 0 || isNaN(billingDay) || billingDay < 1 || billingDay > 31) return

    const r = await fetch(`/api/v1/credit-cards/${String(cardId)}/subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: subName, amount: subAmount, currency: subCurrency, billing_day: billingDay, active: true }),
    })
    if (!r.ok) return
    resetSubForm()
  }

  const handleToggleSubscription = async (cardId: number, subId: number, currentActive: boolean) => {
    await fetch(`/api/v1/credit-cards/${String(cardId)}/subscriptions/${String(subId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !currentActive }),
    })
  }

  const handleDeleteSubscription = async (cardId: number, subId: number) => {
    await fetch(`/api/v1/credit-cards/${String(cardId)}/subscriptions/${String(subId)}`, {
      method: 'DELETE',
    })
  }

  const handleSaveBill = async (cardId: number) => {
    const card = cardList.find((c) => c.id === cardId)
    if (card === undefined) return
    await fetch(`/api/v1/credit-cards/${String(cardId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: card.name,
        brand: card.brand,
        last_four: card.last_four,
        limit: card.limit,
        used: card.used,
        gradient_from: card.gradient_from,
        gradient_to: card.gradient_to,
        bill: billInput,
        closing_day: card.closing_day,
        due_day: card.due_day,
        status: card.status,
      }),
    })
    setEditingBill(false)
  }

  if (cardList.length === 0 && !showForm) {
    return (
      <div style={{ padding: '28px 32px' }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
              {t('credit_cards.title')}
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
              {t('credit_cards.no_cards')}
            </p>
          </div>
          <Button onClick={openAddForm}>{t('credit_cards.add_card')}</Button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200 }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
          {t('credit_cards.title')}
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
          {showForm ? t('credit_cards.cancel_form') : t('credit_cards.add_card')}
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
            {editingId !== null ? t('credit_cards.edit_card') : t('credit_cards.new_card')}
          </h3>
          <CardForm
            form={form}
            setField={setField}
            onSave={handleSave}
            onCancel={closeForm}
            isEditing={editingId !== null}
            saving={saving}
            formError={formError}
            statusLabels={STATUS_LABELS}
          />
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <StatCard icon="💳" label={t('credit_cards.limit_total')} value={formatCurrency(totalLimit, currency, language)} numericValue={totalLimit} numericFormatter={currencyFormatter} color="blue" />
        <StatCard
          icon="🔥"
          label={t('credit_cards.total_used')}
          value={formatCurrency(totalUsed, currency, language)}
          numericValue={totalUsed}
          numericFormatter={currencyFormatter}
          sub={`${String(usedPct)}% do limite`}
          color="red"
        />
        <StatCard
          icon="✅"
          label={t('credit_cards.available')}
          value={formatCurrency(totalAvailable, currency, language)}
          numericValue={totalAvailable}
          numericFormatter={currencyFormatter}
          sub={`${String(100 - usedPct)}% livre`}
          color={totalAvailable > 0 ? 'green' : 'red'}
        />
        <StatCard
          icon="📄"
          label={t('credit_cards.pending_bills')}
          value={formatCurrency(totalBills, currency, language)}
          numericValue={totalBills}
          numericFormatter={currencyFormatter}
          sub="a pagar este mês"
          color="orange"
        />
        <StatCard
          icon="🔄"
          label={t('credit_cards.subscriptions_total')}
          value={formatCurrency(totalSubsBRL, currency, language)}
          numericValue={totalSubsBRL}
          numericFormatter={currencyFormatter}
          sub={totalSubsUSD > 0 ? `+ US$ ${totalSubsUSD.toFixed(2)}/mês` : `${String(allActiveSubs.length)} ativas`}
          color="purple"
        />
      </div>

      {/* Subscriptions per card overview */}
      {cardsWithSubs.length > 0 && (
        <Card className="mb-6">
          <p className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
            {t('credit_cards.subscriptions_per_card')}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {cardsWithSubs.map((card) => {
              const activeSubs = card.subscriptions.filter((s) => s.active)
              const brlTotal = activeSubs.filter((s) => s.currency === 'BRL').reduce((sum, s) => sum + s.amount, 0)
              const usdTotal = activeSubs.filter((s) => s.currency === 'USD').reduce((sum, s) => sum + s.amount, 0)

              return (
                <div
                  key={card.id}
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: 'var(--color-surface2)' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="rounded-lg"
                      style={{
                        width: 32,
                        height: 20,
                        background: `linear-gradient(135deg, ${card.gradient_from}, ${card.gradient_to})`,
                      }}
                    />
                    <div>
                      <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                        {card.name}
                      </span>
                      <span className="text-xs ml-2" style={{ color: 'var(--color-muted)' }}>
                        {activeSubs.length} assinatura{activeSubs.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      {brlTotal > 0 && (
                        <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                          {formatCurrency(brlTotal, currency, language)}
                        </span>
                      )}
                      {usdTotal > 0 && (
                        <span className="text-xs font-medium ml-2" style={{ color: 'var(--color-muted)' }}>
                          {brlTotal > 0 ? '+ ' : ''}US$ {usdTotal.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                        {activeSubs.map((s) => s.name).join(', ')}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Grand total row */}
            <div className="flex justify-between items-center px-3 pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
              <span className="text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>
                {cardsWithSubs.length === 1
                  ? t('credit_cards.total_tied', { count: cardsWithSubs.length })
                  : t('credit_cards.total_tied_plural', { count: cardsWithSubs.length })}
              </span>
              <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                {formatCurrency(totalSubsBRL, currency, language)}
                {totalSubsUSD > 0 && (
                  <span className="ml-1" style={{ color: 'var(--color-muted)' }}>
                    + US$ {totalSubsUSD.toFixed(2)}
                  </span>
                )}
              </span>
            </div>
          </div>
        </Card>
      )}

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
                    {statusBadge(selected.status, t)}
                    <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                      {t('credit_cards.closing_due', { closing: selected.closing_day, due: selected.due_day })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right mr-2">
                    <p className="text-xs mb-1" style={{ color: 'var(--color-muted)' }}>
                      {t('credit_cards.current_bill')}
                    </p>
                    {editingBill ? (
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <CurrencyInput
                          value={billInput}
                          onChange={(v) => { setBillInput(v) }}
                          placeholder="R$ 0,00"
                          style={{ width: 120, fontSize: 16, fontWeight: 700 }}
                        />
                        <button
                          onClick={() => { void handleSaveBill(selected.id) }}
                          style={{ background: 'var(--color-green)', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 12 }}
                        >
                          OK
                        </button>
                        <button
                          onClick={() => { setEditingBill(false) }}
                          style={{ background: 'var(--color-surface2)', color: 'var(--color-muted)', border: '1px solid var(--color-border)', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 12 }}
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <p
                        className="text-2xl font-bold"
                        style={{ color: 'var(--color-text)', cursor: 'pointer' }}
                        onClick={() => { setBillInput(selected.bill); setEditingBill(true) }}
                        title="Clique para editar a fatura"
                      >
                        <AnimatedNumber value={selected.bill} formatter={(v) => formatCurrency(v, currency, language)} />
                        <span style={{ fontSize: 10, color: 'var(--color-muted)', marginLeft: 4 }}>✏️</span>
                      </p>
                    )}
                  </div>
                  {/* Edit button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      openEditForm(selected)
                    }}
                  >
                    {t('credit_cards.edit')}
                  </Button>
                  {/* Delete button with confirmation */}
                  {confirmDeleteId === selected.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { void handleDelete(selected.id) }}
                        className="text-xs px-2 py-1 rounded-lg"
                        style={{ background: 'var(--color-red)', color: '#fff', border: 'none', cursor: 'pointer' }}
                      >
                        {t('credit_cards.confirm')}
                      </button>
                      <button
                        onClick={() => { setConfirmDeleteId(null) }}
                        className="text-xs px-2 py-1 rounded-lg"
                        style={{ background: 'transparent', color: 'var(--color-muted)', border: '1px solid var(--color-border)', cursor: 'pointer' }}
                      >
                        {t('credit_cards.cancel_btn')}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setConfirmDeleteId(selected.id) }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: 'rgba(239,68,68,0.1)',
                        color: 'var(--color-red)',
                        border: '1px solid rgba(239,68,68,0.3)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {t('credit_cards.delete')}
                    </button>
                  )}
                </div>
              </div>

              {/* Bill Items */}
              <div>
                <p className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
                  {t('credit_cards.recent_items')}
                </p>
                {selected.items.length === 0 ? (
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                    {t('credit_cards.no_items')}
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
                          {formatCurrency(item.amount, currency, language)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Subscriptions */}
            <Card className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
                  {t('credit_cards.subscriptions')}
                </p>
                <button
                  onClick={() => { setShowSubForm((v) => !v) }}
                  className="text-xs font-medium px-2 py-1 rounded-md transition-colors"
                  style={{
                    background: showSubForm ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)',
                    color: showSubForm ? 'var(--color-red)' : 'var(--color-blue)',
                    cursor: 'pointer',
                    border: 'none',
                  }}
                >
                  {showSubForm ? t('credit_cards.cancel_btn') : t('credit_cards.add_subscription')}
                </button>
              </div>

              {/* Add subscription inline form */}
              {showSubForm && (
                <div className="grid grid-cols-4 gap-2 mb-3">
                  <input
                    placeholder="Nome"
                    value={subName}
                    onChange={(e) => { setSubName(e.target.value) }}
                    className="col-span-1"
                  />
                  <CurrencyInput
                    value={subAmount}
                    onChange={(v) => { setSubAmount(v) }}
                    placeholder="R$ 0,00"
                  />
                  <div className="flex gap-1">
                    <select
                      value={subCurrency}
                      onChange={(e) => { setSubCurrency(parseSubscriptionCurrency(e.target.value)) }}
                      style={{ flex: '0 0 70px' }}
                    >
                      <option value="BRL">BRL</option>
                      <option value="USD">USD</option>
                    </select>
                    <input
                      placeholder="Dia"
                      value={subBillingDay}
                      onChange={(e) => { setSubBillingDay(e.target.value) }}
                      type="number"
                      min="1"
                      max="31"
                      style={{ flex: 1 }}
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={() => { void handleAddSubscription(selected.id) }}
                  >
                    {t('common.save')}
                  </Button>
                </div>
              )}

              {selected.subscriptions.length === 0 && !showSubForm ? (
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                  {t('credit_cards.no_subscriptions')}
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {selected.subscriptions.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex justify-between items-center px-2 py-2 rounded-lg"
                      style={{
                        transition: 'background 0.12s',
                        opacity: sub.active ? 1 : 0.5,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface2)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { void handleToggleSubscription(selected.id, sub.id, sub.active) }}
                          className="text-xs rounded-full px-1.5 py-0.5"
                          style={{
                            background: sub.active ? 'rgba(34,197,94,0.15)' : 'rgba(156,163,175,0.15)',
                            color: sub.active ? 'var(--color-green)' : 'var(--color-muted)',
                            cursor: 'pointer',
                            border: 'none',
                            lineHeight: 1,
                          }}
                          title={sub.active ? 'Ativa — clique para desativar' : 'Inativa — clique para ativar'}
                        >
                          {sub.active ? '●' : '○'}
                        </button>
                        <span className="text-sm" style={{ color: 'var(--color-text)' }}>{sub.name}</span>
                        <span className="text-xs" style={{ color: 'var(--color-muted)' }}>dia {sub.billing_day}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                          {sub.currency === 'USD'
                            ? <>
                                {formatCurrency(sub.amount, 'USD', 'en-US')}
                                {usdRate !== null && (
                                  <span className="text-xs ml-1" style={{ color: 'var(--color-muted)', fontWeight: 400 }}>
                                    (~{formatCurrency(sub.amount * usdRate, currency, language)})
                                  </span>
                                )}
                              </>
                            : formatCurrency(sub.amount, currency, language)
                          }
                        </span>
                        <button
                          onClick={() => { void handleDeleteSubscription(selected.id, sub.id) }}
                          className="text-xs opacity-40 hover:opacity-100 transition-opacity"
                          style={{ cursor: 'pointer', border: 'none', background: 'none', color: 'var(--color-red)' }}
                          title="Remover"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Total */}
                  {selected.subscriptions.filter((s) => s.active).length > 0 && (
                    <div className="flex justify-between items-center px-2 pt-2 mt-1" style={{ borderTop: '1px solid var(--color-border)' }}>
                      <span className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>
                        {t('credit_cards.monthly_total', { count: selected.subscriptions.filter((s) => s.active).length })}
                      </span>
                      <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                        <AnimatedNumber
                          value={
                            selected.subscriptions.filter((s) => s.active).reduce((sum, s) => {
                              if (s.currency === 'USD' && usdRate !== null) return sum + s.amount * usdRate
                              if (s.currency === 'BRL') return sum + s.amount
                              return sum
                            }, 0)
                          }
                          formatter={currencyFormatter}
                        />
                        {selected.subscriptions.some((s) => s.active && s.currency === 'USD') && usdRate !== null && (
                          <span className="text-xs ml-2" style={{ color: 'var(--color-muted)', fontWeight: 400 }}>
                            ({t('credit_cards.exchange_rate', { rate: usdRate.toFixed(2) })})
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* History */}
            <Card>
              <p className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
                {t('credit_cards.bill_history')}
              </p>
              {selected.history.length === 0 ? (
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                  {t('credit_cards.no_history')}
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
                          {formatCurrency(h.amount, currency, language)}
                        </span>
                        {statusBadge(h.status, t)}
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
  saving: boolean
  formError: string | null
  statusLabels: Record<CardStatus, string>
}

function CardForm({ form, setField, onSave, onCancel, isEditing, saving, formError, statusLabels }: CardFormProps) {
  const { t } = useTranslation()

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
        <CurrencyInput
          value={form.limit}
          onChange={(v) => {
            setField('limit', v)
          }}
          placeholder="Limite (R$)"
        />
        <CurrencyInput
          value={form.used}
          onChange={(v) => {
            setField('used', v)
          }}
          placeholder="Valor usado (R$)"
        />
        <CurrencyInput
          value={form.bill}
          onChange={(v) => {
            setField('bill', v)
          }}
          placeholder="Fatura atual (R$)"
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
              {statusLabels[s]}
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

      {formError !== null && (
        <p className="text-xs mt-3 px-3 py-2 rounded-lg"
          style={{ color: 'var(--color-red)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          ⚠ {formError}
        </p>
      )}

      <div className="flex gap-3 justify-end mt-4">
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          {t('credit_cards.cancel_btn')}
        </Button>
        <Button
          onClick={() => {
            void onSave()
          }}
          disabled={saving}
        >
          {saving ? t('credit_cards.saving') : isEditing ? t('credit_cards.save_changes') : t('common.add')}
        </Button>
      </div>
    </div>
  )
}
