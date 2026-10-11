import { useState, useRef, useEffect, useMemo } from 'react'
import { shuffle, gradeAnswer, KIND_LABEL } from '../utils'
import { MEMOS } from '../data'
import { TappableText, GlossaryHint } from './Glossary'
import {
  ChoiceList, FeedbackCard, GapSentence, UnderlinedSentence, TextAnswer, HintButton, BackButton,
  ProgressBar, TypeBadge, PrimaryButton, GhostButton, focusRing,
} from './ui'

const PLAYERS = {
  cloze: StepPlayer, choice: StepPlayer, bank: StepPlayer, gaps: StepPlayer,
  write: WritePlayer, match: MatchPlayer, open: OpenPlayer, reading: ReadingPlayer, order: OrderPlayer,
}

export default function Devoir({ devoir, matiere, onFinish, onBack }) {
  const Player = PLAYERS[devoir.kind]
  return (
    <div className="px-5 pt-6 pb-8 flex flex-col min-h-screen">
      <Player devoir={devoir} matiere={matiere} onFinish={onFinish} onBack={onBack} />
    </div>
  )
}

function Header({ devoir, matiere, onBack, step, total }) {
  const [showFr, setShowFr] = useState(false)
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <BackButton onClick={onBack} label="Devoirs" />
        {total > 1 && <span className="text-[14px] text-warm-gray font-medium tabular-nums">{Math.min(step + 1, total)} / {total}</span>}
      </div>
      <div className="mb-6">
        <ProgressBar value={step / total} color={matiere.color} />
      </div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <TypeBadge color={matiere.color}>{KIND_LABEL[devoir.kind]}</TypeBadge>
        <span className="text-[11px] text-warm-gray/80">{devoir.doc} · p. {devoir.page}</span>
        {devoir.bonus && (
          <span className="text-[11px] font-semibold text-systeme bg-systeme/10 px-2 py-0.5 rounded-full">Variante bonus</span>
        )}
      </div>
      <h1 className="font-display font-bold text-[22px] leading-tight tracking-[-0.03em] text-charcoal" lang="en">
        {devoir.title}
      </h1>
      <div className="mt-2 mb-5">
        <p className="text-[14px] text-charcoal/75 leading-relaxed" lang="en">
          <TappableText text={devoir.instructions} />
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
          {!showFr && (
            <button
              onClick={() => setShowFr(true)}
              className={`text-[12px] font-semibold text-warm-gray underline underline-offset-4 rounded
                          hover:text-charcoal active:opacity-60 transition-opacity ${focusRing}`}
            >
              Consigne en français
            </button>
          )}
          {devoir.memo && <Memo memo={devoir.memo} />}
        </div>
        {showFr && <p className="pop-in text-[13px] text-warm-gray leading-relaxed mt-1.5">🇫🇷 {devoir.instructionsFr}</p>}
      </div>
    </>
  )
}

// Rappel du cours (ex. la page 5 a laquelle renvoient les exercices "in A opposite")
function Memo({ memo }) {
  const [open, setOpen] = useState(false)
  const source = MEMOS[memo.ref]
  const sections = source.sections.filter(s => !memo.sections || memo.sections.includes(s.id))
  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className={`text-[12px] font-semibold text-anglais underline underline-offset-4 rounded
                    hover:opacity-80 active:opacity-60 transition-opacity ${focusRing}`}
      >
        {open ? 'Masquer le rappel du cours' : `Rappel du cours (${source.label})`}
      </button>
      {open && (
        <div className="pop-in basis-full mt-3 rounded-2xl bg-white border border-sand px-4 py-4 space-y-4 elevated" lang="en">
          {sections.map(s => (
            <div key={s.id}>
              <p className="font-display font-bold text-[16px] text-charcoal">{s.heading}</p>
              {s.intro && <p className="text-[13px] text-charcoal/70 leading-relaxed mt-1"><TappableText text={s.intro} /></p>}
              {s.entries && (
                <ul className="mt-2 space-y-1.5">
                  {s.entries.map(e => (
                    <li key={e.term} className="text-[13px] leading-relaxed text-charcoal/80">
                      <span className="font-semibold text-charcoal">{e.term}</span>
                      {e.def && <> – <TappableText text={e.def} /></>}
                    </li>
                  ))}
                </ul>
              )}
              {s.text && <p className="text-[13px] text-charcoal/80 leading-relaxed mt-1 whitespace-pre-line"><TappableText text={s.text} /></p>}
              {s.fr && <p className="text-[12px] text-warm-gray leading-relaxed mt-2" lang="fr">🇫🇷 {s.fr}</p>}
            </div>
          ))}
        </div>
      )}
    </>
  )
}

function useFocusOnAnswer(answered) {
  const ref = useRef(null)
  useEffect(() => { if (answered) ref.current?.focus() }, [answered])
  return ref
}

function Translation({ text }) {
  if (!text) return null
  return (
    <p className="text-charcoal/70 border-l-2 border-charcoal/15 pl-3">
      <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-warm-gray block">Traduction</span>
      {text}
    </p>
  )
}

/* ------------------------------------------------------------------ */
/* Pas a pas : choix A/B/C (cloze, choice), banque de mots (bank)       */
/* ou mot a ecrire (gaps), avec ou sans texte commun a trous            */
/* ------------------------------------------------------------------ */

const answerOf = (it) => it.answer ?? it.answers[0]

