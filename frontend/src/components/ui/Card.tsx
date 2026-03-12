import { type ReactNode, type CSSProperties } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  style?: CSSProperties
  onClick?: () => void
}

export default function Card({ children, className = '', hover = false, style, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border p-5 ${hover ? 'card-hover cursor-pointer' : ''} ${className}`}
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
