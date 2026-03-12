import { useState } from 'react'
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
  return type === 'today' ? 18 : 10
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TimelineRoadmap({ events }: TimelineRoadmapProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

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
  const rawTodayPct = totalSpan > 0 ? ((todayTime - startTime) / totalSpan) * 100 : 0
  const todayPct = 4 + (rawTodayPct * 92) / 100

  // Min spacing: nodes within 2% are considered overlapping — alternate above/below
  const getPosition = (d: Date): number => {
    if (totalSpan === 0) return 50
    const raw = ((d.getTime() - startTime) / totalSpan) * 100
    return 4 + (raw * 92) / 100
  }

  // Assign label side: alternate above (even index) / below (odd index) for non-today nodes
  // Today is always below, special styling
  const labelSides = sortedEvents.map((ev, i) => {
    if (ev.type === 'today') return 'below' as const
    return i % 2 === 0 ? ('above' as const) : ('below' as const)
  })

  // Heights for top/bottom sections (labels only — images moved to tooltips)
  const TRACK_TOP = 180   // px from top — enough space for tooltip above
  const TRACK_HEIGHT = 4  // px
  const BOTTOM_HEIGHT = 80 // px below track for bottom labels

  const totalHeight = TRACK_TOP + TRACK_HEIGHT + BOTTOM_HEIGHT

  return (
    <Card className="mb-6">
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
              left: '4%',
              right: '4%',
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
              left: '4%',
              width: String(Math.max(0, todayPct - 4)) + '%',
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
                  top: 0,
                  transform: 'translateX(-50%)',
                  width: 80,
                  height: totalHeight,
                  cursor: 'pointer',
                }}
                onMouseEnter={() => { setHoveredIndex(i) }}
                onMouseLeave={() => { setHoveredIndex(null) }}
              >
                {/* Vertical line for today */}
                {isToday && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 2,
                      height: totalHeight,
                      background: `linear-gradient(180deg, transparent 0%, ${color}88 30%, ${color}88 70%, transparent 100%)`,
                      zIndex: 1,
                    }}
                  />
                )}

                {/* Node dot */}
                <div
                  style={{
                    position: 'absolute',
                    top: nodeTop,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: hoveredIndex === i ? size + 4 : size,
                    height: hoveredIndex === i ? size + 4 : size,
                    borderRadius: '50%',
                    backgroundColor: color,
                    boxShadow: isToday
                      ? `0 0 8px ${color}, 0 0 0 4px ${color}44`
                      : hoveredIndex === i
                        ? `0 0 8px ${color}, 0 0 0 3px ${color}33`
                        : undefined,
                    animation: isToday ? 'pulse 2s ease-in-out infinite' : undefined,
                    zIndex: 2,
                    transition: 'width 0.15s ease, height 0.15s ease, box-shadow 0.15s ease',
                  }}
                />

                {/* Tooltip */}
                {hoveredIndex === i && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: totalHeight - TRACK_TOP + 14,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      zIndex: 20,
                      pointerEvents: 'none',
                    }}
                  >
                    <div
                      style={{
                        background: 'var(--color-surface)',
                        border: `1px solid ${color}44`,
                        borderRadius: 12,
                        padding: 12,
                        boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${color}22`,
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        minWidth: 100,
                      }}
                    >
                      {ev.imageUrl ? (
                        <img
                          src={ev.imageUrl}
                          alt={ev.label}
                          style={{
                            width: 80,
                            height: 80,
                            borderRadius: 10,
                            border: `2px solid ${color}`,
                            objectFit: 'cover',
                            objectPosition: 'top center',
                            display: 'block',
                            margin: '0 auto 8px',
                          }}
                        />
                      ) : (
                        <div style={{ fontSize: 32, lineHeight: 1, marginBottom: 8 }}>
                          {nodeEmoji(ev.type)}
                        </div>
                      )}
                      <div
                        className="text-sm font-semibold"
                        style={{ color: color, marginBottom: 2 }}
                      >
                        {ev.label}
                      </div>
                      {ev.sublabel && (
                        <div className="text-xs" style={{ color: 'var(--color-muted)' }}>
                          {ev.sublabel}
                        </div>
                      )}
                      <div
                        className="text-xs"
                        style={{ color: 'var(--color-muted)', marginTop: 2 }}
                      >
                        {formatShortDate(ev.date)}
                      </div>
                    </div>
                    {/* Arrow pointing down */}
                    <div
                      style={{
                        width: 0,
                        height: 0,
                        borderLeft: '6px solid transparent',
                        borderRight: '6px solid transparent',
                        borderTop: `6px solid ${color}44`,
                        margin: '0 auto',
                      }}
                    />
                  </div>
                )}

                {/* Label — above track */}
                {side === 'above' && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: BOTTOM_HEIGHT + TRACK_HEIGHT + 10,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <div style={{ fontSize: 14, lineHeight: 1 }}>{nodeEmoji(ev.type)}</div>
                    <div
                      className="text-xs font-medium"
                      style={{
                        color: color,
                        marginTop: 2,
                        maxWidth: 140,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
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
                    <div style={{ fontSize: 14, lineHeight: 1 }}>{nodeEmoji(ev.type)}</div>
                    <div
                      className="text-xs font-medium"
                      style={{
                        color: color,
                        marginTop: 2,
                        maxWidth: 140,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
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