function Passage({ devoir, items, outcomes, current, answered, exclude }) {
  const parts = devoir.passage.split(/\{(\d+)\}/)
  return (
    <div className="elevated rounded-2xl bg-white border border-sand px-5 py-4 mb-6" lang="en">
      {devoir.passageTitle && (
        <p className="font-display italic text-[14px] text-warm-gray mb-2 leading-snug">
          <TappableText text={devoir.passageTitle} exclude={exclude} />
        </p>
      )}
      <p className="text-[15px] leading-[1.9] text-charcoal whitespace-pre-line">
        {parts.map((part, k) => {
          if (k % 2 === 0) return <TappableText key={k} text={part} exclude={exclude} />
          const gi = Number(part) - 1
          const done = gi < current || (gi === current && answered)
          if (done) {
            const o = outcomes[gi]
            return (
              <span key={k} className="whitespace-nowrap">
                <span className="text-[11px] text-warm-gray align-super mr-0.5">{gi + 1}</span>
                {!o.correct && <span className="line-through text-error/70 mr-1">{o.given}</span>}
                <span className="font-semibold text-success bg-success-light px-1 rounded">
                  {o.correct ? o.given : answerOf(items[gi])}
                </span>
              </span>
            )
          }
          const active = gi === current
          return (
            <span
              key={k}
              className={`inline-flex items-center justify-center min-w-16 mx-0.5 px-1.5 rounded-md text-[12px] font-bold align-baseline
                          ${active ? 'gap-active bg-anglais text-white' : 'bg-sand text-warm-gray'}`}
            >
              {gi + 1}
            </span>
          )
        })}
      </p>
    </div>
  )
}

// Banque de mots : puces cliquables. Les mots deja places sont grises (mais restent cliquables).
function BankChips({ bank, letters, answer, accept, picked, answered, used, onPick }) {
  return (
    <div className="flex flex-wrap gap-2">
      {bank.map((term, i) => {
        const isAnswer = term === answer || accept?.includes(term)
        const isPicked = term === picked
        let tone = 'bg-white border-sand text-charcoal hover:border-warm-gray/40'
        if (answered && isAnswer && (term === answer || isPicked)) tone = 'bg-success text-white border-success'
        else if (answered && isPicked) tone = 'bg-error text-white border-error'
        else if (used.includes(term)) tone = 'bg-sand/50 border-transparent text-warm-gray/70'
        else if (answered) tone = 'bg-white border-sand text-charcoal/50'
        return (
          <button
            key={term}
            onClick={() => onPick(term)}
            disabled={answered}
            lang="en"
            className={`rounded-full border px-3.5 py-2 text-[14px] font-medium leading-tight
                        transition-transform duration-150 ease-out active:scale-95 disabled:active:scale-100 disabled:cursor-default
                        ${focusRing} ${tone}`}
          >
            {letters && <span className="font-bold mr-1.5 opacity-70">{String.fromCharCode(65 + i)}</span>}
            {term}
            {used.includes(term) && !answered && <span className="ml-1.5 text-[11px]">✓</span>}
          </button>
        )
      })}
    </div>
  )
}

const STEP_PROMPT = {
  cloze: 'choisis le mot qui convient',
  bank: 'choisis le mot dans la banque',
  gaps: 'écris le mot qui manque',
}

