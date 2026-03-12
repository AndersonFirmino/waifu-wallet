import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Card from '../Card'

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Conteúdo do card</Card>)
    expect(screen.getByText('Conteúdo do card')).toBeInTheDocument()
  })

  it('renders as a div', () => {
    render(<Card>Children</Card>)
    expect(screen.getByText('Children').tagName).toBe('DIV')
  })

  it('applies rounded-xl and border classes', () => {
    render(<Card>Border</Card>)
    const el = screen.getByText('Border')
    expect(el).toHaveClass('rounded-xl', 'border', 'p-5')
  })

  it('applies card-hover class when hover=true', () => {
    render(<Card hover>Hover</Card>)
    expect(screen.getByText('Hover')).toHaveClass('card-hover')
  })

  it('does not apply card-hover class by default', () => {
    render(<Card>No hover</Card>)
    expect(screen.getByText('No hover')).not.toHaveClass('card-hover')
  })

  it('applies cursor-pointer when hover=true', () => {
    render(<Card hover>Clickable</Card>)
    expect(screen.getByText('Clickable')).toHaveClass('cursor-pointer')
  })

  it('applies additional className', () => {
    render(<Card className="mb-6">With class</Card>)
    expect(screen.getByText('With class')).toHaveClass('mb-6')
  })

  it('calls onClick when clicked', async () => {
    const handler = vi.fn()
    render(<Card onClick={handler}>Click me</Card>)
    await userEvent.click(screen.getByText('Click me'))
    expect(handler).toHaveBeenCalledTimes(1)
  })
})
