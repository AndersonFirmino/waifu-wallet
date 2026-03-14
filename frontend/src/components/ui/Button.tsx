import { type ReactNode, type MouseEvent } from 'react'
import { type ButtonVariant, type SizeVariant } from '../../types'

interface ButtonProps {
  children: ReactNode
  variant?: ButtonVariant
  size?: SizeVariant
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  className?: string
  title?: string
}

interface VariantStyle {
  className: string
  style: Record<string, string>
}

const VARIANT_MAP: Record<ButtonVariant, VariantStyle> = {
  primary: {
    className: 'text-white hover:brightness-110 active:brightness-90',
    style: { backgroundColor: 'var(--color-blue)' },
  },
  danger: {
    className: 'text-white hover:brightness-110 active:brightness-90',
    style: { backgroundColor: 'var(--color-red)' },
  },
  ghost: {
    className: 'hover:brightness-125',
    style: { backgroundColor: 'transparent', color: 'var(--color-muted)' },
  },
  outline: {
    className: 'border hover:brightness-125',
    style: {
      backgroundColor: 'transparent',
      borderColor: 'var(--color-border)',
      color: 'var(--color-text)',
    },
  },
}

const SIZE_MAP: Record<SizeVariant, string> = {
  xs: 'text-xs px-2.5 py-1 gap-1',
  sm: 'text-xs px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2 gap-2',
  lg: 'text-base px-6 py-3 gap-2',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  type = 'button',
  className = '',
  title,
}: ButtonProps) {
  const v = VARIANT_MAP[variant]

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${v.className} ${SIZE_MAP[size]} ${className}`}
      style={v.style}
      title={title}
    >
      {children}
    </button>
  )
}
