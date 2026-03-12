import { useState, useCallback, useRef } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ImageCropUploadProps {
  aspectRatio?: number
  onUploadComplete: (url: string) => void
  buttonLabel?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function assertRecord(val: unknown): asserts val is Record<string, unknown> {
  if (typeof val !== 'object' || val === null || Array.isArray(val)) {
    throw new Error('Expected plain object')
  }
}

function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = pixelCrop.width
      canvas.height = pixelCrop.height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height,
      )
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Canvas toBlob failed'))
      }, 'image/png')
    }
    image.onerror = () => {
      reject(new Error('Failed to load image'))
    }
    image.src = imageSrc
  })
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ImageCropUpload({
  aspectRatio = 16 / 9,
  onUploadComplete,
  buttonLabel = 'Upload Imagem',
}: ImageCropUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [uploading, setUploading] = useState(false)

  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const objectUrl = URL.createObjectURL(file)
    setCropSrc(objectUrl)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
    // Reset input so the same file can be selected again
    e.target.value = ''
  }

  const onCropComplete = useCallback((_croppedArea: Area, pixelCrop: Area) => {
    setCroppedAreaPixels(pixelCrop)
  }, [])

  const handleCancel = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }

  const handleConfirm = async () => {
    if (!cropSrc || !croppedAreaPixels) return
    setUploading(true)
    try {
      const blob = await getCroppedImg(cropSrc, croppedAreaPixels)
      const formData = new FormData()
      formData.append('file', blob, 'upload.png')
      const response = await fetch('/api/v1/upload/gacha', {
        method: 'POST',
        body: formData,
      })
      if (!response.ok) throw new Error(`Upload failed: ${String(response.status)}`)
      const raw: unknown = await response.json()
      assertRecord(raw)
      const url = raw.url
      if (typeof url !== 'string') throw new Error('Expected url to be string')
      URL.revokeObjectURL(cropSrc)
      setCropSrc(null)
      onUploadComplete(url)
    } catch (err) {
      console.error('ImageCropUpload error:', err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Trigger button */}
      <button
        type="button"
        onClick={openFilePicker}
        style={{
          background: 'var(--color-surface2)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text)',
          borderRadius: 8,
          padding: '8px 16px',
          fontSize: 13,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {buttonLabel}
      </button>

      {/* Crop modal */}
      {cropSrc !== null && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 700,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh',
            }}
          >
            {/* Crop area */}
            <div style={{ position: 'relative', flex: 1, minHeight: 380, background: '#111' }}>
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspectRatio}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            {/* Bottom bar */}
            <div
              style={{
                padding: '14px 20px',
                borderTop: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}
            >
              {/* Zoom slider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                <span style={{ fontSize: 12, color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>
                  Zoom
                </span>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={zoom}
                  onChange={(e) => { setZoom(Number(e.target.value)) }}
                  style={{ flex: 1, accentColor: 'var(--color-purple)' }}
                />
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={uploading}
                  style={{
                    background: 'var(--color-surface2)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-muted)',
                    borderRadius: 8,
                    padding: '8px 18px',
                    fontSize: 13,
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    opacity: uploading ? 0.5 : 1,
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => { void handleConfirm() }}
                  disabled={uploading}
                  style={{
                    background: 'var(--color-purple)',
                    border: 'none',
                    color: '#fff',
                    borderRadius: 8,
                    padding: '8px 18px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    opacity: uploading ? 0.7 : 1,
                  }}
                >
                  {uploading ? 'Enviando…' : 'Cortar e Enviar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
