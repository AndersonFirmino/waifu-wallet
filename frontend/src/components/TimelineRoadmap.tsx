import Card from './ui/Card'

// ─── Types ────────────────────────────────────────────────────────────────────

export type TimelineEventType = 'today' | 'salary' | 'gacha' | 'bill'

export interface TimelineEvent {
  date: Date
  label: string
  sublabel?: string
  type: TimelineEventType
  imageUrl?: string
}

interface TimelineRoadmapProps {
  events: TimelineEvent[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatShortDate(d: Date): string {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function nodeColor(type: TimelineEventType): string {
  switch (type) {
    case 'today':
      return 'var(--color-blue)'
    case 'salary':
      return 'var(--color-green)'
    case 'gacha':
      return 'var(--color-purple)'
    case 'bill':
      return 'var(--color-red)'
  }
}

function nodeEmoji(type: TimelineEventType): string {
  switch (type) {
    case 'today':
      return '📍'
    case 'salary':
      return '💰'
    case 'gacha':
      return '🎮'
    case 'bill':
      return '💳'
  }
}

function nodeSize(type: TimelineEventType): number {
  return type === 'today' ? 14 : 10
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TimelineRoadmap({ events }: TimelineRoadmapProps) {
  if (events.length === 0) {
    return (
      <Card className="mb-6">
        <p className="text-sm text-center" style={{ color: 'var(--color-muted)' }}>
          Nenhum evento para exibir
        </p>
      </Card>
    )
  }

  const sortedEvents = [...events].sort((a, b) => a.date.getTime() - b.date.getTime())

  const firstEvent = sortedEvents[0]
  const lastEvent = sortedEvents[sortedEvents.length - 1]

  if (!firstEvent || !lastEvent) {
    return null
  }

  const startTime = firstEvent.date.getTime()
  const endTime = lastEvent.date.getTime()
  const totalSpan = endTime - startTime

  const todayEvent = sortedEvents.find((e) => e.type === 'today')
  const todayTime = todayEvent ? todayEvent.date.getTime() : startTime
  const todayPct = totalSpan > 0 ? ((todayTime - startTime) / totalSpan) * 100 : 0

  // Min spacing: nodes within 2% are considered overlapping — alternate above/below
  const getPosition = (d: Date): number => {
    if (totalSpan === 0) return 0
    return ((d.getTime() - startTime) / totalSpan) * 100
  }

  // Assign label side: alternate above (even index) / below (odd index) for non-today nodes
  // Today is always below, special styling
  const labelSides = sortedEvents.map((ev, i) => {
    if (ev.type === 'today') return 'below' as const
    return i % 2 === 0 ? ('above' as const) : ('below' as const)
  })

  // Heights for top/bottom sections (enough space for labels)
  const TRACK_TOP = 80    // px from top of inner area to track line
  const TRACK_HEIGHT = 4  // px
  const BOTTOM_HEIGHT = 80 // px below track for bottom labels

  const totalHeight = TRACK_TOP + TRACK_HEIGHT + BOTTOM_HEIGHT

  return (
    <Card className="mb-6" style={{ overflow: 'hidden' }}>
      <div className="flex items-center gap-2 mb-4">
        <span style={{ fontSize: 16 }}>🗺️</span>
        <span className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
          Roadmap Financeiro
        </span>
      </div>

      {/* Scrollable track container */}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div
          style={{
            position: 'relative',
            minWidth: 600,
            height: totalHeight,
          }}
        >
          {/* Background track (full width) */}
          <div
            style={{
              position: 'absolute',
              top: TRACK_TOP,
              left: 0,
              right: 0,
              height: TRACK_HEIGHT,
              backgroundColor: 'var(--color-border)',
              borderRadius: 2,
            }}
          />

          {/* Progress track (from start to today) */}
          <div
            style={{
              position: 'absolute',
              top: TRACK_TOP,
              left: 0,
              width: String(Math.max(0, Math.min(100, todayPct))) + '%',
              height: TRACK_HEIGHT,
              background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
              borderRadius: 2,
            }}
          />

          {/* Event nodes */}
          {sortedEvents.map((ev, i) => {
            const pct = getPosition(ev.date)
            const color = nodeColor(ev.type)
            const size = nodeSize(ev.type)
            const side = labelSides[i] ?? 'below'
            const isToday = ev.type === 'today'
            const nodeTop = TRACK_TOP + TRACK_HEIGHT / 2 - size / 2

            return (
              <div
                key={`${ev.type}-${String(ev.date.getTime())}-${String(i)}`}
                style={{
                  position: 'absolute',
                  left: String(pct) + '%',
                  transform: 'translateX(-50%)',
                }}
              >
                {/* Image (gacha with imageUrl) — positioned above track */}
                {ev.type === 'gacha' && ev.imageUrl && side === 'above' && (
                  <div
                    style={{
                      position: 'absolute',
                      top: nodeTop - 48,
                      left: '50%',
                      transform: 'translateX(-50%)',
                    }}
                  >
                    <img
                      src={ev.imageUrl}
                      alt={ev.label}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        border: `2px solid ${color}`,
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  </div>
                )}

                {/* Image (gacha with imageUrl) — positioned below track */}
                {ev.type === 'gacha' && ev.imageUrl && side === 'below' && (
                  <div
                    style={{
                      position: 'absolute',
                      top: nodeTop + size + 24,
                      left: '50%',
                      transform: 'translateX(-50%)',
                    }}
                  >
                    <img
                      src={ev.imageUrl}
                      alt={ev.label}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        border: `2px solid ${color}`,
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  </div>
                )}

                {/* Node dot */}
                <div
                  style={{
                    position: 'absolute',
                    top: nodeTop,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    backgroundColor: color,
                    boxShadow: isToday ? `0 0 0 3px ${color}33` : undefined,
                    animation: isToday ? 'pulse 2s ease-in-out infinite' : undefined,
                    zIndex: 2,
                  }}
                />

                {/* Label — above track */}
                {side === 'above' && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {ev.type !== 'gacha' || !ev.imageUrl ? (
                      <div style={{ fontSize: 14, lineHeight: 1 }}>{nodeEmoji(ev.type)}</div>
                    ) : null}
                    <div
                      className="text-xs font-medium"
                      style={{
                        color: color,
                        marginTop: 2,
                        maxWidth: 90,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {ev.label}
                    </div>
                    {ev.sublabel && (
                      <div className="text-xs" style={{ color: 'var(--color-muted)', marginTop: 1 }}>
                        {ev.sublabel}
                      </div>
                    )}
                    <div className="text-xs" style={{ color: 'var(--color-muted)', marginTop: 2 }}>
                      {formatShortDate(ev.date)}
                    </div>
                  </div>
                )}

                {/* Label — below track */}
                {side === 'below' && (
                  <div
                    style={{
                      position: 'absolute',
                      top: nodeTop + size + 6,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {ev.type !== 'gacha' || !ev.imageUrl ? (
                      <div style={{ fontSize: 14, lineHeight: 1 }}>{nodeEmoji(ev.type)}</div>
                    ) : null}
                    <div
                      className="text-xs font-medium"
                      style={{
                        color: isToday ? color : color,
                        marginTop: 2,
                        maxWidth: 90,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {ev.label}
                    </div>
                    {ev.sublabel && (
                      <div className="text-xs" style={{ color: 'var(--color-muted)', marginTop: 1 }}>
                        {ev.sublabel}
                      </div>
                    )}
                    <div className="text-xs" style={{ color: 'var(--color-muted)', marginTop: 2 }}>
                      {formatShortDate(ev.date)}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 3px rgba(59,130,246,0.3); }
          50% { opacity: 0.8; box-shadow: 0 0 0 6px rgba(59,130,246,0.1); }
        }
      `}</style>
    </Card>
  )
}
