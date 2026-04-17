import { useEffect, useRef, useState } from 'react'

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

export function useAnimatedValue(
  target: number,
  duration = 1200,
  onlyOnMount = false
): number {
  const [displayed, setDisplayed] = useState(onlyOnMount ? 0 : target)
  const startRef  = useRef<number | null>(null)
  const fromRef   = useRef(onlyOnMount ? 0 : target)
  const targetRef = useRef(target)
  const rafRef    = useRef<number>(0)

  useEffect(() => {
    const from = fromRef.current
    const to   = target
    targetRef.current = to
    startRef.current  = null

    const animate = (ts: number) => {
      if (startRef.current === null) startRef.current = ts
      const elapsed  = ts - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      const value    = from + (to - from) * easeOut(progress)
      setDisplayed(Math.round(value * 100) / 100)
      if (progress < 1) rafRef.current = requestAnimationFrame(animate)
      else fromRef.current = to
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration])

  return displayed
}
