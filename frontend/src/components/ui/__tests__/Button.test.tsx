import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Button from '../Button'

describe('Button', () => {
  it('renders children text', () => {
    render(<Button>Adicionar</Button>)
    expect(screen.getByRole('button', { name: 'Adicionar' })).toBeInTheDocument()
  })

  it('has type="button" by default', () => {
    render(<Button>Click</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })

  it('accepts type="submit"', () => {
    render(<Button type="submit">Enviar</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })

  it('calls onClick when clicked', async () => {
    const handler = vi.fn()
    render(<Button onClick={handler}>Clicar</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('does not call onClick when disabled', async () => {
    const handler = vi.fn()
    render(
      <Button onClick={handler} disabled>
        Bloqueado
      </Button>,
    )
    await userEvent.click(screen.getByRole('button'))
    expect(handler).not.toHaveBeenCalled()
  })

  it('button is disabled when disabled=true', () => {
    render(<Button disabled>Desabilitado</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('button is enabled by default', () => {
    render(<Button>Habilitado</Button>)
    expect(screen.getByRole('button')).not.toBeDisabled()
  })

  it('applies disabled:opacity-50 class when disabled', () => {
    render(<Button disabled>Off</Button>)
    expect(screen.getByRole('button')).toHaveClass('disabled:opacity-50')
  })

  it('applies md size classes by default', () => {
    render(<Button>Default Size</Button>)
    expect(screen.getByRole('button')).toHaveClass('px-4', 'py-2')
  })

  it('applies xs size classes', () => {
    render(<Button size="xs">Tiny</Button>)
    expect(screen.getByRole('button')).toHaveClass('px-2.5', 'py-1')
  })

  it('applies lg size classes', () => {
    render(<Button size="lg">Big</Button>)
    expect(screen.getByRole('button')).toHaveClass('px-6', 'py-3')
  })

  it('applies additional className', () => {
    render(<Button className="ml-auto">Extra</Button>)
    expect(screen.getByRole('button')).toHaveClass('ml-auto')
  })

  it('renders all variants without throwing', () => {
    const variants = ['primary', 'danger', 'ghost', 'outline'] as const
    variants.forEach((variant) => {
      const { unmount } = render(<Button variant={variant}>{variant}</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
      unmount()
    })
  })
})
