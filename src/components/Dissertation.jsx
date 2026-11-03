import { useState, useEffect } from 'react'
import { DISSERTATIONS, FICHES } from '../data'
import { shuffle } from '../utils'
import { loadProgress, recordAnswers, resetProgress, isMastered, toReview, MAITRISE } from '../progress'
import { BackButton, ChoiceList, FeedbackCard, PrimaryButton, ProgressBar, TypeBadge, focusRing } from './ui'
import { Labeled, QuoteCard } from './GlossaireCours'
import { useFocusWhen } from '../hooks'

// Module « Préparer la dissertation » : les termes du lexique de la fiche, avec pour chacun quand l'utiliser face a une
// video et comment l'ecrire. Les QCM ne proposent que des termes du lexique, du meme type (notion, auteur ou film).

// Nombre d'items par serie : termes (niveaux 1 et 2), scenes (niveau 3)
const SESSION = { 1: 12, 2: 10, 3: 2 }

// Typographie francaise : espace insecable avant « : ; ? ! » et a l'interieur des guillemets, pour qu'aucun signe ne se
// retrouve seul en debut de ligne sur telephone
const fr = (s) => s.replace(/« /g, '« ').replace(/ ([»:;?!])/g, ' $1')
const frDeep = (v) => {
  if (typeof v === 'string') return fr(v)
  if (Array.isArray(v)) return v.map(frDeep)
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, frDeep(x)]))
  return v
}

const NIVEAUX = frDeep([
  {
    level: 1,
    emoji: '🔎',
    label: 'Niveau 1 · Quel terme ?',
    desc: 'Ce qu’on voit dans la vidéo est décrit : choisis le terme du lexique (4 choix).',
  },
  {
    level: 2,
    emoji: '🧭',
    label: 'Niveau 2 · Quand je l’utilise ?',
    desc: 'Le terme est donné : choisis la situation dans laquelle tu l’écrirais dans ta copie.',
  },
  {
    level: 3,
    emoji: '🎬',
    label: 'Niveau 3 · Scène d’examen',
    desc: 'Une scène racontée comme la vidéo de 2 min 30 : coche toutes les notions présentes.',
  },
])

// Libelles selon le type de terme
const KIND = frDeep({
  notion: {
    badge: 'Ce que tu vois',
    question: 'Quel terme du lexique décrit le mieux cette situation ?',
    reperer: 'Je le repère quand…',
    usage: 'Dans quelle situation écrirais-tu ce terme ?',
  },
  auteur: {
    badge: 'Quel auteur ?',
    question: 'Quel auteur ou quelle expérience du lexique cites-tu ?',
    reperer: 'Je le cite quand…',
    usage: 'Dans quelle situation cites-tu cet auteur ?',
  },
  film: {
    badge: 'Quel film ?',
    question: 'Quel film du cours peux-tu citer en parallèle ?',
    reperer: 'Je le cite quand…',
    usage: 'Dans quelle situation cites-tu ce film ?',
  },
})

const scope = (matiere) => `${matiere.id}:dissertation`
const plainText = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

// Fiches reflexe completees par le lexique de la fiche de cours (definition, anglais, categorie) : une seule source pour les
// definitions, la fiche de cours
const built = {}
function getDissertation(id) {
  if (built[id]) return built[id]
  const d = DISSERTATIONS[id]
  const fiche = FICHES[id]
  const lexique = Object.fromEntries(fiche.glossary.map(e => [e.term, e]))
  const joined = d.termes.map(t => {
    const l = lexique[t.terme]
    return { ...t, def: l.def, en: l.en, cat: l.cat, kind: l.cat === 'auteurs' ? 'auteur' : l.cat === 'films' ? 'film' : 'notion' }
  })
  const all = frDeep({ ...d, termes: joined, cats: fiche.glossaryCats })
  built[id] = { ...all, byId: Object.fromEntries(all.termes.map(t => [t.id, t])) }
  return built[id]
}

/* ------------------------------------------------------------------ */
/* Petits elements communs                                             */
/* ------------------------------------------------------------------ */

function Pill({ color, children }) {
  return (
    <span
      className="shrink-0 text-[12px] font-semibold rounded-full px-2.5 py-0.5"
      style={{ color, background: `color-mix(in srgb, ${color} 10%, transparent)` }}
    >
      {children}
    </span>
  )
}

