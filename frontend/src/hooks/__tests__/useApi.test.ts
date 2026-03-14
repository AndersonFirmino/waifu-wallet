import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useFetch, usePost } from '../useApi'

// ─── Mock Response Shape ──────────────────────────────────────────────────────

interface MockResponse {
  ok: boolean
  status: number
  json: () => Promise<unknown>
}

function makeMockResponse(data: unknown, ok = true): MockResponse {
  return {
    ok,
    status: ok ? 200 : 400,
    json: (): Promise<unknown> => Promise.resolve(data),
  }
}

function setupFetch(response: MockResponse) {
  const mockFn = vi.fn().mockResolvedValue(response)
  vi.stubGlobal('fetch', mockFn)
  return mockFn
}

// ─── Decode Helpers (no type assertions) ─────────────────────────────────────

function decodeNumber(raw: unknown): number {
  if (typeof raw === 'number') return raw
  throw new Error(`Expected number, got ${typeof raw}`)
}

function decodeString(raw: unknown): string {
  if (typeof raw === 'string') return raw
  throw new Error(`Expected string, got ${typeof raw}`)
}

interface IdPayload {
  id: number
}

function decodeIdPayload(raw: unknown): IdPayload {
  if (typeof raw === 'object' && raw !== null && 'id' in raw) {
    const { id } = raw
    if (typeof id === 'number') return { id }
  }
  throw new Error('Expected {id: number}')
}

// ─── useFetch ────────────────────────────────────────────────────────────────

describe('useFetch', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('starts with loading=true, data=null, error=null', () => {
    setupFetch(makeMockResponse(42))
    const { result } = renderHook(() => useFetch('/test', decodeNumber, 0))

    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.refreshing).toBe(false)
  })

  it('sets data and loading=false on successful fetch', async () => {
    setupFetch(makeMockResponse(99))
    const { result } = renderHook(() => useFetch('/test', decodeNumber, 0))

    await waitFor(() => { expect(result.current.loading).toBe(false); })

    expect(result.current.data).toBe(99)
    expect(result.current.error).toBeNull()
  })

  it('calls decode with the raw JSON response', async () => {
    const decode = vi.fn((raw: unknown): number => {
      if (typeof raw === 'number') return raw
      throw new Error('not number')
    })
    setupFetch(makeMockResponse(7))
    const { result } = renderHook(() => useFetch('/test', decode))

    await waitFor(() => { expect(result.current.loading).toBe(false); })

    expect(decode).toHaveBeenCalledWith(7)
  })

  it('prefixes the url with /api/v1', async () => {
    const mockFn = setupFetch(makeMockResponse('ok'))
    const { result } = renderHook(() => useFetch('/transactions', decodeString, 0))

    await waitFor(() => { expect(result.current.loading).toBe(false); })

    expect(mockFn).toHaveBeenCalledWith('/api/v1/transactions')
  })

  it('sets error and loading=false on non-ok response (HTTP 400)', async () => {
    setupFetch(makeMockResponse(null, false))
    const { result } = renderHook(() => useFetch('/test', decodeNumber, 0))

    await waitFor(() => { expect(result.current.loading).toBe(false); })

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toMatch(/HTTP 400/)
    expect(result.current.data).toBeNull()
  })

  it('sets error on network failure', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Network error'))
    vi.stubGlobal('fetch', mockFn)
    const { result } = renderHook(() => useFetch('/test', decodeNumber, 0))

    await waitFor(() => { expect(result.current.loading).toBe(false); })

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('Network error')
    expect(result.current.data).toBeNull()
  })

  it('sets error when decode throws (invalid data shape)', async () => {
    setupFetch(makeMockResponse('not-a-number'))
    const { result } = renderHook(() => useFetch('/test', decodeNumber, 0))

    await waitFor(() => { expect(result.current.loading).toBe(false); })

    expect(result.current.error).toBeInstanceOf(Error)
  })

  it('wraps non-Error rejections in Error', async () => {
    const mockFn = vi.fn().mockRejectedValue('plain string rejection')
    vi.stubGlobal('fetch', mockFn)
    const { result } = renderHook(() => useFetch('/test', decodeNumber, 0))

    await waitFor(() => { expect(result.current.loading).toBe(false); })

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('plain string rejection')
  })
})

// ─── usePost ─────────────────────────────────────────────────────────────────

describe('usePost', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('starts with loading=false and error=null', () => {
    const { result } = renderHook(() => usePost('/test', decodeIdPayload))

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('returns decoded response on success', async () => {
    setupFetch(makeMockResponse({ id: 5 }))
    const { result } = renderHook(() => usePost('/items', decodeIdPayload))

    const data = await result.current.post({ name: 'test' })

    expect(data).toEqual({ id: 5 })
  })

  it('sends POST with JSON body and correct Content-Type', async () => {
    const mockFn = setupFetch(makeMockResponse({ id: 1 }))
    const { result } = renderHook(() => usePost('/items', decodeIdPayload))

    await result.current.post({ name: 'foo' })

    expect(mockFn).toHaveBeenCalledWith(
      '/api/v1/items',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'foo' }),
      }),
    )
  })

  it('sets error and throws on non-ok response', async () => {
    setupFetch(makeMockResponse(null, false))
    const { result } = renderHook(() => usePost('/items', decodeIdPayload))

    await expect(result.current.post({})).rejects.toThrow(/HTTP 400/)
    // setError is a React state update — wait for it to flush
    await waitFor(() => { expect(result.current.error).toBeInstanceOf(Error); })
  })

  it('sets error and throws on network failure', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Network down'))
    vi.stubGlobal('fetch', mockFn)
    const { result } = renderHook(() => usePost('/items', decodeIdPayload))

    await expect(result.current.post({})).rejects.toThrow('Network down')
    // setError is a React state update — wait for it to flush
    await waitFor(() => { expect(result.current.error).toBeInstanceOf(Error); })
  })
})
