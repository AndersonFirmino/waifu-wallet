import { useState, useEffect } from 'react'
import { type FetchState, type PostState } from '../types'

export function useFetch<T>(url: string, decode: (raw: unknown) => T): FetchState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    const doFetch = async (): Promise<void> => {
      setLoading(true)
      try {
        const r = await fetch('/api/v1' + url)
        if (!r.ok) throw new Error(`HTTP ${String(r.status)}`)
        const raw: unknown = await r.json()
        if (!cancelled) {
          setData(decode(raw))
          setError(null)
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e : new Error(String(e)))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void doFetch()

    return () => {
      cancelled = true
    }
  }, [url, decode])

  return { data, loading, error }
}

export function usePost<TBody, TResponse>(
  url: string,
  decode: (raw: unknown) => TResponse,
): PostState<TBody, TResponse> {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const post = async (body: TBody): Promise<TResponse> => {
    setLoading(true)
    setError(null)
    try {
      const r = await fetch('/api/v1' + url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!r.ok) throw new Error(`HTTP ${String(r.status)}`)
      const raw: unknown = await r.json()
      return decode(raw)
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e))
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { post, loading, error }
}
