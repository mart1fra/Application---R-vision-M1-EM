import { TappableText } from './Glossary'

export const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal'

export function PrimaryButton({ color, children, className = '', ...props }) {
  return (
    <button
      {...props}
      className={`w-full rounded-xl py-4 text-[16px] font-semibold text-white
                  transition-[transform,opacity] duration-150 ease-out
                  hover:opacity-90 active:scale-[0.97]
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
                  ${focusRing} ${className}`}
      style={{ background: color }}
    >
      {children}
    </button>
  )
}

export function GhostButton({ children, className = '', ...props }) {
  return (
    <button
      {...props}
      className={`rounded-xl py-3 px-4 text-[14px] font-semibold text-warm-gray bg-white border border-sand
                  transition-[transform,opacity] duration-150 ease-out
                  hover:opacity-80 active:scale-[0.97] ${focusRing} ${className}`}
    >
      {children}
    </button>
  )
}

// Liste de choix (QCM). Apres correction, chaque mauvais choix affiche sa note "pourquoi c'est faux".
export function ChoiceList({ choices, answer, selected, answered, onPick, notes, english }) {
  return (
    <div className="flex flex-col gap-3">
      {choices.map((choice, i) => {
        const isAnswer = choice === answer
        const isPicked = choice === selected
        let tone = 'bg-white border-sand text-charcoal hover:border-warm-gray/40'
        let badge = 'bg-sand/70 text-warm-gray'
        if (answered) {
          if (isAnswer) { tone = 'bg-success-light border-success/30 text-success'; badge = 'bg-success text-white' }
          else if (isPicked) { tone = 'bg-error-light border-error/30 text-error'; badge = 'bg-error text-white' }
          else { tone = 'bg-white border-sand text-charcoal/55' }
        }
        const note = answered && notes?.[choice]
        return (
          <button
            key={choice}
            onClick={() => onPick(choice)}
            disabled={answered}
            className={`w-full text-left rounded-xl p-4 border text-[16px] font-medium
                        transition-transform duration-150 ease-out active:scale-[0.98]
                        disabled:cursor-default disabled:active:scale-100
                        ${focusRing} ${tone}`}
          >
            <span className="flex items-start gap-3">
              <span className={`flex items-center justify-center w-8 h-8 rounded-lg text-[13px] font-bold shrink-0 ${badge}`}>
                {answered && isAnswer ? '✓' : answered && isPicked ? '✗' : String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1 min-w-0 pt-1">
                <span className="block leading-snug" lang={english ? 'en' : undefined}>{choice}</span>
                {note && (
                  <span className="pop-in block text-[13px] font-normal text-charcoal/65 mt-1.5 leading-relaxed">
                    {note}
                  </span>
                )}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

const FEEDBACK = {
  correct: { box: 'bg-success-light border-success/20', title: 'text-success', label: 'Bonne réponse !' },
  typo: { box: 'bg-success-light border-success/20', title: 'text-success', label: 'Bonne réponse (attention à l’orthographe)' },
  wrong: { box: 'bg-error-light border-error/20', title: 'text-error', label: 'Mauvaise réponse' },
  neutral: { box: 'bg-white border-sand', title: 'text-charcoal', label: 'Correction' },
}

export function FeedbackCard({ status, title, children }) {
  const s = FEEDBACK[status]
  return (
    <div className={`pop-in mt-6 rounded-xl p-4 border ${s.box}`}>
      <p className={`font-semibold text-[15px] mb-1 ${s.title}`}>{title || s.label}</p>
      <div className="text-[14px] text-charcoal/75 leading-relaxed space-y-2">{children}</div>
    </div>
  )
}

// Phrase anglaise avec un trou "___". `fill` = mot affiche dans le trou apres correction.
export function GapSentence({ text, fill, fillTone, exclude, translatable, active = true }) {
  const pieces = text.split('___')
  return (
    <span>
      {pieces.map((piece, i) => (
        <span key={i}>
          {translatable ? <TappableText text={piece} exclude={exclude} /> : piece}
          {i < pieces.length - 1 && (
            fill
              ? <span className={`font-semibold px-1 rounded ${fillTone}`}>{fill}</span>
              : <span className={`inline-block w-20 align-baseline border-b-2 border-dashed mx-1 ${active ? 'border-anglais/50' : 'border-warm-gray/40'}`}>&nbsp;</span>
          )}
        </span>
      ))}
    </span>
  )
}

// Phrase avec un passage souligne [[...]] (exercices "replace the underlined phrase").
export function UnderlinedSentence({ text, exclude, translatable, replacement, replacementTone }) {
  const match = text.match(/^(.*)\[\[(.+?)\]\](.*)$/s)
  if (!match) return translatable ? <TappableText text={text} exclude={exclude} /> : text
  const [, before, underlined, after] = match
  const render = (t) => (translatable ? <TappableText text={t} exclude={exclude} /> : t)
  return (
    <span>
      {render(before)}
      {replacement ? (
        <>
          <span className="line-through decoration-warm-gray/60 text-warm-gray">{underlined}</span>{' '}
          <span className={`font-semibold px-1 rounded ${replacementTone}`}>{replacement}</span>
        </>
      ) : (
        <span className="underline decoration-2 underline-offset-4 decoration-anglais">{render(underlined)}</span>
      )}
      {render(after)}
    </span>
  )
}

export function TextAnswer({ value, onChange, onSubmit, disabled, color, placeholder = 'Ta réponse...', inputRef }) {
  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      onKeyDown={e => { if (e.key === 'Enter') onSubmit() }}
      disabled={disabled}
      placeholder={placeholder}
      className="w-full rounded-xl border border-sand bg-white px-4 py-4 text-[16px]
                 placeholder:text-warm-gray/40
                 focus:outline-2 focus:outline-offset-0 focus:border-transparent
                 disabled:bg-sand/30"
      style={{ outlineColor: color }}
      autoComplete="off"
      autoCapitalize="off"
      autoCorrect="off"
      spellCheck={false}
    />
  )
}

export function HintButton({ hint, shown, onShow }) {
  if (!hint) return null
  if (shown) {
    return (
      <p className="pop-in mt-3 text-[14px] text-charcoal/75 bg-sand/60 rounded-xl px-4 py-3">
        <span className="font-semibold">Indice : </span>{hint}
      </p>
    )
  }
  return (
    <button
      onClick={onShow}
      className={`mt-3 text-[13px] font-semibold text-warm-gray underline underline-offset-4
                  hover:text-charcoal active:opacity-60 transition-opacity rounded ${focusRing}`}
    >
      Afficher un indice
    </button>
  )
}

export function BackButton({ onClick, label = 'Quitter' }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 text-warm-gray text-[14px] rounded
                  hover:text-charcoal active:opacity-60 transition-opacity ${focusRing}`}
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      {label}
    </button>
  )
}

export function ProgressBar({ value, color }) {
  return (
    <div className="h-1.5 bg-sand rounded-full overflow-hidden">
      <div
        className="h-full w-full rounded-full origin-left transition-transform duration-500 ease-out"
        style={{ transform: `scaleX(${value})`, background: color }}
      />
    </div>
  )
}

export function TypeBadge({ color, children }) {
  return (
    <span
      className="inline-block text-[11px] font-semibold uppercase tracking-[0.08em] px-2.5 py-1 rounded-full"
      style={{ color, background: `color-mix(in srgb, ${color} 10%, transparent)` }}
    >
      {children}
    </span>
  )
}
