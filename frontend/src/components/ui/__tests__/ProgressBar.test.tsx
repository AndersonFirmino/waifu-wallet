import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProgressBar from '../ProgressBar'

describe('ProgressBar', () => {
  it('shows percentage text by default', () => {
    render(<ProgressBar value={50} />)
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('hides percentage when showPercent=false', () => {
    render(<ProgressBar value={50} showPercent={false} />)
    expect(screen.queryByText('50%')).not.toBeInTheDocument()
  })

  it('shows label when provided', () => {
    render(<ProgressBar value={30} label="Gasto" />)
    expect(screen.getByText('Gasto')).toBeInTheDocument()
  })

  it('does not show label when not provided', () => {
    render(<ProgressBar value={30} />)
    expect(screen.queryByText('Gasto')).not.toBeInTheDocument()
  })

  it('caps percentage at 100 even when value exceeds max', () => {
    render(<ProgressBar value={200} max={100} />)
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('calculates percentage correctly from value/max', () => {
    render(<ProgressBar value={1} max={4} />)
    expect(screen.getByText('25%')).toBeInTheDocument()
  })

  it('rounds percentage to nearest integer', () => {
    render(<ProgressBar value={1} max={3} />)
    // 1/3 = 33.33... → Math.round = 33
    expect(screen.getByText('33%')).toBeInTheDocument()
  })

  it('shows 0% for zero value', () => {
    render(<ProgressBar value={0} />)
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('renders the bar container and fill', () => {
    const { container } = render(<ProgressBar value={60} />)
    // outer track + inner fill
    const divs = container.querySelectorAll('div')
    expect(divs.length).toBeGreaterThan(1)
  })

  it('renders with auto color without throwing', () => {
    render(<ProgressBar value={30} color="auto" />)
    expect(screen.getByText('30%')).toBeInTheDocument()
  })

  it('renders with explicit color without throwing', () => {
    render(<ProgressBar value={75} color="green" label="Verde" />)
    expect(screen.getByText('Verde')).toBeInTheDocument()
    expect(screen.getByText('75%')).toBeInTheDocument()
  })
})
