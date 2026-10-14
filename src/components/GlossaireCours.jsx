import { useState, useRef, useEffect } from 'react'
import { GLOSSAIRES } from '../data'
import { shuffle, matchNames, findKeys, authorLabel } from '../utils'
import {
  BackButton, ChoiceList, FeedbackCard, PrimaryButton, ProgressBar, TypeBadge, focusRing,
} from './ui'

// Nombre de termes par serie : le niveau 2 (ecrire) est plus long
const GLOSSAIRE_SESSION = { 1: 10, 2: 5 }

const LEVELS = [
  {
    level: 1,
    emoji: '🔎',
    label: 'Niveau 1 · Reconnaître',
    desc: 'La définition est donnée : trouve le terme, puis son auteur (QCM de 2 à 4 choix).',
  },
  {
    level: 2,
    emoji: '✍️',
    label: 'Niveau 2 · Restituer',
    desc: 'Le terme est donné : écris la définition et l’auteur, puis compare avec le glossaire.',
  },
]

/* ------------------------------------------------------------------ */
/* Menu : les deux niveaux + la liste des termes                       */
/* ------------------------------------------------------------------ */

export function GlossaireMenu({ matiere, onStart, onBack }) {
  const g = GLOSSAIRES[matiere.id]

  return (
    <div className="px-5 pt-6 pb-12">
      <BackButton onClick={onBack} label="Retour" />

      <header className="mt-6 mb-8">
        <span className="text-3xl mb-2 block">🗂️</span>
        <h1 className="font-display font-bold text-[24px] tracking-[-0.03em] leading-tight" style={{ color: matiere.color }}>
          {g.title}
        </h1>
        <p className="text-warm-gray text-[14px] mt-1.5">{g.subtitle}</p>
      </header>

      <div className="flex flex-col gap-4">
        {LEVELS.map(l => (
          <button
            key={l.level}
            onClick={() => onStart(l.level)}
            className={`w-full text-left rounded-2xl p-5 bg-white border border-sand
                       hover:border-warm-gray/30 active:scale-[0.97] transition-transform duration-150 ${focusRing}`}
          >
            <div className="flex items-center gap-4">
              <span className="text-2xl">{l.emoji}</span>
              <div className="flex-1 min-w-0">
                <span className="block font-semibold text-[17px] text-charcoal">{l.label}</span>
                <span className="block text-warm-gray text-[13px] mt-0.5">{l.desc}</span>
                <span className="block text-warm-gray/70 text-[12px] mt-1">
                  {GLOSSAIRE_SESSION[l.level]} termes au hasard parmi {g.entries.length}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <h2 className="font-display font-bold text-[21px] tracking-[-0.03em] text-charcoal leading-tight mt-12">
        Tous les termes
      </h2>
      <p className="text-warm-gray text-[14px] mt-1.5 mb-2 leading-relaxed">
        Les définitions et les auteurs du glossaire, classés par thème.
      </p>

      {g.cats.map(c => (
        <section key={c.id} className="mt-7">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-warm-gray mb-3">{c.label}</h3>
          <div className="flex flex-col gap-3">
            {g.entries.filter(e => e.cat === c.id).map(e => (
              <article key={e.id} className="rounded-2xl bg-white border border-sand px-4 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <h4 className="font-display font-bold text-[18px] leading-tight text-charcoal">{e.term}</h4>
                  <span
                    className="shrink-0 text-[12px] font-semibold rounded-full px-2.5 py-0.5 mt-0.5"
                    style={{ color: matiere.color, background: `color-mix(in srgb, ${matiere.color} 10%, transparent)` }}
                  >
                    {authorLabel(e)}
                  </span>
                </div>
                {(e.en || e.alias) && (
                  <p className="text-[12px] text-warm-gray mt-1" lang={e.en ? 'en' : undefined}>
                    {[e.en, e.alias].filter(Boolean).join(' · ')}
                  </p>
                )}
                <p className="text-[14px] leading-relaxed text-charcoal/75 mt-2">{e.def}</p>
                {e.note && <p className="text-[12px] leading-relaxed text-warm-gray mt-1.5">{e.note}</p>}
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Series                                                              */
/* ------------------------------------------------------------------ */

const randomInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1))

// Auteurs d'un terme qui ne partagent aucun nom avec ceux de `entry` (sinon la question serait ambigue)
function otherAuthors(entry, candidates) {
  const labels = []
  for (const e of candidates) {
    const label = authorLabel(e)
    if (e.authors.some(a => entry.authors.includes(a)) || labels.includes(label)) continue
    labels.push(label)
  }
  return labels
}

// Niveau 1 : 2 a 4 choix pour le terme (parmi des termes proches), puis 2 a 4 choix pour l'auteur
function buildLevel1(entries) {
  const byId = Object.fromEntries(entries.map(e => [e.id, e]))
  return shuffle(entries).slice(0, GLOSSAIRE_SESSION[1]).map(entry => {
    const confusers = entry.confusers.map(id => byId[id])
    const termChoices = shuffle([entry.term, ...shuffle(confusers).slice(0, randomInt(1, 3)).map(c => c.term)])
    // Les auteurs des termes proches d'abord (plus credibles), puis les autres
    const pool = [...otherAuthors(entry, shuffle(confusers)), ...shuffle(otherAuthors(entry, entries))]
    const wrongAuthors = [...new Set(pool)].slice(0, randomInt(1, 3))
    return { entry, termChoices, authorChoices: shuffle([authorLabel(entry), ...wrongAuthors]) }
  })
}

export default function GlossaireQuiz({ matiere, level, onFinish, onBack }) {
  const g = GLOSSAIRES[matiere.id]
  const [items] = useState(() => (level === 1 ? buildLevel1(g.entries) : shuffle(g.entries).slice(0, GLOSSAIRE_SESSION[2])))
  const [current, setCurrent] = useState(0)
  const [results, setResults] = useState([])

  const next = (newResults) => {
    const all = [...results, ...newResults]
    if (current + 1 >= items.length) {
      onFinish(all)
      return
    }
    setResults(all)
    setCurrent(c => c + 1)
    window.scrollTo(0, 0)
  }

  const Player = level === 1 ? RecognizeItem : RestituteItem
  return (
    <div className="px-5 pt-6 pb-8 flex flex-col min-h-screen">
      <div className="flex items-center justify-between mb-4">
        <BackButton onClick={onBack} />
        <span className="text-[14px] text-warm-gray font-medium tabular-nums">{current + 1} / {items.length}</span>
      </div>
      <div className="mb-8">
        <ProgressBar value={current / items.length} color={matiere.color} />
      </div>
      <Player
        key={current}
        item={items[current]}
        entries={g.entries}
        matiere={matiere}
        last={current + 1 >= items.length}
        onDone={next}
      />
    </div>
  )
}

function useFocusWhen(flag) {
  const ref = useRef(null)
  useEffect(() => {
    if (flag) ref.current?.focus()
  }, [flag])
  return ref
}

function DefinitionCard({ text, color }) {
  return (
    <blockquote
      className="font-display text-[19px] leading-snug tracking-[-0.01em] text-charcoal border-l-4 pl-4 mb-6"
      style={{ borderColor: color }}
    >
      {text}
    </blockquote>
  )
}

/* ------------------------------------------------------------------ */
/* Niveau 1 : definition → terme, puis auteur                          */
/* ------------------------------------------------------------------ */

function RecognizeItem({ item, entries, matiere, last, onDone }) {
  const { entry, termChoices, authorChoices } = item
  const [step, setStep] = useState('term')
  const [picked, setPicked] = useState({ term: null, author: null })
  const answered = picked[step] !== null
  const nextRef = useFocusWhen(answered)

  const label = authorLabel(entry)
  const isTerm = step === 'term'
  const answer = isTerm ? entry.term : label
  const choices = isTerm ? termChoices : authorChoices
  const correct = picked[step] === answer

  // Sous chaque mauvais choix : ce qu'il designe vraiment
  const notes = {}
  for (const c of choices) {
    if (c === answer) continue
    if (isTerm) {
      const e = entries.find(x => x.term === c)
      notes[c] = `« ${c} » : ${e.def}`
    } else {
      const terms = entries.filter(x => authorLabel(x) === c).map(x => x.term)
      notes[c] = `${c} : ${terms.join(', ')}.`
    }
  }

  const pick = (choice) => {
    if (answered) return
    setPicked(p => ({ ...p, [step]: choice }))
  }

  const finish = () => {
    onDone([
      { question: { question: `Terme : « ${entry.term} »`, type: 'qcm', answer: entry.term }, correct: picked.term === entry.term, userAnswer: picked.term },
      { question: { question: `Auteur de « ${entry.term} »`, type: 'qcm', answer: label }, correct: picked.author === label, userAnswer: picked.author },
    ])
  }

  return (
    <>
      <div className="mb-3 flex items-center gap-2">
        <TypeBadge color={matiere.color}>{isTerm ? 'Le terme · 1/2' : 'L’auteur · 2/2'}</TypeBadge>
      </div>

      <DefinitionCard text={entry.prompt || entry.def} color={matiere.color} />

      <div className="flex-1">
        {!isTerm && (
          <p className="text-[14px] text-charcoal/75 mb-3">
            Terme : <strong className="text-charcoal">{entry.term}</strong>
          </p>
        )}
        <h2 className="font-display font-bold text-[20px] leading-snug tracking-[-0.02em] text-charcoal mb-4">
          {isTerm ? 'Quel est ce terme ?' : 'Qui en est l’auteur ?'}
        </h2>
        <ChoiceList
          key={step}
          choices={choices}
          answer={answer}
          selected={picked[step]}
          answered={answered}
          onPick={pick}
          notes={notes}
        />
      </div>

      {answered && (
        <FeedbackCard status={correct ? 'correct' : 'wrong'}>
          {!correct && <p>Réponse correcte : <strong>{answer}</strong></p>}
          {isTerm
            ? <p>C’est la définition de <strong>{entry.term}</strong>{entry.en ? ` (${entry.en})` : ''}.</p>
            : <p><strong>{entry.term}</strong> : {label}.</p>}
          {!isTerm && entry.note && <p>{entry.note}</p>}
        </FeedbackCard>
      )}

      {answered && (
        <PrimaryButton
          ref={nextRef}
          color={matiere.color}
          onClick={isTerm ? () => setStep('author') : finish}
          className="mt-4"
        >
          {isTerm ? 'Et l’auteur ?' : last ? 'Voir le score' : 'Terme suivant'}
        </PrimaryButton>
      )}
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Niveau 2 : terme → definition + auteur ecrits                       */
/* ------------------------------------------------------------------ */

// La definition ne peut pas etre corrigee mot a mot (trop de formulations justes) :
// on montre les idees cles retrouvees, la definition du glossaire, et l'eleve s'auto-evalue.
// L'auteur, lui, est corrige automatiquement.
function RestituteItem({ item: entry, matiere, last, onDone }) {
  const [definition, setDefinition] = useState('')
  const [author, setAuthor] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const nextRef = useFocusWhen(submitted)

  const label = authorLabel(entry)
  const keys = submitted ? findKeys(definition, entry.keys, entry.term) : []
  const foundKeys = keys.filter(k => k.found).length
  const names = submitted ? matchNames(author, entry.authors) : null
  const authorOk = Boolean(names?.found.length)

  const assess = (ok) => {
    onDone([
      { question: { question: `Définition de « ${entry.term} »`, type: 'free', answers: [entry.def] }, correct: ok, userAnswer: definition.trim() },
      { question: { question: `Auteur de « ${entry.term} »`, type: 'free', answers: [label] }, correct: authorOk, userAnswer: author.trim() || '—' },
    ])
  }

  const fieldClass = `w-full rounded-xl border border-sand bg-white px-4 text-[16px] leading-relaxed
                      placeholder:text-warm-gray/40 focus:outline-2 focus:outline-offset-0 focus:border-transparent disabled:bg-sand/30`

  return (
    <>
      <div className="mb-3">
        <TypeBadge color={matiere.color}>Définition + auteur</TypeBadge>
      </div>

      <div className="mb-6">
        <p className="text-[14px] text-warm-gray font-medium mb-2">Définis ce terme et donne son auteur</p>
        <h2 className="font-display font-bold text-[30px] leading-tight tracking-[-0.03em] text-charcoal">{entry.term}</h2>
        {(entry.en || entry.alias) && (
          <p className="text-[13px] text-warm-gray mt-1">{[entry.en, entry.alias].filter(Boolean).join(' · ')}</p>
        )}
      </div>

      <div className="flex-1">
        <label className="block text-[13px] font-semibold text-charcoal mb-1.5" htmlFor="gl-def">Ta définition</label>
        <textarea
          id="gl-def"
          value={definition}
          onChange={e => setDefinition(e.target.value)}
          disabled={submitted}
          rows={4}
          placeholder="Explique avec tes mots…"
          className={`${fieldClass} py-3.5 resize-none`}
          style={{ outlineColor: matiere.color }}
        />
        <label className="block text-[13px] font-semibold text-charcoal mt-4 mb-1.5" htmlFor="gl-author">Auteur(s)</label>
        <input
          id="gl-author"
          type="text"
          value={author}
          onChange={e => setAuthor(e.target.value)}
          disabled={submitted}
          placeholder="Ex. Milgram"
          className={`${fieldClass} py-3.5`}
          style={{ outlineColor: matiere.color }}
          autoComplete="off"
          autoCapitalize="words"
          autoCorrect="off"
          spellCheck={false}
        />
        {!submitted && (
          <PrimaryButton color={matiere.color} onClick={() => setSubmitted(true)} disabled={!definition.trim()} className="mt-4">
            Voir la correction
          </PrimaryButton>
        )}
      </div>

      {submitted && (
        <>
          <FeedbackCard status="neutral" title="Compare avec le glossaire">
            <p className={authorOk ? 'text-success font-medium' : 'text-error font-medium'}>
              {authorOk ? '✓' : '✗'} Auteur : {label}
              {authorOk && names.missing.length > 0 && <span className="font-normal text-charcoal/70"> (il manquait {names.missing.join(', ')})</span>}
              {!authorOk && author.trim() && <span className="font-normal text-charcoal/70"> (tu as écrit : {author.trim()})</span>}
            </p>
            <p className="font-semibold text-charcoal pt-1">Définition du glossaire :</p>
            <p className="italic border-l-2 border-charcoal/15 pl-3">{entry.def}</p>
            <p className="font-semibold text-charcoal pt-1">
              Idées clés : {foundKeys} sur {keys.length} retrouvée{foundKeys > 1 ? 's' : ''} dans ta réponse
            </p>
            <ul className="space-y-1">
              {keys.map(k => (
                <li key={k.label} className={k.found ? 'text-success' : 'text-warm-gray'}>
                  {k.found ? '✓' : '○'} {k.label}
                </li>
              ))}
            </ul>
            <p className="text-[12px] text-warm-gray">
              La détection des idées clés repose sur des mots : une reformulation juste peut passer inaperçue. C’est toi qui juges.
            </p>
            {entry.note && <p>{entry.note}</p>}
          </FeedbackCard>
          <p className="text-[13px] text-warm-gray text-center mt-5 mb-2">Ta définition était-elle juste ?</p>
          <div className="flex gap-3">
            <button
              ref={nextRef}
              onClick={() => assess(true)}
              className={`flex-1 rounded-xl py-3.5 text-[15px] font-semibold text-success bg-success-light border border-success/25
                          transition-transform duration-150 ease-out hover:opacity-90 active:scale-[0.97] ${focusRing}`}
            >
              ✓ Je l’avais
            </button>
            <button
              onClick={() => assess(false)}
              className={`flex-1 rounded-xl py-3.5 text-[15px] font-semibold text-error bg-error-light border border-error/25
                          transition-transform duration-150 ease-out hover:opacity-90 active:scale-[0.97] ${focusRing}`}
            >
              ✗ À revoir
            </button>
          </div>
          {last && <p className="text-[12px] text-warm-gray text-center mt-3">Dernier terme : ta réponse affiche le score.</p>}
        </>
      )}
    </>
  )
}
