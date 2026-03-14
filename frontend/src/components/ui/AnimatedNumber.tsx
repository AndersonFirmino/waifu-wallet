import { useState, useEffect, useRef } from 'react'

interface AnimatedNumberProps {
  value: number
  duration?: number
  formatter?: (n: number) => string
}

export default function AnimatedNumber({ value, duration = 600, formatter }: AnimatedNumberProps) {
  const isMount = useRef(true)
  const [displayed, setDisplayed] = useState(value)
  const prevRef = useRef(value)
  const rafRef = useRef(0)

  useEffect(() => {
    let from: number
    if (isMount.current) {
      from = 0
      isMount.current = false
    } else {
      from = prevRef.current
    }

    const to = value
    prevRef.current = value

    if (from === to) return

    const start = performance.now()

    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(from + (to - from) * eased)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(animate)

    return () => { cancelAnimationFrame(rafRef.current) }
  }, [value, duration])

  return <span>{formatter ? formatter(displayed) : String(Math.round(displayed))}</span>
}