function StepPlayer({ devoir, matiere, onFinish, onBack }) {
  const mode = devoir.kind === 'bank' ? 'bank' : devoir.kind === 'gaps' ? 'type' : 'choice'
  const [items] = useState(() => {
    const list = devoir.shuffleItems ? shuffle(devoir.items) : devoir.items
    return list.map(it => (it.choices && !devoir.keepOrder ? { ...it, choices: shuffle(it.choices) } : it))
  })
  const [current, setCurrent] = useState(0)
  const [outcomes, setOutcomes] = useState([]) // { given, correct, typo, closest } par item
  const [value, setValue] = useState('')
  const [hintShown, setHintShown] = useState(false)
  const outcome = outcomes[current]
  const answered = outcome !== undefined
  const nextRef = useFocusOnAnswer(answered)

  const it = items[current]
  const accepted = it.answers || [it.answer, ...(it.accept || [])]
  const used = items.slice(0, current).map(answerOf)
  const hasPassage = Boolean(devoir.passage)

  // Tant qu'un trou n'est pas corrige, ses reponses (et choix) ne sont pas traduisibles
  const exclude = useMemo(() => items.flatMap((x, i) => (
    i > current || (i === current && !answered) ? [...(x.choices || []), ...(x.answers || []), x.answer, ...(devoir.bank || [])].filter(Boolean) : []
  )), [items, current, answered, devoir.bank])

  const record = (o) => setOutcomes(prev => { const n = [...prev]; n[current] = o; return n })

  const pick = (choice) => {
    if (answered) return
    record({ given: choice, correct: accepted.includes(choice) })
  }

  const submit = () => {
    if (answered || !value.trim()) return
    const g = gradeAnswer(value, it.answers)
    record({ given: value.trim(), correct: g.correct, typo: g.typo, closest: g.closest })
  }

  const next = () => {
    if (current + 1 >= items.length) {
      onFinish(items.map((x, i) => ({
        question: x.answers
          ? { question: x.sentence || x.text, type: 'free', answers: x.answers }
          : { question: x.sentence || x.text, type: 'qcm', answer: x.answer },
        correct: outcomes[i].correct,
        userAnswer: outcomes[i].given,
      })))
      return
    }
    setCurrent(c => c + 1)
    setValue('')
    setHintShown(false)
  }

  const status = !answered ? null : outcome.typo ? 'typo' : outcome.correct ? 'correct' : 'wrong'

  return (
    <>
      <Header devoir={devoir} matiere={matiere} onBack={onBack} step={current} total={items.length} />
      {!answered && <GlossaryHint />}

      {hasPassage && (
        <Passage devoir={devoir} items={items} outcomes={outcomes} current={current} answered={answered} exclude={exclude} />
      )}

      {hasPassage ? (
        <p className="text-[14px] text-warm-gray font-medium mb-3">
          <span className="font-bold text-anglais">Trou n° {current + 1}</span> : {devoir.prompt || STEP_PROMPT[devoir.kind]}
        </p>
      ) : (
        <div className="mb-5">
          <p className="text-[14px] text-warm-gray font-medium mb-2">{devoir.prompt || 'Choisis la bonne réponse'}</p>
          {it.sentence ? (
            <h2 lang="en" className="font-display font-bold text-[19px] leading-[1.6] tracking-[-0.02em] text-charcoal">
              <GapSentence
                text={it.sentence}
                fill={answered ? answerOf(it) : null}
                fillTone="bg-success-light text-success"
                exclude={exclude}
                translatable
              />
            </h2>
          ) : (
            <div className="elevated rounded-2xl bg-white border border-sand px-5 py-4">
              <span className="text-[12px] font-bold text-warm-gray">{devoir.keepOrder ? `${current + 1}.` : 'Définition'}</span>
              <p lang="en" className="font-display text-[19px] leading-[1.5] tracking-[-0.01em] text-charcoal mt-1">
                <TappableText text={it.text} exclude={exclude} />
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex-1">
        {mode === 'choice' && (
          <ChoiceList
            choices={it.choices}
            answer={it.answer}
            selected={outcome?.given}
            answered={answered}
            onPick={pick}
            notes={it.notes}
            english
          />
        )}
        {mode === 'bank' && (
          <BankChips
            bank={devoir.bank}
            letters={devoir.bankLetters}
            answer={it.answer}
            accept={it.accept}
            picked={outcome?.given}
            answered={answered}
            used={used}
            onPick={pick}
          />
        )}
        {mode === 'type' && (
          <>
            <TextAnswer
              value={answered ? outcome.given : value}
              onChange={setValue}
              onSubmit={submit}
              disabled={answered}
              color={matiere.color}
              placeholder={it.placeholder || 'Ta réponse…'}
            />
            {!answered && (
              <>
                <HintButton hint={it.hint} shown={hintShown} onShow={() => setHintShown(true)} />
                <div className="flex gap-3 mt-4">
                  <GhostButton onClick={() => record({ given: '—', correct: false })} className="shrink-0">Je ne sais pas</GhostButton>
                  <PrimaryButton color={matiere.color} onClick={submit} disabled={!value.trim()}>Valider</PrimaryButton>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {answered && (
        <FeedbackCard status={status}>
          {!outcome.correct && <p>Réponse correcte : <strong lang="en">{accepted.join(' / ')}</strong></p>}
          {outcome.typo && <p>Orthographe exacte : <strong lang="en">{outcome.closest}</strong></p>}
          <p>{it.explanation}</p>
          <Translation text={it.translation} />
        </FeedbackCard>
      )}

      {answered && (
        <PrimaryButton ref={nextRef} color={matiere.color} onClick={next} className="mt-4">
          {current + 1 >= items.length ? 'Voir le score' : hasPassage ? 'Trou suivant' : 'Question suivante'}
        </PrimaryButton>
      )}
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Mot ou expression a ecrire                                          */
/* ------------------------------------------------------------------ */

function WritePlayer({ devoir, matiere, onFinish, onBack }) {
  const items = devoir.items
  const [current, setCurrent] = useState(0)
  const [value, setValue] = useState('')
  const [grade, setGrade] = useState(null)
  const [hintShown, setHintShown] = useState(false)
  const [results, setResults] = useState([])
  const answered = grade !== null
  const nextRef = useFocusOnAnswer(answered)

  const it = items[current]
  const plain = it.sentence.replace(/\[\[|\]\]/g, '')

  const finishItem = (g, userAnswer) => {
    setGrade(g)
    setResults(r => [...r, { question: { question: plain, type: 'free', answers: it.answers }, correct: g.correct, userAnswer }])
  }

  const submit = () => {
    if (answered || !value.trim()) return
    finishItem(gradeAnswer(value, it.answers), value)
  }

  const next = () => {
    if (current + 1 >= items.length) { onFinish(results); return }
    setCurrent(c => c + 1)
    setValue('')
    setGrade(null)
    setHintShown(false)
  }

  return (
    <>
      <Header devoir={devoir} matiere={matiere} onBack={onBack} step={current} total={items.length} />
      {!answered && <GlossaryHint />}

      <div className="elevated rounded-2xl bg-white border border-sand px-5 py-4 mb-5">
        <span className="text-[12px] font-bold text-warm-gray">{current + 1}.</span>
        <p lang="en" className="font-display text-[19px] leading-[1.6] tracking-[-0.01em] text-charcoal mt-1">
          <UnderlinedSentence
            text={it.sentence}
            exclude={answered ? undefined : it.answers}
            translatable
            replacement={answered ? it.answers[0] : null}
            replacementTone="bg-success-light text-success"
          />
        </p>
      </div>

      <div className="flex-1">
        <p className="text-[13px] text-warm-gray mb-2">Par quoi remplacer le passage souligné ?</p>
        <TextAnswer value={value} onChange={setValue} onSubmit={submit} disabled={answered} color={matiere.color} />
        {!answered && (
          <>
            <HintButton hint={it.hint} shown={hintShown} onShow={() => setHintShown(true)} />
            <div className="flex gap-3 mt-4">
              <GhostButton onClick={() => finishItem({ correct: false, typo: false }, '—')} className="shrink-0">
                Je ne sais pas
              </GhostButton>
              <PrimaryButton color={matiere.color} onClick={submit} disabled={!value.trim()}>Valider</PrimaryButton>
            </div>
          </>
        )}
      </div>

      {answered && (
        <FeedbackCard status={grade.typo ? 'typo' : grade.correct ? 'correct' : 'wrong'}>
          {!grade.correct && (
            <p>
              {it.answers.length === 1
                ? <>Réponse attendue : <strong lang="en">{it.answers[0]}</strong></>
                : <>Réponses acceptées : <strong lang="en">{it.answers.join(' / ')}</strong></>}
            </p>
          )}
          {grade.typo && <p>Orthographe exacte : <strong lang="en">{grade.closest}</strong></p>}
          <p>{it.explanation}</p>
        </FeedbackCard>
      )}

      {answered && (
        <PrimaryButton ref={nextRef} color={matiere.color} onClick={next} className="mt-4">
          {current + 1 >= items.length ? 'Voir le score' : 'Phrase suivante'}
        </PrimaryButton>
      )}
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Associer (draw a line to connect)                                   */
/* ------------------------------------------------------------------ */

const PAIR_COLORS = ['#1a5276', '#b9770e', '#117a65', '#922b21', '#6c3483', '#5b6770', '#2e7d6b', '#8a5a1f']

// Texte de reference avec passages soulignes [[...]] (ex. l'offre d'emploi de l'exercice 3.1)
function ReferenceText({ title, text }) {
  const parts = text.split(/\[\[(.+?)\]\]/)
  return (
    <div className="elevated rounded-2xl bg-white border border-sand px-5 py-4 mb-6" lang="en">
      {title && <p className="font-display font-bold text-[16px] text-charcoal mb-2 leading-snug">{title}</p>}
      <p className="text-[14px] leading-[1.8] text-charcoal/90 whitespace-pre-line">
        {parts.map((p, i) => (i % 2
          ? <span key={i} className="underline decoration-2 underline-offset-4 decoration-anglais font-medium">{p}</span>
          : <TappableText key={i} text={p} />))}
      </p>
    </div>
  )
}

function MatchPlayer({ devoir, matiere, onFinish, onBack }) {
  const items = devoir.items
  const [rights] = useState(() => (devoir.keepOrder ? devoir.right : shuffle(items.map(i => i.right))))
  const [selected, setSelected] = useState(0)
  const [links, setLinks] = useState({}) // index gauche -> texte droite
  const [checked, setChecked] = useState(false)
  const [showFr, setShowFr] = useState(false)
  const nextRef = useFocusOnAnswer(checked)
  const rightFr = Object.fromEntries(items.map(it => [it.right, it.rightFr]))

  const linkedBy = (right) => Object.keys(links).find(l => links[l] === right)
  const allLinked = Object.keys(links).length === items.length

  // Toucher un debut de phrase le selectionne (et defait sa paire s'il en avait une).
  // Pas d'effet bascule : la phrase suivante est preselectionnee apres chaque paire.
  const tapLeft = (i) => {
    if (checked) return
    if (links[i] !== undefined) {
      setLinks(({ [i]: _removed, ...rest }) => rest)
    }
    setSelected(i)
  }

  const tapRight = (right) => {
    if (checked) return
    const owner = linkedBy(right)
    if (selected === null) {
      if (owner !== undefined) setLinks(({ [owner]: _removed, ...rest }) => rest)
      return
    }
    setLinks(prev => {
      const n = { ...prev }
      if (owner !== undefined) delete n[owner]
      n[selected] = right
      return n
    })
    // passe automatiquement a la prochaine proposition non reliee
    const nextFree = items.findIndex((_, k) => k !== selected && links[k] === undefined && k > selected)
    const firstFree = items.findIndex((_, k) => k !== selected && links[k] === undefined)
    setSelected(nextFree !== -1 ? nextFree : firstFree !== -1 ? firstFree : null)
  }

  const finish = () => onFinish(items.map((it, i) => ({
    question: { question: `${it.left} …`, type: 'qcm', answer: it.right },
    correct: links[i] === it.right,
    userAnswer: links[i],
  })))

  const score = items.filter((it, i) => links[i] === it.right).length

  return (
    <>
      <Header devoir={devoir} matiere={matiere} onBack={onBack} step={checked ? 1 : 0} total={1} />
      {devoir.passage && <ReferenceText title={devoir.passageTitle} text={devoir.passage} />}
      {!checked && (
        <div className="flex items-start justify-between gap-3 mb-4">
          <p className="text-[13px] text-warm-gray leading-relaxed">
            Touche un élément à gauche, puis celui qui lui correspond. Touche une paire pour la défaire.
          </p>
          <button
            onClick={() => setShowFr(s => !s)}
            aria-pressed={showFr}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold border
                        transition-transform duration-150 ease-out active:scale-95 ${focusRing}
                        ${showFr ? 'bg-anglais text-white border-anglais' : 'bg-white text-warm-gray border-sand hover:border-warm-gray/40'}`}
          >
            {showFr ? 'Masquer FR' : 'Traduction FR'}
          </button>
        </div>
      )}
      <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-warm-gray mb-2">{devoir.leftLabel}</p>
      <div className="flex flex-col gap-2.5 mb-6">
        {items.map((it, i) => {
          const color = PAIR_COLORS[i % PAIR_COLORS.length]
          const linked = links[i] !== undefined
          const isSel = selected === i
          const ok = checked && links[i] === it.right
          return (
            <div key={i}>
              <button
                onClick={() => tapLeft(i)}
                disabled={checked}
                className={`w-full text-left rounded-xl p-3.5 border text-[15px] leading-snug flex items-start gap-3
                            transition-transform duration-150 ease-out active:scale-[0.98] disabled:active:scale-100
                            ${focusRing}
                            ${checked ? (ok ? 'bg-success-light border-success/30' : 'bg-error-light border-error/30')
                              : isSel ? 'bg-white border-transparent elevated' : 'bg-white border-sand hover:border-warm-gray/40'}`}
                style={isSel && !checked ? { outline: `2px solid ${color}`, outlineOffset: 0 } : undefined}
              >
                <span
                  className="flex items-center justify-center w-7 h-7 rounded-lg text-[12px] font-bold shrink-0"
                  style={linked || isSel ? { background: color, color: '#fff' } : { background: '#f0ebe3', color: '#6b6560' }}
                >
                  {i + 1}
                </span>
                <span className="flex-1 min-w-0 pt-0.5" lang="en">
                  {it.left}
                  {showFr && !checked && <span className="block text-[12px] text-warm-gray mt-0.5" lang="fr">{it.leftFr}</span>}
                  {linked && !checked && (
                    <span className="block text-[13px] mt-1" style={{ color }}>→ {links[i]}</span>
                  )}
                </span>
              </button>
              {checked && (
                <div className="pop-in px-1 pt-2 text-[13px] leading-relaxed text-charcoal/75">
                  {ok ? (
                    <p><span className="text-success font-semibold">✓ {it.right}</span></p>
                  ) : (
                    <p>
                      <span className="text-error line-through mr-1">{links[i]}</span>
                      <span className="text-success font-semibold">→ {it.right}</span>
                    </p>
                  )}
                  <p className="mt-1">{it.explanation}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {!checked && (
        <>
          <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-warm-gray mb-2">{devoir.rightLabel}</p>
          {selected !== null && (
            <p
              className="pop-in text-[13px] leading-snug mb-3 rounded-lg px-3 py-2 bg-white border-l-4"
              style={{ borderColor: PAIR_COLORS[selected % PAIR_COLORS.length] }}
              key={selected}
            >
              <span className="text-warm-gray">Pour le n° {selected + 1} : </span>
              <span className="font-semibold text-charcoal" lang="en">{items[selected].left}{devoir.passage ? '' : ' …'}</span>
            </p>
          )}
          <div className="flex flex-col gap-2.5 flex-1">
            {rights.map((right) => {
              const owner = linkedBy(right)
              const color = owner !== undefined ? PAIR_COLORS[owner % PAIR_COLORS.length] : null
              return (
                <button
                  key={right}
                  onClick={() => tapRight(right)}
                  className={`w-full text-left rounded-xl p-3.5 border text-[15px] leading-snug flex items-start gap-3
                              transition-transform duration-150 ease-out active:scale-[0.98] ${focusRing}
                              ${owner !== undefined ? 'bg-sand/40 border-transparent' : 'bg-white border-sand hover:border-warm-gray/40'}`}
                >
                  <span
                    className="flex items-center justify-center w-7 h-7 rounded-lg text-[12px] font-bold shrink-0 border-2 border-dashed"
                    style={color ? { background: color, color: '#fff', borderColor: color } : { borderColor: '#d9d2c7', color: '#b5aca1' }}
                  >
                    {owner !== undefined ? Number(owner) + 1 : '•'}
                  </span>
                  <span className={`flex-1 min-w-0 pt-0.5 ${owner !== undefined ? 'text-charcoal/60' : 'text-charcoal'}`} lang="en">
                    {right}
                    {showFr && <span className="block text-[12px] text-warm-gray mt-0.5" lang="fr">{rightFr[right]}</span>}
                  </span>
                </button>
              )
            })}
          </div>
          <div className="flex gap-3 mt-6">
            <GhostButton onClick={() => { setLinks({}); setSelected(0) }} className="shrink-0">Tout effacer</GhostButton>
            <PrimaryButton color={matiere.color} onClick={() => setChecked(true)} disabled={!allLinked}>
              {allLinked ? 'Vérifier' : `Encore ${items.length - Object.keys(links).length} à relier`}
            </PrimaryButton>
          </div>
        </>
      )}

      {checked && (
        <>
          <FeedbackCard status={score === items.length ? 'correct' : 'neutral'} title={`${score} / ${items.length} bonnes associations`}>
            <p>{devoir.explanation}</p>
          </FeedbackCard>
          <PrimaryButton ref={nextRef} color={matiere.color} onClick={finish} className="mt-4">Voir le score</PrimaryButton>
        </>
      )}
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Phrases a completer librement (pas de reponse unique)               */
/* ------------------------------------------------------------------ */

const ED_OK = ['need', 'feed', 'proceed', 'succeed', 'exceed', 'speed', 'breed', 'seed', 'embed', 'shed', 'bleed', 'heed']

// Verifications simples de la structure "will + base verbale"
function checkWillClause(text) {
  const words = text.trim().toLowerCase().replace(/[^a-z'\s-]/g, ' ').split(/\s+/).filter(Boolean)
  const tips = []
  const first = words[0] || ''
  if (first === 'will') tips.push('Inutile de répéter « will » : il est déjà au début de la phrase.')
  else if (first === 'to') tips.push('Après « will », pas de « to » : on écrit « will listen », pas « will to listen ».')
  else if (['is', 'are', 'am', 'was', 'were'].includes(first)) tips.push('Après « will », le verbe être se dit « be » : « will be happier ».')
  else if (first.endsWith('ing') && first.length > 4) tips.push(`Après « will », le verbe reste à la base verbale : « will ${first.slice(0, -3)}… », pas « will ${first} ».`)
  else if (first.endsWith('ed') && !ED_OK.includes(first)) tips.push(`Pas de passé après « will » : « will + base verbale » (et non « will ${first} »).`)
  return tips
}

function OpenPlayer({ devoir, matiere, onFinish, onBack }) {
  const items = devoir.items
  const [current, setCurrent] = useState(0)
  const [value, setValue] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [results, setResults] = useState([])
  const nextRef = useFocusOnAnswer(submitted)

  const it = items[current]
  const tips = submitted ? checkWillClause(value) : []

  const assess = (ok) => {
    const all = [...results, { question: { question: `${it.start} …`, type: 'free', answers: [it.models[0]] }, correct: ok, userAnswer: `${it.start} ${value.trim()}` }]
    if (current + 1 >= items.length) { onFinish(all); return }
    setResults(all)
    setCurrent(c => c + 1)
    setValue('')
    setSubmitted(false)
  }

  return (
    <>
      <Header devoir={devoir} matiere={matiere} onBack={onBack} step={current} total={items.length} />

      <div className="elevated rounded-2xl bg-white border border-sand px-5 py-4 mb-4">
        <span className="text-[12px] font-bold text-warm-gray">{current + 1}.</span>
        <p lang="en" className="font-display text-[19px] leading-[1.6] text-charcoal mt-1">
          <TappableText text={it.start} /> <span className="text-warm-gray/70">…</span>
        </p>
      </div>

      <div className="flex-1">
        <textarea
          value={value}
          onChange={e => setValue(e.target.value)}
          disabled={submitted}
          rows={3}
          lang="en"
          placeholder="Termine la phrase en anglais…"
          className="w-full rounded-xl border border-sand bg-white px-4 py-3.5 text-[16px] leading-relaxed resize-none
                     placeholder:text-warm-gray/40
                     focus:outline-2 focus:outline-offset-0 focus:border-transparent disabled:bg-sand/30"
          style={{ outlineColor: matiere.color }}
          autoCapitalize="off"
          spellCheck={false}
        />
        {!submitted && (
          <PrimaryButton color={matiere.color} onClick={() => setSubmitted(true)} disabled={!value.trim()} className="mt-4">
            Voir la correction
          </PrimaryButton>
        )}
      </div>

      {submitted && (
        <>
          <FeedbackCard status="neutral" title="Compare avec la correction">
            {tips.length > 0 ? (
              <div className="rounded-lg bg-error-light px-3 py-2 text-error">
                {tips.map(t => <p key={t}>⚠ {t}</p>)}
              </div>
            ) : (
              <p className="text-success font-medium">✓ La structure « will + base verbale » a l’air respectée.</p>
            )}
            <p className="font-semibold text-charcoal mt-2">Exemples de bonnes réponses :</p>
            <ul className="space-y-1.5" lang="en">
              {it.models.map(m => (
                <li key={m} className="italic border-l-2 border-success/40 pl-3">
                  {it.start} <TappableText text={m} />
                </li>
              ))}
            </ul>
            <p>{it.explanation}</p>
          </FeedbackCard>
          <p className="text-[13px] text-warm-gray text-center mt-5 mb-2">Ta phrase est-elle correcte ?</p>
          <div className="flex gap-3">
            <button
              ref={nextRef}
              onClick={() => assess(true)}
              className={`flex-1 rounded-xl py-3.5 text-[15px] font-semibold text-success bg-success-light border border-success/25
                          transition-transform duration-150 ease-out hover:opacity-90 active:scale-[0.97] ${focusRing}`}
            >
              ✓ Oui
            </button>
            <button
              onClick={() => assess(false)}
              className={`flex-1 rounded-xl py-3.5 text-[15px] font-semibold text-error bg-error-light border border-error/25
                          transition-transform duration-150 ease-out hover:opacity-90 active:scale-[0.97] ${focusRing}`}
            >
              ✗ À revoir
            </button>
          </div>
        </>
      )}
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Comprehension ecrite (texte + questions type examen)                */
/* ------------------------------------------------------------------ */

function Paragraphs({ paragraphs, only, exclude }) {
  return (
    <div className="space-y-3" lang="en">
      {paragraphs.map((p, i) => (only && !only.includes(i + 1) ? null : (
        <p key={i} className="text-[14px] leading-[1.75] text-charcoal/90">
          <span className="inline-flex items-center justify-center w-5 h-5 mr-2 rounded-md bg-sand text-[11px] font-bold text-warm-gray align-text-bottom">
            {i + 1}
          </span>
          <TappableText text={p} exclude={exclude} />
        </p>
      )))}
    </div>
  )
}

// Extrait avec des reperes [A] [B]… (question "ou inserer la phrase ?")
function Extract({ text }) {
  const parts = text.split(/\[([A-D])\]/)
  return (
    <p className="text-[14px] leading-[1.75] text-charcoal/90" lang="en">
      {parts.map((p, i) => (i % 2
        ? <span key={i} className="inline-flex items-center justify-center w-6 h-6 mx-0.5 rounded-md bg-anglais text-white text-[12px] font-bold align-text-bottom">{p}</span>
        : <TappableText key={i} text={p} />))}
    </p>
  )
}

function MultiChoice({ choices, answers, pick, selected, answered, onToggle, notes }) {
  return (
    <div className="flex flex-col gap-3">
      {choices.map((choice, i) => {
        const isAnswer = answers.includes(choice)
        const isPicked = selected.includes(choice)
        let tone = isPicked ? 'bg-white border-anglais text-charcoal elevated' : 'bg-white border-sand text-charcoal hover:border-warm-gray/40'
        let badge = isPicked ? 'bg-anglais text-white' : 'bg-sand/70 text-warm-gray'
        let mark = String.fromCharCode(65 + i)
        if (answered) {
          if (isAnswer && isPicked) { tone = 'bg-success-light border-success/30 text-success'; badge = 'bg-success text-white'; mark = '✓' }
          else if (isAnswer) { tone = 'bg-white border-success/50 border-dashed text-success'; badge = 'bg-success-light text-success'; mark = '✓' }
          else if (isPicked) { tone = 'bg-error-light border-error/30 text-error'; badge = 'bg-error text-white'; mark = '✗' }
          else { tone = 'bg-white border-sand text-charcoal/55' }
        }
        return (
          <button
            key={choice}
            onClick={() => onToggle(choice)}
            disabled={answered || (!isPicked && selected.length >= pick)}
            aria-pressed={isPicked}
            className={`w-full text-left rounded-xl p-4 border text-[15px] font-medium
                        transition-transform duration-150 ease-out active:scale-[0.98]
                        disabled:cursor-default disabled:active:scale-100 ${focusRing} ${tone}`}
          >
            <span className="flex items-start gap-3">
              <span className={`flex items-center justify-center w-8 h-8 rounded-lg text-[13px] font-bold shrink-0 ${badge}`}>{mark}</span>
              <span className="flex-1 min-w-0 pt-1">
                <span className="block leading-snug" lang="en">{choice}</span>
                {answered && notes?.[choice] && (
                  <span className="pop-in block text-[13px] font-normal text-charcoal/65 mt-1.5 leading-relaxed">{notes[choice]}</span>
                )}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

function ReadingPlayer({ devoir, matiere, onFinish, onBack }) {
  const items = devoir.items
  const [phase, setPhase] = useState('read')
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState([])
  const [outcomes, setOutcomes] = useState([])
  const [showAll, setShowAll] = useState(false)
  const outcome = outcomes[current]
  const answered = outcome !== undefined
  const nextRef = useFocusOnAnswer(answered)
  const it = items[current]
  const multi = Boolean(it.answers)

  const record = (given, correct) => setOutcomes(prev => { const n = [...prev]; n[current] = { given, correct }; return n })

  const pickOne = (choice) => { if (!answered) record(choice, choice === it.answer) }
  const toggle = (choice) => setSelected(s => (s.includes(choice) ? s.filter(c => c !== choice) : [...s, choice]))
  const submitMulti = () => {
    const correct = selected.length === it.answers.length && selected.every(c => it.answers.includes(c))
    record(selected.join(' / '), correct)
  }

  const next = () => {
    if (current + 1 >= items.length) {
      onFinish(items.map((x, i) => ({
        question: { question: x.question, type: 'qcm', answer: x.answer ?? x.answers.join(' / ') },
        correct: outcomes[i].correct,
        userAnswer: outcomes[i].given,
      })))
      return
    }
    setCurrent(c => c + 1)
    setSelected([])
    setShowAll(false)
  }

  if (phase === 'read') {
    return (
      <>
        <Header devoir={devoir} matiere={matiere} onBack={onBack} step={0} total={items.length} />
        <GlossaryHint />
        <div className="elevated rounded-2xl bg-white border border-sand px-5 py-5 mb-6">
          <p className="font-display font-bold text-[18px] text-charcoal mb-3 tracking-[-0.01em]" lang="en">{devoir.passageTitle}</p>
          <Paragraphs paragraphs={devoir.paragraphs} />
          {devoir.source && <p className="text-[11px] italic text-warm-gray mt-4">{devoir.source}</p>}
        </div>
        <PrimaryButton color={matiere.color} onClick={() => setPhase('questions')}>
          J’ai lu le texte : {items.length} questions
        </PrimaryButton>
      </>
    )
  }

  const exclude = answered ? undefined : it.choices
  const status = !answered ? null : outcome.correct ? 'correct' : 'wrong'

  return (
    <>
      <Header devoir={devoir} matiere={matiere} onBack={onBack} step={current} total={items.length} />

      {/* Le passage utile a la question, avec acces au texte complet */}
      {(it.extract || it.paragraphs) && (
        <div className="rounded-2xl bg-white border border-sand px-4 py-4 mb-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-warm-gray mb-2">
            {it.extract ? 'Extrait' : it.paragraphs.length === 1 ? `Paragraphe ${it.paragraphs[0]}` : `Paragraphes ${it.paragraphs.join(' et ')}`}
          </p>
          {it.extract ? <Extract text={it.extract} /> : <Paragraphs paragraphs={devoir.paragraphs} only={it.paragraphs} />}
        </div>
      )}
      <button
        onClick={() => setShowAll(s => !s)}
        aria-expanded={showAll}
        className={`self-start mb-4 text-[12px] font-semibold text-anglais underline underline-offset-4 rounded
                    hover:opacity-80 active:opacity-60 transition-opacity ${focusRing}`}
      >
        {showAll ? 'Masquer le texte complet' : 'Voir tout le texte'}
      </button>
      {showAll && (
        <div className="pop-in rounded-2xl bg-white border border-sand px-4 py-4 mb-5">
          <Paragraphs paragraphs={devoir.paragraphs} />
        </div>
      )}

      <div className="mb-5">
        <p className="text-[12px] font-bold text-warm-gray mb-1">Question {current + 1}</p>
        <h2 lang="en" className="font-display font-bold text-[18px] leading-snug tracking-[-0.01em] text-charcoal">
          <TappableText text={it.question} exclude={exclude} />
        </h2>
        {it.intro && (
          <p lang="en" className="mt-3 text-[14px] italic text-charcoal/80 border-l-2 border-anglais/40 pl-3">
            <TappableText text={it.intro} />
          </p>
        )}
        {multi && !answered && (
          <p className="text-[13px] text-warm-gray mt-2">Choisis {it.answers.length} réponses ({selected.length}/{it.answers.length}).</p>
        )}
      </div>

      <div className="flex-1">
        {multi ? (
          <>
            <MultiChoice
              choices={it.choices}
              answers={it.answers}
              pick={it.answers.length}
              selected={selected}
              answered={answered}
              onToggle={toggle}
              notes={it.notes}
            />
            {!answered && (
              <PrimaryButton color={matiere.color} onClick={submitMulti} disabled={selected.length !== it.answers.length} className="mt-4">
                Valider
              </PrimaryButton>
            )}
          </>
        ) : (
          <ChoiceList
            choices={it.choices}
            answer={it.answer}
            selected={outcome?.given}
            answered={answered}
            onPick={pickOne}
            notes={it.notes}
            english
          />
        )}
      </div>

      {answered && (
        <FeedbackCard status={status}>
          {!outcome.correct && (
            <p>Réponse correcte : <strong lang="en">{multi ? it.answers.map(a => String.fromCharCode(65 + it.choices.indexOf(a))).join(', ') : it.answer}</strong></p>
          )}
          <p>{it.explanation}</p>
        </FeedbackCard>
      )}

      {answered && (
        <PrimaryButton ref={nextRef} color={matiere.color} onClick={next} className="mt-4">
          {current + 1 >= items.length ? 'Voir le score' : 'Question suivante'}
        </PrimaryButton>
      )}
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Remettre les mots dans l'ordre                                       */
/* ------------------------------------------------------------------ */

const sentenceKey = (s) => s.toLowerCase().replace(/’/g, "'").replace(/\s*,\s*/g, ', ').replace(/[.!?]\s*$/, '').replace(/\s+/g, ' ').trim()

function OrderPlayer({ devoir, matiere, onFinish, onBack }) {
  const items = devoir.items
  const [current, setCurrent] = useState(0)
  const [built, setBuilt] = useState([]) // indices des puces, dans l'ordre choisi
  const [outcomes, setOutcomes] = useState([])
  const outcome = outcomes[current]
  const answered = outcome !== undefined
  const nextRef = useFocusOnAnswer(answered)

  const it = items[current]
  const chips = devoir.comma ? [...it.words, ','] : it.words
  const commaIndex = devoir.comma ? chips.length - 1 : -1
  const wordsUsed = built.filter(i => i !== commaIndex).length
  const sentence = built.map(i => chips[i]).join(' ').replace(/ ,/g, ',')

  const submit = () => {
    const key = sentenceKey(sentence)
    const correct = it.accept.some(a => sentenceKey(a) === key)
    // bonne phrase mais virgule oubliee / en trop
    const commaOnly = !correct && it.accept.some(a => sentenceKey(a).replace(/,/g, '') === key.replace(/,/g, ''))
    setOutcomes(prev => { const n = [...prev]; n[current] = { given: sentence, correct, commaOnly }; return n })
  }

  const next = () => {
    if (current + 1 >= items.length) {
      onFinish(items.map((x, i) => ({
        question: { question: x.words.join(' / '), type: 'free', answers: x.accept },
        correct: outcomes[i].correct,
        userAnswer: outcomes[i].given,
      })))
      return
    }
    setCurrent(c => c + 1)
    setBuilt([])
  }

  return (
    <>
      <Header devoir={devoir} matiere={matiere} onBack={onBack} step={current} total={items.length} />

      <p className="text-[14px] text-warm-gray font-medium mb-2">
        Phrase {current + 1} : touche les mots dans le bon ordre
      </p>

      {/* Phrase en construction */}
      <div
        className={`min-h-[96px] rounded-2xl border-2 px-3 py-3 mb-4 flex flex-wrap content-start gap-2
                    ${answered ? (outcome.correct ? 'border-success/40 bg-success-light' : 'border-error/40 bg-error-light') : 'border-dashed border-warm-gray/30 bg-white'}`}
        lang="en"
      >
        {built.length === 0 && <span className="text-[14px] text-warm-gray/50 px-1 py-1.5">Ta phrase apparaîtra ici…</span>}
        {built.map((ci, k) => (
          <button
            key={`${ci}-${k}`}
            onClick={() => !answered && setBuilt(b => b.filter((_, j) => j !== k))}
            disabled={answered}
            className={`rounded-lg px-3 py-1.5 text-[15px] font-medium bg-anglais text-white
                        transition-transform duration-150 ease-out active:scale-95 disabled:active:scale-100 ${focusRing}`}
          >
            {chips[ci]}
          </button>
        ))}
      </div>

      {/* Mots disponibles */}
      {!answered && (
        <div className="flex flex-wrap gap-2 mb-6" lang="en">
          {chips.map((w, ci) => (built.includes(ci) ? null : (
            <button
              key={ci}
              onClick={() => setBuilt(b => [...b, ci])}
              className={`rounded-lg border px-3 py-1.5 text-[15px] font-medium
                          transition-transform duration-150 ease-out active:scale-95 ${focusRing}
                          ${ci === commaIndex ? 'border-dashed border-warm-gray/50 text-warm-gray bg-white px-4' : 'border-sand bg-white text-charcoal hover:border-warm-gray/40'}`}
            >
              {w}
            </button>
          )))}
        </div>
      )}

      <div className="flex-1">
        {!answered && (
          <div className="flex gap-3">
            <GhostButton onClick={() => setBuilt([])} className="shrink-0">Effacer</GhostButton>
            <PrimaryButton color={matiere.color} onClick={submit} disabled={wordsUsed !== it.words.length}>
              {wordsUsed === it.words.length ? 'Valider' : `Encore ${it.words.length - wordsUsed} mot${it.words.length - wordsUsed > 1 ? 's' : ''}`}
            </PrimaryButton>
          </div>
        )}
      </div>

      {answered && (
        <FeedbackCard status={outcome.correct ? 'correct' : 'wrong'}>
          {outcome.commaOnly && (
            <p className="font-semibold text-error">
              Presque ! L’ordre des mots est bon, mais la virgule n’est pas à la bonne place : on en met une après la proposition en « if » quand la phrase commence par « if », et aucune sinon.
            </p>
          )}
          {!outcome.correct && <p>Ta phrase : <span lang="en">{outcome.given}</span></p>}
          <p>
            {it.accept.length === 1 ? 'Réponse : ' : 'Réponses possibles : '}
          </p>
          <ul className="space-y-1" lang="en">
            {it.accept.map(a => <li key={a} className="font-semibold text-charcoal border-l-2 border-success/40 pl-3">{a}</li>)}
          </ul>
          <p>{it.explanation}</p>
          <Translation text={it.translation} />
        </FeedbackCard>
      )}

      {answered && (
        <PrimaryButton ref={nextRef} color={matiere.color} onClick={next} className="mt-4">
          {current + 1 >= items.length ? 'Voir le score' : 'Phrase suivante'}
        </PrimaryButton>
      )}
    </>
  )
}
