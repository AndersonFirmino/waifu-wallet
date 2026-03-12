import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Badge from '../Badge'

describe('Badge', () => {
  it('renders children text', () => {
    render(<Badge>Alimentação</Badge>)
    expect(screen.getByText('Alimentação')).toBeInTheDocument()
  })

  it('renders as a span element', () => {
    render(<Badge>Test</Badge>)
    expect(screen.getByText('Test').tagName).toBe('SPAN')
  })

  it('applies animate-pulse-glow class when pulse=true', () => {
    render(<Badge pulse>Perigo</Badge>)
    expect(screen.getByText('Perigo')).toHaveClass('animate-pulse-glow')
  })

  it('does not apply pulse class by default', () => {
    render(<Badge>Normal</Badge>)
    expect(screen.getByText('Normal')).not.toHaveClass('animate-pulse-glow')
  })

  it('applies xs size classes', () => {
    render(<Badge size="xs">Small</Badge>)
    expect(screen.getByText('Small')).toHaveClass('text-xs')
    expect(screen.getByText('Small')).toHaveClass('px-1.5')
  })

  it('applies lg size classes', () => {
    render(<Badge size="lg">Large</Badge>)
    expect(screen.getByText('Large')).toHaveClass('text-sm')
    expect(screen.getByText('Large')).toHaveClass('px-4')
  })

  it('applies sm size by default', () => {
    render(<Badge>Default</Badge>)
    expect(screen.getByText('Default')).toHaveClass('px-2.5')
  })

  it('applies rounded-full class', () => {
    render(<Badge>Rounded</Badge>)
    expect(screen.getByText('Rounded')).toHaveClass('rounded-full')
  })

  it('renders with different color variants without throwing', () => {
    const colors = ['blue', 'green', 'red', 'yellow', 'purple', 'orange', 'gray'] as const
    colors.forEach((color) => {
      const { unmount } = render(<Badge color={color}>{color}</Badge>)
      expect(screen.getByText(color)).toBeInTheDocument()
      unmount()
    })
  })
})
