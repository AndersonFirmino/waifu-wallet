import { useState, useRef } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { formatMonth } from '../utils/date'
import { type Note } from '../types'
import { useFetch } from '../hooks/useApi'
import { decodeNote, decodeNoteList } from '../lib/decode'

// ─── Component ────────────────────────────────────────────────────────────────

export default function Notes() {
  const { data: serverNotes } = useFetch('/notes/', decodeNoteList)
  const [additions, setAdditions] = useState<Note[]>([])
  const [deletedIds, setDeletedIds] = useState<number[]>([])
  const [month, setMonth] = useState(new Date().getMonth())
  const [year, setYear] = useState(new Date().getFullYear())
  const [content, setContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const notes = [...additions, ...(serverNotes ?? []).filter((n) => !deletedIds.includes(n.id))]

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11)
      setYear((y) => y - 1)
    } else setMonth((m) => m - 1)
  }

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0)
      setYear((y) => y + 1)
    } else setMonth((m) => m + 1)
  }

  const handleSave = async () => {
    if (!content.trim()) return
    const dateStr = new Date().toISOString().slice(0, 10)
    const r = await fetch('/api/v1/notes/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: dateStr, content: content.trim() }),
    })
    if (!r.ok) return
    const raw: unknown = await r.json()
    const created = decodeNote(raw)
    setAdditions((prev) => [created, ...prev])
    setContent('')
    textareaRef.current?.focus()
  }

  const handleDelete = async (id: number) => {
    await fetch(`/api/v1/notes/${String(id)}`, { method: 'DELETE' })
    setAdditions((prev) => prev.filter((n) => n.id !== id))
    setDeletedIds((prev) => [...prev, id])
  }

  const filteredNotes = notes.filter((n) => {
    const parts = n.date.split('-')
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
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-muted)',
              cursor: 'pointer',
            }}
          >
            ←
          </button>
          <span
            className="font-semibold text-sm"
            style={{ color: 'var(--color-text)', minWidth: 150, textAlign: 'center' }}
          >
            {formatMonth(year, month)}
          </span>
          <button
            onClick={nextMonth}
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-muted)',
              cursor: 'pointer',
            }}
          >
            →
          </button>
        </div>
      </div>

      {/* New Note */}
      <Card className="mb-6">
        <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--color-text)' }}>
          Nova Nota — {new Date().toLocaleDateString('pt-BR')}
        </h3>
        <textarea
          ref={textareaRef}
          placeholder="O que você quer registrar sobre suas finanças hoje?"
          value={content}
          onChange={(e) => {
            setContent(e.target.value)
          }}
          rows={4}
          style={{ resize: 'vertical', width: '100%', marginBottom: 12 }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) void handleSave()
          }}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
            {content.length > 0
              ? `${String(content.length)} caracteres · Ctrl+Enter para salvar`
              : 'Ctrl+Enter para salvar rapidamente'}
          </span>
          <Button
            onClick={() => {
              void handleSave()
            }}
            disabled={!content.trim()}
          >
            Salvar Nota
          </Button>
        </div>
      </Card>

      {/* Notes List */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{ border: '2px dashed var(--color-border)' }}>
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
            const parts = note.date.split('-')
            const day = parts[2] ?? ''
            const noteMonth = parts[1] ?? ''
            const noteYear = parts[0] ?? ''

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
                        {day}/{noteMonth}/{noteYear}
                      </div>
                    </div>
                    <div className="text-sm leading-relaxed prose-notes" style={{ color: 'var(--color-text)' }}>
                      <Markdown remarkPlugins={[remarkGfm]}>{note.content}</Markdown>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      void handleDelete(note.id)
                    }}
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
