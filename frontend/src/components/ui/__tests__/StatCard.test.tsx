import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatCard from '../StatCard'

describe('StatCard', () => {
  it('renders the label', () => {
    render(<StatCard icon="📈" label="Receitas" value="R$ 6.500,00" />)
    expect(screen.getByText('Receitas')).toBeInTheDocument()
  })

  it('renders the value', () => {
    render(<StatCard icon="📈" label="Receitas" value="R$ 6.500,00" />)
    expect(screen.getByText('R$ 6.500,00')).toBeInTheDocument()
  })

  it('renders the icon', () => {
    render(<StatCard icon="📈" label="Receitas" value="R$ 6.500,00" />)
    expect(screen.getByText('📈')).toBeInTheDocument()
  })

  it('renders sub text when provided', () => {
    render(<StatCard icon="📊" label="Risco" value="Dívidas" sub="R$ 1.150/mês" />)
    expect(screen.getByText('R$ 1.150/mês')).toBeInTheDocument()
  })

  it('does not render sub text when not provided', () => {
    render(<StatCard icon="📈" label="Receitas" value="R$ 1.000,00" />)
    expect(screen.queryByText('R$ 1.150/mês')).not.toBeInTheDocument()
  })

  it('shows positive trend arrow (↑) for trend >= 0', () => {
    render(<StatCard icon="📈" label="Receitas" value="R$ 1.000,00" trend={12} />)
    expect(screen.getByText(/↑.*12%/)).toBeInTheDocument()
  })

  it('shows negative trend arrow (↓) for trend < 0', () => {
    render(<StatCard icon="📉" label="Despesas" value="R$ 500,00" trend={-5} />)
    expect(screen.getByText(/↓.*5%/)).toBeInTheDocument()
  })

  it('does not render trend badge when trend is not provided', () => {
    render(<StatCard icon="💰" label="Saldo" value="R$ 3.000,00" />)
    expect(screen.queryByText(/↑/)).not.toBeInTheDocument()
    expect(screen.queryByText(/↓/)).not.toBeInTheDocument()
  })

  it('renders with zero trend (↑ 0%)', () => {
    render(<StatCard icon="📊" label="Label" value="Valor" trend={0} />)
    expect(screen.getByText(/↑.*0%/)).toBeInTheDocument()
  })
})
