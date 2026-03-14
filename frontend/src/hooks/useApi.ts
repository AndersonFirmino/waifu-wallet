import { useState, useEffect, useRef, useCallback } from 'react'
import { type FetchState, type PostState } from '../types'

const DEFAULT_POLL_INTERVAL = 3000

export function useFetch<T>(
  url: string,
  decode: (raw: unknown) => T,
  pollInterval: number = DEFAULT_POLL_INTERVAL,
): FetchState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const isFirstFetch = useRef(true)

  const stableDecode = useCallback(decode, [decode])

  useEffect(() => {
    let cancelled = false
    isFirstFetch.current = true

    const doFetch = async (): Promise<void> => {
      const isFirst = isFirstFetch.current
      if (isFirst) {
        setLoading(true)
      } else {
        setRefreshing(true)
      }

      try {
        const r = await fetch('/api/v1' + url)
        if (!r.ok) throw new Error(`HTTP ${String(r.status)}`)
        const raw: unknown = await r.json()
        if (!cancelled) {
          setData(stableDecode(raw))
          setError(null)
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e : new Error(String(e)))
        }
      } finally {
        if (!cancelled) {
          if (isFirst) {
            setLoading(false)
          } else {
            setRefreshing(false)
          }
          isFirstFetch.current = false
        }
      }
    }

    void doFetch()

    const intervalId = pollInterval > 0
      ? window.setInterval(() => { void doFetch() }, pollInterval)
      : undefined

    return () => {
      cancelled = true
      if (intervalId !== undefined) window.clearInterval(intervalId)
    }
  }, [url, stableDecode, pollInterval])

  return { data, loading, error, refreshing }
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
