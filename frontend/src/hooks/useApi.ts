import { useState, useEffect } from 'react'
import { type FetchState, type PostState } from '../types'

export function useFetch<T>(url: string): FetchState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    fetch('/api/v1' + url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<T>
      })
      .then((d) => {
        if (!cancelled) {
          setData(d)
          setError(null)
        }
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [url])

  return { data, loading, error }
}

export function usePost<TBody, TResponse>(url: string): PostState<TBody, TResponse> {
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
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const data: TResponse = await r.json()
      return data
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e))
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { post, loading, error }
}
