import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback, useId } from 'react'
import { segment, excludedWords } from '../glossary'

const GlossaryContext = createContext(null)

export function GlossaryProvider({ children }) {
  const [pop, setPop] = useState(null)
  const close = useCallback(() => setPop(null), [])

  const open = useCallback((entry) => {
    setPop(prev => (prev && prev.id === entry.id ? null : entry))
  }, [])

  useEffect(() => {
    if (!pop) return
    const onPointer = (e) => {
      if (!e.target.closest('[data-gloss]')) close()
    }
    const onKey = (e) => { if (e.key === 'Escape') close() }
    window.addEventListener('pointerdown', onPointer)
    window.addEventListener('scroll', close, { passive: true })
    window.addEventListener('resize', close)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onPointer)
      window.removeEventListener('scroll', close)
      window.removeEventListener('resize', close)
      window.removeEventListener('keydown', onKey)
    }
  }, [pop, close])

  const value = useMemo(() => ({ open, close, activeId: pop?.id }), [open, close, pop])

  return (
    <GlossaryContext.Provider value={value}>
      {children}
      {pop && <Bubble key={pop.id} entry={pop} />}
    </GlossaryContext.Provider>
  )
}

function Bubble({ entry }) {
  const ref = useRef(null)
  const [pos, setPos] = useState(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const { rect } = entry
    const w = el.offsetWidth
    const h = el.offsetHeight
    const vw = window.innerWidth
    const above = rect.top > h + 20
    const top = above ? rect.top - h - 10 : rect.bottom + 10
    const left = Math.min(Math.max(rect.left + rect.width / 2 - w / 2, 12), vw - w - 12)
    const arrow = Math.min(Math.max(rect.left + rect.width / 2 - left, 16), w - 16)
    setPos({ top, left, above, arrow })
  }, [entry])

  return (
    <div
      ref={ref}
      data-gloss
      role="tooltip"
      className="gloss-bubble fixed z-50 max-w-[min(280px,calc(100vw-24px))] rounded-2xl bg-charcoal text-cream px-4 py-3"
      style={{
        top: pos?.top ?? -9999,
        left: pos?.left ?? -9999,
        visibility: pos ? 'visible' : 'hidden',
        transformOrigin: pos ? `${pos.arrow}px ${pos.above ? '100%' : '0%'}` : 'center',
      }}
    >
      <span className="block text-[11px] uppercase tracking-[0.08em] text-cream/55 font-semibold">
        {entry.key}
      </span>
      <span className="block text-[15px] leading-snug font-medium mt-0.5">{entry.fr}</span>
      {pos && (
        <span
          aria-hidden
          className="absolute w-3 h-3 bg-charcoal rotate-45"
          style={{ left: pos.arrow - 6, [pos.above ? 'bottom' : 'top']: -5 }}
        />
      )}
    </div>
  )
}

// Texte anglais dont les mots du glossaire sont cliquables pour voir leur traduction.
// `exclude` : mots a ne pas traduire (les reponses tant que la question n'est pas corrigee).
export function TappableText({ text, exclude, className = '' }) {
  const ctx = useContext(GlossaryContext)
  const baseId = useId()
  const parts = useMemo(() => segment(text, excludedWords(exclude)), [text, exclude])
  if (!ctx) return <span className={className}>{text}</span>

  return (
    <span className={className}>
      {parts.map((p, i) => {
        if (!p.fr) return <span key={i}>{p.text}</span>
        const id = `${baseId}-${i}`
        const active = ctx.activeId === id
        const trigger = (el) => ctx.open({ id, key: p.key, fr: p.fr, rect: el.getBoundingClientRect() })
        return (
          <span
            key={i}
            data-gloss
            role="button"
            tabIndex={0}
            aria-label={`${p.text} : voir la traduction`}
            onClick={(e) => trigger(e.currentTarget)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); trigger(e.currentTarget) }
            }}
            className={`gloss-word ${active ? 'is-active' : ''}`}
          >
            {p.text}
          </span>
        )
      })}
    </span>
  )
}

export function GlossaryHint() {
  return (
    <p className="flex items-center gap-1.5 text-[12px] text-warm-gray mb-4">
      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.05 9.5A18 18 0 016.4 9m6.5 9H20M12 21l5-10 5 10M5 15c2-1.5 4-4 5-6" />
      </svg>
      Touche un mot souligné pour voir sa traduction
    </p>
  )
}
