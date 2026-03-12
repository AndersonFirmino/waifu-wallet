import { useState } from 'react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import { formatCurrency } from '../utils/currency'
import { formatMonth, getDaysInMonth, getFirstDayOfMonth } from '../utils/date'
import { type CalendarEvent, type CalendarEventType } from '../types'

// ─── Fake Data ────────────────────────────────────────────────────────────────

const FAKE_EVENTS: CalendarEvent[] = [
  { dia: 5, tipo: 'receita', desc: 'Salário', valor: 6500 },
  { dia: 5, tipo: 'despesa', desc: 'Aluguel', valor: 1500 },
  { dia: 5, tipo: 'despesa', desc: 'Condomínio', valor: 320 },
  { dia: 7, tipo: 'despesa', desc: 'Conta de Luz', valor: 145 },
  { dia: 7, tipo: 'despesa', desc: 'Internet', valor: 120 },
  { dia: 7, tipo: 'despesa', desc: 'Plano de Saúde', valor: 280 },
  { dia: 10, tipo: 'parcela', desc: 'Nubank Fatura', valor: 1240 },
  { dia: 11, tipo: 'receita', desc: 'Freelance', valor: 1000 },
  { dia: 15, tipo: 'despesa', desc: 'Condomínio Extra', valor: 80 },
  { dia: 17, tipo: 'parcela', desc: 'Itaú Fatura', valor: 1843 },
  { dia: 20, tipo: 'parcela', desc: 'Empréstimo Itaú', valor: 850 },
  { dia: 22, tipo: 'despesa', desc: 'Nubank Vencimento', valor: 1240 },
  { dia: 25, tipo: 'parcela', desc: 'Notebook Parcela', valor: 300 },
]

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const EVENT_COLORS: Record<CalendarEventType, string> = {
  receita: 'var(--color-green)',
  despesa: 'var(--color-red)',
  parcela: 'var(--color-orange)',
}

const EVENT_LABELS: Record<CalendarEventType, string> = {
  receita: 'Receita',
  despesa: 'Despesa',
  parcela: 'Parcela',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Calendar() {
  const [month, setMonth] = useState(2)
  const [year, setYear] = useState(2026)
  const [selectedDay, setSelectedDay] = useState<number | null>(11)

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const today = 11

  const eventsByDay = new Map<number, CalendarEvent[]>()
  for (const event of FAKE_EVENTS) {
    const current = eventsByDay.get(event.dia) ?? []
    eventsByDay.set(event.dia, [...current, event])
  }

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1) }
    else setMonth((m) => m - 1)
  }

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1) }
    else setMonth((m) => m + 1)
  }

  const selectedEvents = selectedDay !== null ? (eventsByDay.get(selectedDay) ?? []) : []

  const upcomingEvents = FAKE_EVENTS
    .filter((e) => e.dia >= today)
    .sort((a, b) => a.dia - b.dia)
    .slice(0, 8)

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
            Calendário Financeiro
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            Visualize vencimentos e recebimentos por dia
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-muted)', cursor: 'pointer' }}
          >←</button>
          <span className="font-semibold text-sm" style={{ color: 'var(--color-text)', minWidth: 160, textAlign: 'center' }}>
            {formatMonth(year, month)}
          </span>
          <button
            onClick={nextMonth}
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-muted)', cursor: 'pointer' }}
          >→</button>
        </div>
      </div>

      <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 280px' }}>
        {/* Calendar Grid */}
        <Card style={{ padding: 20 }}>
          {/* Day labels */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS_OF_WEEK.map((d) => (
              <div key={d} className="text-center text-xs font-semibold py-2" style={{ color: 'var(--color-muted)' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for first week offset */}
            {Array.from({ length: firstDay }, (_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1
              const events = eventsByDay.get(day) ?? []
              const isToday = day === today
              const isSelected = day === selectedDay
              const hasEvents = events.length > 0

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                  className="rounded-xl flex flex-col items-center cursor-pointer transition-all"
                  style={{
                    padding: '8px 4px',
                    background: isSelected
                      ? 'var(--color-blue)'
                      : isToday
                        ? 'rgba(59,130,246,0.12)'
                        : hasEvents
                          ? 'rgba(255,255,255,0.02)'
                          : 'transparent',
                    border: isToday && !isSelected ? '1px solid rgba(59,130,246,0.4)' : '1px solid transparent',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = isToday
                        ? 'rgba(59,130,246,0.12)'
                        : hasEvents ? 'rgba(255,255,255,0.02)' : 'transparent'
                    }
                  }}
                >
                  <span
                    className="text-sm font-medium mb-1.5"
                    style={{
                      color: isSelected ? '#fff' : isToday ? 'var(--color-blue)' : 'var(--color-text)',
                    }}
                  >
                    {day}
                  </span>
                  {/* Event dots */}
                  <div className="flex gap-0.5 flex-wrap justify-center" style={{ minHeight: 8 }}>
                    {events.slice(0, 3).map((ev, i) => (
                      <div
                        key={i}
                        className="rounded-full"
                        style={{
                          width: 6,
                          height: 6,
                          backgroundColor: isSelected ? 'rgba(255,255,255,0.8)' : EVENT_COLORS[ev.tipo],
                        }}
                      />
                    ))}
                    {events.length > 3 && (
                      <span style={{ fontSize: 8, color: isSelected ? '#fff' : 'var(--color-muted)' }}>+</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5 mt-4 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
            {(['receita', 'despesa', 'parcela'] as CalendarEventType[]).map((t) => (
              <div key={t} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: EVENT_COLORS[t] }} />
                <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{EVENT_LABELS[t]}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Side Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Selected Day Events */}
          {selectedDay !== null && (
            <Card>
              <h4 className="font-semibold text-sm mb-3" style={{ color: 'var(--color-text)' }}>
                Dia {selectedDay} de Março
              </h4>
              {selectedEvents.length === 0 ? (
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Sem eventos neste dia</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedEvents.map((ev, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: EVENT_COLORS[ev.tipo] }}
                        />
                        <span className="text-sm" style={{ color: 'var(--color-text)' }}>{ev.desc}</span>
                      </div>
                      <span
                        className="text-xs font-bold"
                        style={{ color: ev.tipo === 'receita' ? 'var(--color-green)' : 'var(--color-red)' }}
                      >
                        {ev.tipo === 'receita' ? '+' : '−'}{formatCurrency(ev.valor)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Upcoming */}
          <Card style={{ flex: 1 }}>
            <h4 className="font-semibold text-sm mb-3" style={{ color: 'var(--color-text)' }}>
              Próximos eventos
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {upcomingEvents.map((ev, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 rounded-lg"
                  style={{ background: 'var(--color-surface2)' }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-bold w-6 text-center rounded"
                      style={{
                        color: ev.dia === today ? 'var(--color-blue)' : 'var(--color-muted)',
                        background: ev.dia === today ? 'rgba(59,130,246,0.15)' : 'transparent',
                        padding: '1px 4px',
                      }}
                    >
                      {ev.dia}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--color-text)' }}>{ev.desc}</span>
                  </div>
                  <Badge color={ev.tipo === 'receita' ? 'green' : ev.tipo === 'parcela' ? 'orange' : 'red'} size="xs">
                    {ev.tipo === 'receita' ? '+' : '−'}{formatCurrency(ev.valor)}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
