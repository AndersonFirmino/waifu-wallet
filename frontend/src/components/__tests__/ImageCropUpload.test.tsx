import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import ImageCropUpload from '../ImageCropUpload'

vi.mock('react-easy-crop', () => ({
  default: function MockCropper() {
    return <div data-testid="mock-cropper" />
  },
}))

describe('ImageCropUpload', () => {
  beforeEach(() => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:http://localhost/mock-id')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => { /* noop */ })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders button with default label', () => {
    render(<ImageCropUpload onUploadComplete={() => { /* noop */ }} />)
    expect(screen.getByRole('button', { name: 'Upload Imagem' })).toBeInTheDocument()
  })

  it('renders button with custom label', () => {
    render(<ImageCropUpload onUploadComplete={() => { /* noop */ }} buttonLabel="Custom" />)
    expect(screen.getByRole('button', { name: 'Custom' })).toBeInTheDocument()
  })

  it('hidden file input exists with correct attributes', () => {
    const { container } = render(<ImageCropUpload onUploadComplete={() => { /* noop */ }} />)
    const input = container.querySelector('input[type="file"]')
    expect(input).not.toBeNull()
    expect(input).toHaveAttribute('accept', 'image/*')
    expect(input).toHaveStyle({ display: 'none' })
  })

  it('clicking button triggers file input click', () => {
    const { container } = render(<ImageCropUpload onUploadComplete={() => { /* noop */ }} />)
    const input = container.querySelector('input[type="file"]')
    expect(input).not.toBeNull()

    const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => { /* noop */ })

    fireEvent.click(screen.getByRole('button', { name: 'Upload Imagem' }))
    expect(clickSpy).toHaveBeenCalledTimes(1)

    clickSpy.mockRestore()
  })

  it('modal not shown initially', () => {
    render(<ImageCropUpload onUploadComplete={() => { /* noop */ }} />)
    expect(screen.queryByText('Cortar e Enviar')).not.toBeInTheDocument()
  })

  it('file selection shows crop modal', () => {
    const { container } = render(<ImageCropUpload onUploadComplete={() => { /* noop */ }} />)
    const input = container.querySelector('input[type="file"]')
    if (input === null) throw new Error('file input not found')

    const file = new File(['test'], 'test.png', { type: 'image/png' })
    fireEvent.change(input, { target: { files: [file] } })

    expect(screen.getByText('Zoom')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cortar e Enviar' })).toBeInTheDocument()
  })

  it('cancel closes modal', () => {
    const { container } = render(<ImageCropUpload onUploadComplete={() => { /* noop */ }} />)
    const input = container.querySelector('input[type="file"]')
    if (input === null) throw new Error('file input not found')

    const file = new File(['test'], 'test.png', { type: 'image/png' })
    fireEvent.change(input, { target: { files: [file] } })

    expect(screen.getByRole('button', { name: 'Cortar e Enviar' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByText('Cortar e Enviar')).not.toBeInTheDocument()
  })
})
