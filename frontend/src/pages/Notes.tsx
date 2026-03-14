import { useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Card from '../components/ui/Card'
import { formatMonth } from '../utils/date'
import { type Note } from '../types'
import { useFetch } from '../hooks/useApi'
import { decodeNoteList, decodeNote } from '../lib/decode'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayString(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${String(yyyy)}-${mm}-${dd}`
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Notes() {
  const { data: serverNotes } = useFetch('/notes/', decodeNoteList)
  const [additions, setAdditions] = useState<Note[]>([])
  const [deletedIds, setDeletedIds] = useState<number[]>([])
  const [editedContent, setEditedContent] = useState<Map<number, string>>(new Map())
  const [month, setMonth] = useState(new Date().getMonth())
  const [year, setYear] = useState(new Date().getFullYear())

  // ─── Create form state ───────────────────────────────────────────────────
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createDate, setCreateDate] = useState(todayString())
  const [createContent, setCreateContent] = useState('')
  const [createLoading, setCreateLoading] = useState(false)

  // ─── Edit state ──────────────────────────────────────────────────────────
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  const notes = [...additions, ...(serverNotes ?? []).filter((n) => !deletedIds.includes(n.id))]
    .map((n) => {
      const patched = editedContent.get(n.id)
      return patched !== undefined ? { ...n, content: patched } : n
    })

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

  const handleDelete = async (id: number) => {
    await fetch(`/api/v1/notes/${String(id)}`, { method: 'DELETE' })
    setAdditions((prev) => prev.filter((n) => n.id !== id))
    setDeletedIds((prev) => [...prev, id])
    if (editingId === id) setEditingId(null)
  }

  const handleCreate = async () => {
    if (!createContent.trim()) return
    setCreateLoading(true)
    try {
      const r = await fetch('/api/v1/notes/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: createDate, content: createContent }),
      })
      if (!r.ok) throw new Error(`HTTP ${String(r.status)}`)
      const raw: unknown = await r.json()
      const created = decodeNote(raw)
      setAdditions((prev) => [created, ...prev])
      setCreateContent('')
      setCreateDate(todayString())
      setShowCreateForm(false)
      // Switch view to the month of the created note
      const parts = created.date.split('-')
      const createdYear = parseInt(parts[0] ?? '0', 10)
      const createdMonth = parseInt(parts[1] ?? '0', 10) - 1
      setYear(createdYear)
      setMonth(createdMonth)
    } finally {
      setCreateLoading(false)
    }
  }

  const handleEditStart = (note: Note) => {
    setEditingId(note.id)
    setEditDraft(note.content)
  }

  const handleEditCancel = () => {
    setEditingId(null)
    setEditDraft('')
  }

  const handleEditSave = async (id: number) => {
    setEditLoading(true)
    try {
      const r = await fetch(`/api/v1/notes/${String(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editDraft }),
      })
      if (!r.ok) throw new Error(`HTTP ${String(r.status)}`)
      setEditedContent((prev) => {
        const next = new Map(prev)
        next.set(id, editDraft)
        return next
      })
      setEditingId(null)
      setEditDraft('')
    } finally {
      setEditLoading(false)
    }
  }

  const filteredNotes = notes
    .filter((n) => {
      const parts = n.date.split('-')
      const noteYear = parseInt(parts[0] ?? '0', 10)
      const noteMonth = parseInt(parts[1] ?? '0', 10) - 1
      return noteYear === year && noteMonth === month
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)

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
            onClick={() => {
              setShowCreateForm((v) => !v)
              setCreateDate(todayString())
              setCreateContent('')
            }}
            className="px-4 h-9 rounded-lg text-sm font-semibold flex items-center gap-2"
            style={{
              background: 'var(--color-blue)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            + Nova Nota
          </button>
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

      {/* Create Form */}
      {showCreateForm && (
        <Card className="mb-5 animate-fade-in">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold" style={{ color: 'var(--color-muted)', minWidth: 40 }}>
                Data
              </label>
              <input
                type="date"
                value={createDate}
                onChange={(e) => { setCreateDate(e.target.value) }}
                className="rounded-md px-3 py-1.5 text-sm"
                style={{
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                  outline: 'none',
                }}
              />
            </div>
            <textarea
              value={createContent}
              onChange={(e) => { setCreateContent(e.target.value) }}
              placeholder="Conteúdo da nota (suporta Markdown)..."
              rows={6}
              className="rounded-md px-3 py-2 text-sm resize-y"
              style={{
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
                outline: 'none',
                fontFamily: 'inherit',
                lineHeight: 1.6,
              }}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowCreateForm(false) }}
                className="px-4 py-1.5 rounded-lg text-sm font-medium"
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-muted)',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => { void handleCreate() }}
                disabled={createLoading || !createContent.trim()}
                className="px-4 py-1.5 rounded-lg text-sm font-semibold"
                style={{
                  background: 'var(--color-blue)',
                  color: '#fff',
                  border: 'none',
                  cursor: createLoading || !createContent.trim() ? 'not-allowed' : 'pointer',
                  opacity: createLoading || !createContent.trim() ? 0.6 : 1,
                }}
              >
                {createLoading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Notes List */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{ border: '2px dashed var(--color-border)' }}>
          <p className="text-4xl mb-3">📭</p>
          <p className="font-medium" style={{ color: 'var(--color-muted)' }}>
            Nenhuma nota em {formatMonth(year, month)}
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-border)' }}>
            O conselheiro financeiro ainda não registrou nenhuma nota este mês
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredNotes.map((note) => {
            const parts = note.date.split('-')
            const day = parts[2] ?? ''
            const noteMonth = parts[1] ?? ''
            const noteYear = parts[0] ?? ''
            const isEditing = editingId === note.id

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
                    {isEditing ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <textarea
                          value={editDraft}
                          onChange={(e) => { setEditDraft(e.target.value) }}
                          rows={6}
                          className="rounded-md px-3 py-2 text-sm resize-y w-full"
                          style={{
                            background: 'var(--color-bg)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-text)',
                            outline: 'none',
                            fontFamily: 'inherit',
                            lineHeight: 1.6,
                          }}
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={handleEditCancel}
                            className="px-3 py-1 rounded-lg text-xs font-medium"
                            style={{
                              background: 'var(--color-surface)',
                              border: '1px solid var(--color-border)',
                              color: 'var(--color-muted)',
                              cursor: 'pointer',
                            }}
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => { void handleEditSave(note.id) }}
                            disabled={editLoading}
                            className="px-3 py-1 rounded-lg text-xs font-semibold"
                            style={{
                              background: 'var(--color-blue)',
                              color: '#fff',
                              border: 'none',
                              cursor: editLoading ? 'not-allowed' : 'pointer',
                              opacity: editLoading ? 0.6 : 1,
                            }}
                          >
                            {editLoading ? 'Salvando...' : 'Salvar'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm leading-relaxed prose-notes" style={{ color: 'var(--color-text)' }}>
                        <Markdown remarkPlugins={[remarkGfm]}>{note.content}</Markdown>
                      </div>
                    )}
                  </div>
                  {!isEditing && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 flex-shrink-0 mt-1">
                      <button
                        onClick={() => { handleEditStart(note) }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                        style={{
                          background: 'rgba(59,130,246,0.1)',
                          color: 'var(--color-blue)',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        ✏
                      </button>
                      <button
                        onClick={() => {
                          void handleDelete(note.id)
                        }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
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
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