function Status({ entry }) {
  if (isMastered(entry)) return <span className="shrink-0 text-[11px] font-semibold rounded-full px-2 py-0.5 text-success bg-success-light">✓ maîtrisé</span>
  if (toReview(entry)) return <span className="shrink-0 text-[11px] font-semibold rounded-full px-2 py-0.5 text-error bg-error-light">à revoir</span>
  return null
}

function TermChip({ term, color, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-2.5 py-1 text-[12px] font-semibold leading-tight text-left
                  active:scale-[0.97] transition-transform duration-150 ${focusRing}`}
      style={{ color, background: `color-mix(in srgb, ${color} 9%, white)`, border: `1px solid color-mix(in srgb, ${color} 22%, transparent)` }}
    >
      {term.terme}
    </button>
  )
}

function Methode({ d, color }) {
  return (
    <section className="rounded-2xl bg-white border border-sand px-4 py-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] mb-3" style={{ color }}>À l’examen, pour chaque moment de la vidéo</p>
      <ol className="flex flex-col gap-2.5">
        {d.methode.map((m, i) => (
          <li key={m.titre} className="flex gap-3">
            <span
              className="flex items-center justify-center w-6 h-6 rounded-full text-[12px] font-bold text-white shrink-0"
              style={{ background: color }}
            >
              {i + 1}
            </span>
            <p className="text-[14px] leading-snug text-charcoal/80 pt-0.5">
              <strong className="text-charcoal">{m.titre}</strong> · {m.texte}
            </p>
          </li>
        ))}
      </ol>
    </section>
  )
}

function MenuButton({ emoji, label, desc, meta, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl p-5 bg-white border border-sand
                 hover:border-warm-gray/30 active:scale-[0.97] transition-transform duration-150 ${focusRing}`}
    >
      <div className="flex items-center gap-4">
        <span className="text-2xl">{emoji}</span>
        <div className="flex-1 min-w-0">
          <span className="block font-semibold text-[17px] text-charcoal">{label}</span>
          <span className="block text-warm-gray text-[13px] mt-0.5">{desc}</span>
          {meta && <span className="block text-warm-gray/70 text-[12px] mt-1">{meta}</span>}
        </div>
      </div>
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Menu : progression, methode, niveaux, fiches et grilles             */
/* ------------------------------------------------------------------ */

export function DissertationMenu({ matiere, onStart, onFiches, onGrilles, onBack }) {
  const d = getDissertation(matiere.id)
  const [progress, setProgress] = useState(() => loadProgress(scope(matiere)))
  const [confirmReset, setConfirmReset] = useState(false)

  const mastered = d.termes.filter(t => isMastered(progress[t.id])).length
  const review = d.termes.filter(t => toReview(progress[t.id])).length
  const reset = () => {
    resetProgress(scope(matiere))
    setProgress({})
    setConfirmReset(false)
  }

  return (
    <div className="px-5 pt-6 pb-12">
      <BackButton onClick={onBack} label="Retour" />

      <header className="mt-6 mb-6">
        <span className="text-3xl mb-2 block">🎬</span>
        <h1 className="font-display font-bold text-[24px] tracking-[-0.03em] leading-tight" style={{ color: matiere.color }}>
          {d.title}
        </h1>
        <p className="text-warm-gray text-[14px] mt-1.5">{d.subtitle}</p>
      </header>

      <section className="rounded-2xl p-5 border elevated mb-4" style={{
        background: `color-mix(in srgb, ${matiere.color} 7%, white)`,
        borderColor: `color-mix(in srgb, ${matiere.color} 25%, transparent)`,
      }}>
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[14px] font-semibold text-charcoal">Termes maîtrisés</p>
          <p className="font-display font-bold text-[26px] leading-none tabular-nums" style={{ color: matiere.color }}>
            {mastered}<span className="text-[16px] text-warm-gray font-body font-semibold"> / {d.termes.length}</span>
          </p>
        </div>
        <div className="mt-3">
          <ProgressBar value={mastered / d.termes.length} color={matiere.color} />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-1.5">
          {d.cats.map(c => {
            const inCat = d.termes.filter(t => t.cat === c.id)
            const n = inCat.filter(t => isMastered(progress[t.id])).length
            return (
              <p key={c.id} className="flex justify-between text-[12px] text-warm-gray">
                <span>{c.label}</span>
                <span className="tabular-nums font-semibold">{n} / {inCat.length}</span>
              </p>
            )
          })}
        </div>
        <p className="text-[12px] text-warm-gray/80 mt-3 leading-relaxed">
          Un terme est maîtrisé après {MAITRISE} bonnes réponses de suite.
          {review > 0 && <> <strong className="text-error font-semibold">{review} à revoir</strong>{' '}: ils reviennent en premier dans les séries.</>}
        </p>
        {Object.keys(progress).length > 0 && (
          confirmReset ? (
            <div className="flex items-center gap-3 mt-3 text-[13px]">
              <span className="text-charcoal/80">{fr('Tout remettre à zéro ?')}</span>
              <button onClick={reset} className={`font-semibold text-error rounded ${focusRing}`}>Oui</button>
              <button onClick={() => setConfirmReset(false)} className={`font-semibold text-warm-gray rounded ${focusRing}`}>Non</button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className={`mt-3 text-[12px] font-semibold text-warm-gray underline underline-offset-4 rounded ${focusRing}`}
            >
              Remettre la progression à zéro
            </button>
          )
        )}
      </section>

      <Methode d={d} color={matiere.color} />

      <h2 className="font-display font-bold text-[21px] tracking-[-0.03em] text-charcoal leading-tight mt-10 mb-4">
        Apprendre
      </h2>
      <div className="flex flex-col gap-4">
        <MenuButton
          emoji="📒"
          label="Fiches réflexe"
          desc={fr('Pour chaque terme : je le repère, je l’écris, j’enchaîne, je ne confonds pas.')}
          meta={`${d.termes.length} termes du lexique`}
          onClick={onFiches}
        />
        <MenuButton
          emoji="🧾"
          label="Grilles d’observation"
          desc="Les questions à se poser pendant la vidéo, selon ce qu’elle montre (foule, réunion, ordre…)."
          meta={`${d.grilles.length} grilles`}
          onClick={onGrilles}
        />
      </div>

      <h2 className="font-display font-bold text-[21px] tracking-[-0.03em] text-charcoal leading-tight mt-10 mb-4">
        S’entraîner
      </h2>
      <div className="flex flex-col gap-4">
        {NIVEAUX.map(l => (
          <MenuButton
            key={l.level}
            emoji={l.emoji}
            label={l.label}
            desc={l.desc}
            meta={l.level === 3
              ? `${SESSION[3]} scènes au hasard parmi ${d.scenes.length}`
              : `${SESSION[l.level]} termes par série, en priorité ceux à revoir`}
            onClick={() => onStart(l.level)}
          />
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Fiches reflexe                                                      */
/* ------------------------------------------------------------------ */

const FILTRES = [
  { id: 'tous', label: 'Tous' },
  { id: 'revoir', label: 'À revoir' },
  { id: 'apprendre', label: 'Pas maîtrisés' },
]

export function DissertationFiches({ matiere, focus, onBack }) {
  const d = getDissertation(matiere.id)
  const [progress] = useState(() => loadProgress(scope(matiere)))
  const [query, setQuery] = useState('')
  const [filtre, setFiltre] = useState('tous')
  const [open, setOpen] = useState(() => new Set(focus ? [focus] : []))

  // Ouvert depuis une grille : aller a la fiche demandee (apres le retour en haut de page fait par l'app)
  useEffect(() => {
    if (!focus) return
    const raf = requestAnimationFrame(() => document.getElementById(`dt-${focus}`)?.scrollIntoView({ block: 'start' }))
    return () => cancelAnimationFrame(raf)
  }, [focus])

  const goTo = (id) => {
    setQuery('')
    setFiltre('tous')
    setOpen(prev => new Set(prev).add(id))
    requestAnimationFrame(() => document.getElementById(`dt-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
  const toggle = (id, isOpen) => setOpen(prev => {
    const n = new Set(prev)
    if (isOpen) n.add(id)
    else n.delete(id)
    return n
  })

  const q = plainText(query.trim())
  const keep = (t) => {
    const e = progress[t.id]
    if (filtre === 'revoir' && !toReview(e)) return false
    if (filtre === 'apprendre' && isMastered(e)) return false
    return !q || plainText([t.terme, t.en, t.auteur, t.def, t.reperer].filter(Boolean).join(' ')).includes(q)
  }
  const groups = d.cats
    .map(c => ({ ...c, termes: d.termes.filter(t => t.cat === c.id && keep(t)) }))
    .filter(c => c.termes.length > 0)

  return (
    <div className="px-5 pt-6 pb-12">
      <BackButton onClick={onBack} label="Retour" />

      <header className="mt-6 mb-6">
        <span className="text-3xl mb-2 block">📒</span>
        <h1 className="font-display font-bold text-[24px] tracking-[-0.03em] leading-tight" style={{ color: matiere.color }}>
          Fiches réflexe
        </h1>
        <p className="text-warm-gray text-[14px] mt-1.5 leading-relaxed">
          Les {d.termes.length} termes du lexique. Pour chacun{' '}: quand le repérer dans la vidéo, la phrase à écrire dans ta copie,
          les notions à enchaîner et le piège à éviter.
        </p>
      </header>

      <input
        type="search"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Chercher un terme, un auteur, un film…"
        aria-label="Chercher un terme, un auteur ou un film"
        className="w-full rounded-xl border border-sand bg-white px-4 py-3.5 text-[16px]
                   placeholder:text-warm-gray/50 focus:outline-2 focus:outline-offset-0 focus:border-transparent"
        style={{ outlineColor: matiere.color }}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
      />

      <div role="radiogroup" aria-label="Filtrer les termes" className="grid grid-cols-3 gap-1 rounded-xl bg-sand p-1 mt-3">
        {FILTRES.map(f => (
          <button
            key={f.id}
            role="radio"
            aria-checked={filtre === f.id}
            onClick={() => setFiltre(f.id)}
            className={`rounded-lg py-2 text-[13px] font-semibold transition-colors ${focusRing} ${
              filtre === f.id ? 'bg-white text-charcoal elevated' : 'text-warm-gray hover:text-charcoal'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {groups.map(c => (
        <section key={c.id} className="mt-8">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.1em] text-warm-gray mb-3">{c.label}</h2>
          <div className="flex flex-col gap-3">
            {c.termes.map(t => (
              <ReflexCard
                key={t.id}
                t={t}
                d={d}
                color={matiere.color}
                progress={progress[t.id]}
                isOpen={open.has(t.id)}
                onToggle={(o) => toggle(t.id, o)}
                onGoTo={goTo}
              />
            ))}
          </div>
        </section>
      ))}

      {groups.length === 0 && (
        <p className="mt-10 text-center text-warm-gray text-[15px]">
          {query ? fr(`Aucun terme ne correspond à « ${query} ».`) : filtre === 'revoir' ? 'Aucun terme à revoir pour l’instant.' : 'Tous les termes sont maîtrisés, bravo !'}
        </p>
      )}
    </div>
  )
}

function ReflexCard({ t, d, color, progress, isOpen, onToggle, onGoTo }) {
  const k = KIND[t.kind]
  return (
    <article id={`dt-${t.id}`} className="rounded-2xl bg-white border border-sand px-4 py-3.5 scroll-mt-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display font-bold text-[18px] leading-tight text-charcoal">{t.terme}</h3>
        <div className="flex flex-wrap justify-end items-center gap-1.5 mt-0.5">
          <Status entry={progress} />
          {t.auteur && <Pill color={color}>{t.auteur}</Pill>}
        </div>
      </div>
      {t.en && <p className="text-[12px] text-warm-gray mt-1" lang="en">{t.en}</p>}
      <p className="text-[14px] leading-relaxed text-charcoal/75 mt-2 border-l-[3px] pl-3" style={{ borderColor: color }}>{t.def}</p>
      <Labeled label={k.reperer} color={color} className="mt-3">{t.reperer}</Labeled>
      <details className="group mt-3" open={isOpen} onToggle={e => onToggle(e.currentTarget.open)}>
        <summary
          className={`list-none cursor-pointer inline-flex items-center gap-1.5 text-[13px] font-semibold rounded ${focusRing}`}
          style={{ color }}
        >
          <span className="inline-block transition-transform group-open:rotate-90">›</span>
          Je l’écris, j’enchaîne, je ne confonds pas
        </summary>
        <div className="mt-3 flex flex-col gap-3 rounded-xl bg-sand/40 px-3.5 py-3">
          <Labeled label="Je l’écris dans ma copie">
            <span className="block italic border-l-2 border-charcoal/15 pl-3">{t.ecrire}</span>
          </Labeled>
          {t.enchainer?.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-warm-gray mb-1.5">J’enchaîne avec</p>
              <div className="flex flex-wrap gap-1.5">
                {t.enchainer.map(id => <TermChip key={id} term={d.byId[id]} color={color} onClick={() => onGoTo(id)} />)}
              </div>
            </div>
          )}
          {t.confondre && (
            <Labeled label={fr(`Ne pas confondre avec « ${d.byId[t.confondre.avec].terme} »`)}>{t.confondre.pourquoi}</Labeled>
          )}
        </div>
      </details>
    </article>
  )
}

/* ------------------------------------------------------------------ */
/* Grilles d'observation                                               */
/* ------------------------------------------------------------------ */

export function DissertationGrilles({ matiere, onOpenTerm, onBack }) {
  const d = getDissertation(matiere.id)
  return (
    <div className="px-5 pt-6 pb-12">
      <BackButton onClick={onBack} label="Retour" />

      <header className="mt-6 mb-6">
        <span className="text-3xl mb-2 block">🧾</span>
        <h1 className="font-display font-bold text-[24px] tracking-[-0.03em] leading-tight" style={{ color: matiere.color }}>
          Grilles d’observation
        </h1>
        <p className="text-warm-gray text-[14px] mt-1.5 leading-relaxed">
          Pendant la vidéo, prends la grille qui correspond à ce qu’elle montre et pose-toi ses questions{' '}: chaque «{' '}oui{' '}» est un
          terme à écrire. Touche un terme pour revoir sa fiche réflexe.
        </p>
      </header>

      <div className="flex flex-col gap-4">
        {d.grilles.map(g => (
          <section key={g.id} className="rounded-2xl bg-white border border-sand px-4 py-4">
            <h2 className="font-display font-bold text-[19px] leading-tight tracking-[-0.02em] text-charcoal">
              <span className="mr-1.5">{g.emoji}</span>{g.titre}
            </h2>
            <p className="text-[13px] text-warm-gray mt-1 leading-snug">{g.quand}</p>
            <ol className="mt-4 flex flex-col gap-3.5">
              {g.questions.map((q, i) => (
                <li key={i} className="border-t border-sand pt-3 first:border-t-0 first:pt-0">
                  <p className="text-[14px] text-charcoal leading-snug">{q.q}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {q.termes.map(id => <TermChip key={id} term={d.byId[id]} color={matiere.color} onClick={() => onOpenTerm(id)} />)}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Series                                                              */
/* ------------------------------------------------------------------ */

// Termes a revoir d'abord, puis ceux pas encore maitrises, puis les maitrises (au hasard a rang egal)
function pickTerms(termes, progress, n) {
  const rank = (t) => {
    const e = progress[t.id]
    return toReview(e) ? 0 : isMastered(e) ? 2 : 1
  }
  return shuffle(termes).sort((a, b) => rank(a) - rank(b)).slice(0, n)
}

function buildSession(level, d, progress) {
  if (level === 3) {
    return shuffle(d.scenes).slice(0, SESSION[3]).map(scene => ({
      scene,
      options: shuffle([...scene.notions.map(n => n.id), ...scene.pieges.map(p => p.id)]),
    }))
  }
  return pickTerms(d.termes, progress, SESSION[level]).map(t => ({ t, choices: shuffle([t.id, ...t.pieges]) }))
}

const PLAYERS = { 1: QuelTerme, 2: QuandUtiliser, 3: SceneExamen }

export default function DissertationQuiz({ matiere, level, onFinish, onBack }) {
  const d = getDissertation(matiere.id)
  const [items] = useState(() => buildSession(level, d, loadProgress(scope(matiere))))
  const [current, setCurrent] = useState(0)
  const [results, setResults] = useState([])

  // La progression est enregistree des la reponse : quitter une serie en cours ne la perd pas
  const record = (answers) => recordAnswers(scope(matiere), answers)

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

  const Player = PLAYERS[level]
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
        d={d}
        matiere={matiere}
        last={current + 1 >= items.length}
        record={record}
        onDone={next}
      />
    </div>
  )
}

// Rappel apres correction : comment le reperer et l'ecrire
function Reflex({ t }) {
  return (
    <>
      <p><strong>{KIND[t.kind].reperer}</strong> {t.reperer}</p>
      <p><strong>Je l’écris{' '}:</strong> <em>{t.ecrire}</em></p>
    </>
  )
}

/* Niveau 1 : la situation est decrite, trouver le terme ---------------- */

function QuelTerme({ item, d, matiere, last, record, onDone }) {
  const { t, choices } = item
  const k = KIND[t.kind]
  const [picked, setPicked] = useState(null)
  const answered = picked !== null
  const correct = picked === t.terme
  const nextRef = useFocusWhen(answered)

  // Sous chaque mauvais choix : sa definition du lexique
  const notes = {}
  for (const id of choices) if (id !== t.id) notes[d.byId[id].terme] = d.byId[id].def

  const pick = (choice) => {
    if (answered) return
    setPicked(choice)
    record([{ id: t.id, correct: choice === t.terme }])
  }

  return (
    <>
      <div className="mb-3">
        <TypeBadge color={matiere.color}>{k.badge}</TypeBadge>
      </div>

      <QuoteCard label="Dans la vidéo" text={t.situation} color={matiere.color} />

      <div className="flex-1">
        <h2 className="font-display font-bold text-[20px] leading-snug tracking-[-0.02em] text-charcoal mb-4">{k.question}</h2>
        <ChoiceList
          choices={choices.map(id => d.byId[id].terme)}
          answer={t.terme}
          selected={picked}
          answered={answered}
          onPick={pick}
          notes={notes}
        />
      </div>

      {answered && (
        <FeedbackCard status={correct ? 'correct' : 'wrong'}>
          <p>
            {correct ? 'C’est bien' : 'La bonne réponse est'} <strong>{t.terme}</strong>{t.auteur ? ` (${t.auteur})` : ''}.
          </p>
          <p><strong>Définition{' '}:</strong> {t.def}</p>
          <Reflex t={t} />
        </FeedbackCard>
      )}

      {answered && (
        <PrimaryButton
          ref={nextRef}
          color={matiere.color}
          onClick={() => onDone([{ question: { question: fr(`Situation : « ${t.terme} »`), type: 'qcm', answer: t.terme }, correct, userAnswer: picked }])}
          className="mt-4"
        >
          {last ? 'Voir le score' : 'Question suivante'}
        </PrimaryButton>
      )}
    </>
  )
}

/* Niveau 2 : le terme est donne, trouver la situation ------------------ */

function QuandUtiliser({ item, d, matiere, last, record, onDone }) {
  const { t, choices } = item
  const k = KIND[t.kind]
  const [picked, setPicked] = useState(null)
  const answered = picked !== null
  const correct = picked === t.situation
  const nextRef = useFocusWhen(answered)

  // Sous chaque mauvaise situation : le terme qu'elle illustre vraiment
  const notes = {}
  for (const id of choices) if (id !== t.id) notes[d.byId[id].situation] = fr(`Ici, on écrirait plutôt « ${d.byId[id].terme} ».`)
  const termOf = (situation) => d.termes.find(x => x.situation === situation)?.terme

  const pick = (choice) => {
    if (answered) return
    setPicked(choice)
    record([{ id: t.id, correct: choice === t.situation }])
  }

  return (
    <>
      <div className="mb-3">
        <TypeBadge color={matiere.color}>Le bon moment</TypeBadge>
      </div>

      <div className="mb-6">
        <p className="text-[14px] text-warm-gray font-medium mb-2">{k.usage}</p>
        <h2 className="font-display font-bold text-[28px] leading-tight tracking-[-0.03em] text-charcoal">{t.terme}</h2>
        <p className="text-[13px] text-warm-gray mt-1">
          {[t.en, t.auteur].filter(Boolean).join(' · ')}
        </p>
      </div>

      <div className="flex-1">
        <ChoiceList
          choices={choices.map(id => d.byId[id].situation)}
          answer={t.situation}
          selected={picked}
          answered={answered}
          onPick={pick}
          notes={notes}
        />
      </div>

      {answered && (
        <FeedbackCard status={correct ? 'correct' : 'wrong'}>
          <p><strong>Définition{' '}:</strong> {t.def}</p>
          <Reflex t={t} />
          {t.confondre && (
            <p><strong>{fr(`Ne pas confondre avec « ${d.byId[t.confondre.avec].terme} » :`)}</strong> {t.confondre.pourquoi}</p>
          )}
        </FeedbackCard>
      )}

      {answered && (
        <PrimaryButton
          ref={nextRef}
          color={matiere.color}
          onClick={() => onDone([{
            question: { question: fr(`Quand écrire « ${t.terme} »`), type: 'qcm', answer: fr(`la situation de « ${t.terme} »`) },
            correct,
            userAnswer: fr(`la situation de « ${termOf(picked)} »`),
          }])}
          className="mt-4"
        >
          {last ? 'Voir le score' : 'Question suivante'}
        </PrimaryButton>
      )}
    </>
  )
}

/* Niveau 3 : une scene d'examen, cocher toutes les notions presentes --- */

function SceneExamen({ item, d, matiere, last, record, onDone }) {
  const { scene, options } = item
  const indices = Object.fromEntries(scene.notions.map(n => [n.id, n.indice]))
  const pourquoi = Object.fromEntries(scene.pieges.map(p => [p.id, p.pourquoi]))
  const [selected, setSelected] = useState(() => new Set())
  const [submitted, setSubmitted] = useState(false)
  const nextRef = useFocusWhen(submitted)

  const toggle = (id) => {
    if (submitted) return
    setSelected(prev => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  // Une notion presente cochee compte comme bonne reponse, oubliee comme erreur ; un piege coche est une confusion
  const submit = () => {
    setSubmitted(true)
    record([
      ...scene.notions.map(n => ({ id: n.id, correct: selected.has(n.id) })),
      ...scene.pieges.filter(p => selected.has(p.id)).map(p => ({ id: p.id, correct: false })),
    ])
  }

  const found = scene.notions.filter(n => selected.has(n.id)).length
  const traps = scene.pieges.filter(p => selected.has(p.id)).length
  const perfect = found === scene.notions.length && traps === 0

  const finish = () => onDone([
    ...scene.notions.map(n => ({
      question: { question: `${scene.titre} · ${d.byId[n.id].terme}`, type: 'qcm', answer: 'présent dans la scène' },
      correct: selected.has(n.id),
      userAnswer: 'oublié',
    })),
    ...scene.pieges.map(p => ({
      question: { question: `${scene.titre} · ${d.byId[p.id].terme} (piège)`, type: 'qcm', answer: 'absent de la scène' },
      correct: !selected.has(p.id),
      userAnswer: 'coché',
    })),
  ])

  return (
    <>
      <div className="mb-3">
        <TypeBadge color={matiere.color}>Scène d’examen</TypeBadge>
      </div>

      <div className="rounded-2xl bg-white border border-sand px-4 py-4 mb-6 elevated">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] mb-1" style={{ color: matiere.color }}>La vidéo · 2{' '}min{' '}30</p>
        <h2 className="font-display font-bold text-[20px] leading-snug tracking-[-0.02em] text-charcoal">{scene.titre}</h2>
        <ol className="mt-3 flex flex-col gap-3">
          {scene.moments.map(m => (
            <li key={m.t} className="flex gap-3">
              <span className="w-9 shrink-0 pt-0.5 text-[12px] font-bold tabular-nums" style={{ color: matiere.color }}>{m.t}</span>
              <p className="text-[15px] leading-relaxed text-charcoal/85">{m.texte}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex-1">
        <h2 className="font-display font-bold text-[20px] leading-snug tracking-[-0.02em] text-charcoal">
          Coche toutes les notions présentes dans la scène
        </h2>
        <p className="text-[13px] text-warm-gray mt-1 mb-4">Il y en a plusieurs, et certaines propositions sont des pièges.</p>
        <div className="flex flex-col gap-2.5">
          {options.map(id => (
            <SceneOption
              key={id}
              t={d.byId[id]}
              color={matiere.color}
              checked={selected.has(id)}
              present={id in indices}
              note={indices[id] || pourquoi[id]}
              submitted={submitted}
              onToggle={() => toggle(id)}
            />
          ))}
        </div>
        {!submitted && (
          <PrimaryButton color={matiere.color} onClick={submit} disabled={selected.size === 0} className="mt-5">
            Voir la correction
          </PrimaryButton>
        )}
      </div>

      {submitted && (
        <FeedbackCard
          status={perfect ? 'correct' : 'neutral'}
          title={`${found} notion${found > 1 ? 's' : ''} repérée${found > 1 ? 's' : ''} sur ${scene.notions.length}`
            + (traps ? ` · ${traps} piège${traps > 1 ? 's' : ''} coché${traps > 1 ? 's' : ''}` : '')}
        >
          <p>{fr('Relis chaque indice : c’est ce que tu écrirais dans ta copie, avec le moment de la vidéo. Touche « Je l’écris » sous une notion pour voir la phrase type.')}</p>
        </FeedbackCard>
      )}

      {submitted && (
        <PrimaryButton ref={nextRef} color={matiere.color} onClick={finish} className="mt-4">
          {last ? 'Voir le score' : 'Scène suivante'}
        </PrimaryButton>
      )}
    </>
  )
}

function SceneOption({ t, color, checked, present, note, submitted, onToggle }) {
  if (!submitted) {
    return (
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={onToggle}
        className={`w-full text-left rounded-xl p-3.5 border text-[15px] font-medium flex items-center gap-3
                    transition-transform duration-150 ease-out active:scale-[0.98] ${focusRing}
                    ${checked ? '' : 'bg-white border-sand text-charcoal hover:border-warm-gray/40'}`}
        style={checked ? { background: `color-mix(in srgb, ${color} 9%, white)`, borderColor: color, color: '#2d2a26' } : undefined}
      >
        <span
          className="flex items-center justify-center w-6 h-6 rounded-md border-2 text-[13px] font-bold text-white shrink-0"
          style={checked ? { background: color, borderColor: color } : { borderColor: '#d9d2c7' }}
        >
          {checked ? '✓' : ''}
        </span>
        <span className="flex-1 min-w-0 leading-snug">{t.terme}</span>
      </button>
    )
  }

  // Apres correction : bien vu, oublie, piege coche ou piege evite
  const s = present
    ? checked
      ? { label: '✓ Bien vu', tone: 'bg-success-light border-success/30', text: 'text-success' }
      : { label: '✗ Oublié', tone: 'bg-error-light border-error/30', text: 'text-error' }
    : checked
      ? { label: fr('✗ Piège : absent de la scène'), tone: 'bg-error-light border-error/30', text: 'text-error' }
      : { label: 'Piège évité', tone: 'bg-white border-sand', text: 'text-warm-gray' }

  return (
    <div className={`pop-in rounded-xl p-3.5 border ${s.tone}`}>
      <div className="flex items-start justify-between gap-3">
        <span className={`font-semibold text-[15px] leading-snug ${present || checked ? 'text-charcoal' : 'text-charcoal/55'}`}>{t.terme}</span>
        <span className={`shrink-0 text-[12px] font-semibold ${s.text}`}>{s.label}</span>
      </div>
      <p className="text-[13px] text-charcoal/70 mt-1 leading-relaxed">{note}</p>
      {present && (
        <details className="group mt-1.5">
          <summary className={`list-none cursor-pointer inline-flex items-center gap-1 text-[12px] font-semibold rounded ${focusRing}`} style={{ color }}>
            <span className="inline-block transition-transform group-open:rotate-90">›</span>
            Je l’écris
          </summary>
          <p className="text-[13px] italic text-charcoal/75 mt-1.5 border-l-2 border-charcoal/15 pl-3 leading-relaxed">{t.ecrire}</p>
        </details>
      )}
    </div>
  )
}
