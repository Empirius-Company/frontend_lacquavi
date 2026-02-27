import { useEffect, useRef, ReactNode, CSSProperties } from 'react'
import React from 'react'

/* ── useScrollReveal hook ─────────────────────────────────────── */
export function useScrollReveal(options?: IntersectionObserverInit) {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale')

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px', ...options }
    )

    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])
}

/* ── ScrollReveal component ───────────────────────────────────── */
interface ScrollRevealProps {
  children: ReactNode
  className?: string
  direction?: 'up' | 'left' | 'right' | 'scale'
  delay?: number
  style?: CSSProperties
  as?: keyof JSX.IntrinsicElements
}

export function ScrollReveal({
  children,
  className = '',
  direction = 'up',
  delay = 0,
  style,
  as: Tag = 'div',
}: ScrollRevealProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.transitionDelay = `${delay}ms`
          el.classList.add('is-visible')
          observer.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -32px 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [delay])

  const classMap = {
    up:    'reveal',
    left:  'reveal-left',
    right: 'reveal-right',
    scale: 'reveal-scale',
  }

  return React.createElement(
    Tag as string,
    { ref, className: `${classMap[direction]} ${className}`, style },
    children
  )
}

/* ── Staggered children ────────────────────────────────────────── */
interface StaggerProps {
  children: ReactNode[]
  className?: string
  baseDelay?: number
  stagger?: number
  direction?: 'up' | 'left' | 'right' | 'scale'
}

export function StaggerReveal({
  children,
  className = '',
  baseDelay = 0,
  stagger = 80,
  direction = 'up',
}: StaggerProps) {
  return (
    <>
      {React.Children.map(children, (child, i) => (
        <ScrollReveal
          key={i}
          delay={baseDelay + i * stagger}
          direction={direction}
          className={className}
        >
          {child}
        </ScrollReveal>
      ))}
    </>
  )
}
