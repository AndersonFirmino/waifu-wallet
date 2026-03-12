import { useState, useRef } from 'react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { formatMonth } from '../utils/date'
import { type Note } from '../types'

// ─── Fake Data ────────────────────────────────────────────────────────────────

const FAKE_NOTES: Note[] = [
  {
    id: 1,
    data: '2026-03-01',
    conteudo: 'Início do mês. Meta: economizar pelo menos R$ 2.000 esse mês para a reserva de emergência. Salário cai dia 5, já vou separar antes de gastar com bobagem.',
  },
  {
    id: 2,
    data: '2026-03-05',
    conteudo: 'Salário caiu! R$ 6.500 na conta. Paguei o aluguel e o condomínio na hora (R$ 1.820). Restando R$ 4.680 disponível pro mês. Vou tentar segurar em R$ 3.500 de gastos.',
  },
  {
    id: 3,
    data: '2026-03-08',
    conteudo: 'Fiz as compras do mês — gastei R$ 280 no Mercado. Menos que o mês passado (R$ 340). Tá melhorando. Aproveitei e renovei a farmácia por R$ 85.',
  },
  {
    id: 4,
    data: '2026-03-11',
    conteudo: 'Freelance caiu: R$ 1.000. Vai direto pra reserva de emergência. Também registrei os gastos de transporte da semana (uber + gasolina = R$ 155). Mês tá indo bem.',
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>(FAKE_NOTES)
  const [month, setMonth] = useState(2)
  const [year, setYear] = useState(2026)
  const [content, setContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1) }
    else setMonth((m) => m - 1)
  }

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1) }
    else setMonth((m) => m + 1)
  }

  const handleSave = () => {
    if (!content.trim()) return
    const now = new Date(2026, 2, 11)
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const note: Note = {
      id: Date.now(),
      data: dateStr,
      conteudo: content.trim(),
    }
    setNotes((prev) => [note, ...prev])
    setContent('')
    textareaRef.current?.focus()
  }

  const handleDelete = (id: number) => {
    setNotes((prev) => prev.filter((n) => n.id !== id))
  }

  const filteredNotes = notes.filter((n) => {
    const parts = n.data.split('-')
    const noteYear = parseInt(parts[0] ?? '0', 10)
    const noteMonth = parseInt(parts[1] ?? '0', 10) - 1
    return noteYear === year && noteMonth === month
  })

  return (
    <div style={{ padding: '28px 32px', maxWidth: 800 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
            📝 Notas Financeiras
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            Registre pensamentos e observações sobre suas finanças
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-muted)', cursor: 'pointer' }}
          >←</button>
          <span className="font-semibold text-sm" style={{ color: 'var(--color-text)', minWidth: 150, textAlign: 'center' }}>
            {formatMonth(year, month)}
          </span>
          <button
            onClick={nextMonth}
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-muted)', cursor: 'pointer' }}
          >→</button>
        </div>
      </div>

      {/* New Note */}
      <Card className="mb-6">
        <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--color-text)' }}>
          Nova Nota — 11/03/2026
        </h3>
        <textarea
          ref={textareaRef}
          placeholder="O que você quer registrar sobre suas finanças hoje?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          style={{ resize: 'vertical', width: '100%', marginBottom: 12 }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSave()
          }}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
            {content.length > 0 ? `${content.length} caracteres · Ctrl+Enter para salvar` : 'Ctrl+Enter para salvar rapidamente'}
          </span>
          <Button onClick={handleSave} disabled={!content.trim()}>
            Salvar Nota
          </Button>
        </div>
      </Card>

      {/* Notes List */}
      {filteredNotes.length === 0 ? (
        <div
          className="text-center py-16 rounded-2xl"
          style={{ border: '2px dashed var(--color-border)' }}
        >
          <p className="text-4xl mb-3">📭</p>
          <p className="font-medium" style={{ color: 'var(--color-muted)' }}>
            Nenhuma nota em {formatMonth(year, month)}
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-border)' }}>
            Escreva a primeira nota do mês acima
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredNotes.map((note) => {
            const parts = note.data.split('-')
            const day = parts[2] ?? ''
            const month_ = parts[1] ?? ''

            return (
              <Card key={note.id} className="group animate-fade-in">
                <div className="flex items-start justify-between gap-4">
                  <div style={{ flex: 1 }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="px-2 py-0.5 rounded-md text-xs font-semibold"
                        style={{
                          background: 'rgba(59,130,246,0.12)',
                          color: 'var(--color-blue)',
                          border: '1px solid rgba(59,130,246,0.2)',
                        }}
                      >
                        {day}/{month_}/2026
                      </div>
                    </div>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: 'var(--color-text)', whiteSpace: 'pre-wrap' }}
                    >
                      {note.conteudo}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 mt-1"
                    style={{
                      background: 'rgba(239,68,68,0.1)',
                      color: 'var(--color-red)',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    🗑
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
