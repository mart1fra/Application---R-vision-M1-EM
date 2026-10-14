import { useState } from 'react'
import { FICHES } from '../data'
import { BackButton, focusRing } from './ui'

const TABS = [
  { id: 'resume', label: 'Résumé' },
  { id: 'lexique', label: 'Lexique FR / EN' },
]

// Fiche de cours d'une matiere : resume par parties + lexique des termes avec leur traduction anglaise
export default function Fiche({ matiere, onBack }) {
  const fiche = FICHES[matiere.id]
  const [tab, setTab] = useState('resume')

  const switchTab = (id) => {
    setTab(id)
    window.scrollTo(0, 0)
  }

  return (
    <div className="px-5 pt-6 pb-12">
      <BackButton onClick={onBack} label="Retour" />

      <header className="mt-6 mb-4">
        <span className="text-3xl mb-2 block">📖</span>
        <h1
          className="font-display font-bold text-[24px] tracking-[-0.03em] leading-tight"
          style={{ color: matiere.color }}
        >
          {fiche.title}
        </h1>
        <p className="text-warm-gray text-[14px] mt-1.5">{fiche.subtitle}</p>
      </header>

      <div className="sticky top-0 z-10 -mx-5 px-5 py-3 bg-cream">
        <div role="tablist" className="grid grid-cols-2 gap-1 rounded-xl bg-sand p-1">
          {TABS.map(t => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => switchTab(t.id)}
              className={`rounded-lg py-2.5 text-[14px] font-semibold transition-colors ${focusRing} ${
                tab === t.id ? 'bg-white text-charcoal elevated' : 'text-warm-gray hover:text-charcoal'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'resume'
        ? <Resume fiche={fiche} color={matiere.color} />
        : <Lexique fiche={fiche} color={matiere.color} />}
    </div>
  )
}

// Texte avec des passages en gras **comme ceci**
function Rich({ text }) {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) => (
    i % 2
      ? <strong key={i} className="font-semibold text-charcoal"><Bars text={part} /></strong>
      : <Bars key={i} text={part} />
  ))
}

// {{x}} : lettre surmontee d'une barre (moyenne x̄, proportion p̄). Le caractere combinant
// « ̄ » s'affiche decale avec les polices de l'app, d'ou un trait CSS.
function Bars({ text }) {
  return text.split(/\{\{(.+?)\}\}/g).map((part, i) => (
    i % 2 ? <span key={i} className="overline decoration-1">{part}</span> : part
  ))
}

const tint = (color, pct) => `color-mix(in srgb, ${color} ${pct}%, white)`

/* ------------------------------------------------------------------ */
/* Resume                                                              */
/* ------------------------------------------------------------------ */

function Resume({ fiche, color }) {
  const goTo = (id) => document.getElementById(`fiche-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <div className="pt-4">
      <nav aria-label="Sommaire" className="mb-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-warm-gray mb-2">Sommaire</p>
        <ol className="flex flex-col">
          {fiche.sections.map((s, i) => (
            <li key={s.id}>
              <button
                onClick={() => goTo(s.id)}
                className={`flex w-full items-baseline gap-3 rounded-lg px-1 py-1.5 text-left text-[15px] text-charcoal
                            hover:bg-sand/60 active:opacity-60 transition-opacity ${focusRing}`}
              >
                <span className="font-display font-bold tabular-nums w-5 shrink-0" style={{ color }}>{i + 1}</span>
                <span className="leading-snug">{s.title}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div className="flex flex-col gap-14">
        {fiche.sections.map((s, i) => (
          <section key={s.id} id={`fiche-${s.id}`} className="scroll-mt-20">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-warm-gray">
              Partie {i + 1} · {s.source}
            </p>
            <h2 className="font-display font-bold text-[21px] tracking-[-0.02em] leading-tight text-charcoal mt-1 mb-5">
              {s.title}
            </h2>
            <div className="flex flex-col gap-4">
              {s.blocks.map((b, j) => <Block key={j} block={b} color={color} />)}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

function Block({ block: b, color }) {
  switch (b.type) {
    case 'h':
      return <h3 className="font-display font-bold text-[18px] text-charcoal mt-5">{b.text}</h3>
    case 'p':
      return <p className="text-[15px] leading-relaxed text-charcoal/80"><Rich text={b.text} /></p>
    case 'list':
      return <List block={b} color={color} />
    case 'def':
      return <Definition block={b} color={color} />
    case 'example':
      return <Callout label="Exemple" text={b.text} />
    case 'tip':
      return <Callout label="À retenir" text={b.text} color={color} />
    case 'table':
      return <Table block={b} />
    case 'flow':
      return <Flow block={b} color={color} />
    case 'pyramid':
      return <Pyramid levels={b.levels} color={color} />
    case 'stack':
      return <Stack block={b} color={color} />
    default:
      return null
  }
}

function List({ block: b, color }) {
  return (
    <div>
      {b.title && <p className="text-[15px] font-semibold text-charcoal mb-2"><Rich text={b.title} /></p>}
      <ul className="flex flex-col gap-1.5">
        {b.items.map((item, i) => (
          <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed text-charcoal/80">
            <span aria-hidden="true" className="mt-[9px] w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
            <span><Rich text={item} /></span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Lang({ code, lang, children }) {
  return (
    <span className="text-[13px] text-charcoal/75 leading-snug" lang={lang}>
      <span className="inline-block text-[10px] font-bold tracking-[0.08em] text-warm-gray bg-sand rounded px-1.5 py-0.5 mr-1.5 align-[1px]">
        {code}
      </span>
      {children}
    </span>
  )
}

function Definition({ block: b, color }) {
  return (
    <div className="rounded-2xl bg-white border border-sand px-4 py-4 elevated">
      <p className="font-display font-bold text-[17px] leading-tight text-charcoal">{b.term}</p>
      {b.fr && <p className="mt-1.5"><Lang code="FR">{b.fr}</Lang></p>}
      {b.en && <p className="mt-1"><Lang code="EN" lang="en">{b.en}</Lang></p>}
      <p className="text-[15px] leading-relaxed text-charcoal/80 mt-3 border-l-[3px] pl-3" style={{ borderColor: color }}>
        <Rich text={b.text} />
      </p>
      {b.author && <p className="text-[12px] text-warm-gray mt-2 text-right">{b.author}</p>}
    </div>
  )
}

function Callout({ label, text, color }) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 ${color ? '' : 'bg-white border-sand'}`}
      style={color ? { background: tint(color, 9), borderColor: `color-mix(in srgb, ${color} 25%, transparent)` } : undefined}
    >
      <p className={`text-[11px] font-bold uppercase tracking-[0.1em] mb-1 ${color ? '' : 'text-warm-gray'}`} style={color ? { color } : undefined}>
        {label}
      </p>
      <p className="text-[14px] leading-relaxed text-charcoal/80"><Rich text={text} /></p>
    </div>
  )
}

// wide: true → 560 px de large minimum ; un nombre (ex. 760) fixe une autre largeur minimale
function Table({ block: b }) {
  return (
    <div>
      {b.title && <p className="text-[15px] font-semibold text-charcoal mb-2">{b.title}</p>}
      <div className="overflow-x-auto rounded-xl border border-sand bg-white">
        <table
          className="w-full text-left text-[13px] leading-snug"
          style={b.wide ? { minWidth: typeof b.wide === 'number' ? b.wide : 560 } : undefined}
        >
          <thead className="bg-sand/60">
            <tr>
              {b.head.map((h, i) => (
                <th key={i} scope="col" className="px-3 py-2 font-semibold text-charcoal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {b.rows.map((row, i) => (
              <tr key={i} className="border-t border-sand align-top">
                {row.map((cell, j) => (
                  <td key={j} className="px-3 py-2 text-charcoal/80"><Rich text={cell} /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {b.wide && <p className="text-[11px] text-warm-gray/80 mt-1.5">Fais glisser le tableau vers la gauche pour tout voir.</p>}
    </div>
  )
}

// Schema en etapes : A → B → C (affiche de haut en bas)
function Flow({ block: b, color }) {
  return (
    <div className="rounded-2xl bg-white border border-sand px-4 py-4">
      {b.title && <p className="text-[13px] font-semibold text-charcoal mb-3 leading-snug">{b.title}</p>}
      <ol className="flex flex-col items-stretch">
        {b.steps.map((step, i) => (
          <li key={i} className="flex flex-col items-center">
            {i > 0 && <span aria-hidden="true" className="text-warm-gray/60 text-[13px] leading-none py-1">↓</span>}
            <span
              className="w-full text-center rounded-lg px-3 py-2 text-[13px] font-medium leading-snug text-charcoal"
              style={{ background: tint(color, 11) }}
            >
              {step}
            </span>
          </li>
        ))}
      </ol>
      {b.note && <p className="text-[13px] leading-relaxed text-charcoal/75 mt-3"><Rich text={b.note} /></p>}
    </div>
  )
}

// Pyramide : le premier niveau est le sommet (le plus etroit)
function Pyramid({ levels, color }) {
  const last = Math.max(levels.length - 1, 1)
  return (
    <div className="flex flex-col items-center gap-1.5">
      {levels.map((l, i) => (
        <div
          key={i}
          className="rounded-xl px-3 py-2.5 text-center"
          style={{ width: `${Math.round(60 + (40 * i) / last)}%`, background: tint(color, 26 - i * 5) }}
        >
          <p className="font-display font-bold text-[16px] leading-tight text-charcoal">{l.label}</p>
          <p className="text-[12px] leading-snug text-charcoal/80 mt-0.5">{l.text}</p>
          <p className="text-[11px] leading-snug text-charcoal/60 mt-0.5">{l.sub}</p>
        </div>
      ))}
    </div>
  )
}

// Blocs empiles relies par des fleches (ex. les 3 sous-systemes de Le Moigne)
function Stack({ block: b, color }) {
  return (
    <div className="rounded-2xl bg-white border border-sand px-4 py-4">
      {b.title && <p className="text-[13px] font-semibold text-charcoal mb-3 leading-snug">{b.title}</p>}
      {b.items.map((item, i) => (
        <div key={i}>
          {i > 0 && <p className="text-center text-[12px] text-warm-gray py-1.5">{b.links[i - 1]}</p>}
          <div
            className={`rounded-xl border px-3 py-2.5 ${item.star ? '' : 'border-sand'}`}
            style={item.star ? { borderColor: color, background: tint(color, 9) } : undefined}
          >
            <p className="font-semibold text-[14px] text-charcoal">{item.title}</p>
            <p className="text-[13px] text-charcoal/75">{item.text}</p>
            <p className="text-[12px] text-warm-gray mt-1 leading-snug">→ {item.out}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Lexique                                                             */
/* ------------------------------------------------------------------ */

const normalize = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

function Lexique({ fiche, color }) {
  const [query, setQuery] = useState('')
  const [hideEn, setHideEn] = useState(false)
  const [revealed, setRevealed] = useState(() => new Set())

  // Recherche sur le debut des mots : « erp » trouve ERP mais pas « interprétation »
  const q = normalize(query.trim())
  const matches = (e) => {
    if (!q) return true
    const text = normalize([e.term, e.fr, e.en, e.def].filter(Boolean).join(' '))
    return q.includes(' ') ? text.includes(q) : text.split(/[^a-z0-9]+/).some(w => w.startsWith(q))
  }
  const groups = fiche.glossaryCats
    .map(c => ({ ...c, entries: fiche.glossary.filter(e => e.cat === c.id && matches(e)) }))
    .filter(g => g.entries.length > 0)

  const toggleHide = () => {
    setHideEn(h => !h)
    setRevealed(new Set())
  }
  const reveal = (term) => setRevealed(prev => new Set(prev).add(term))

  return (
    <div className="pt-4">
      <p className="text-[14px] text-warm-gray leading-relaxed mb-4">
        {fiche.glossary.length} termes avec leur traduction anglaise. Ceux marqués <ExtraBadge /> ne sont pas définis
        dans les diapos : leur définition complète le cours.
      </p>

      <input
        type="search"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Chercher un terme (ERP, donnée, SIG…)"
        aria-label="Chercher un terme"
        className="w-full rounded-xl border border-sand bg-white px-4 py-3.5 text-[16px]
                   placeholder:text-warm-gray/50 focus:outline-2 focus:outline-offset-0 focus:border-transparent"
        style={{ outlineColor: color }}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
      />

      <button
        type="button"
        role="switch"
        aria-checked={hideEn}
        onClick={toggleHide}
        className={`mt-3 w-full flex items-center justify-between gap-4 rounded-xl bg-white border border-sand px-4 py-3 text-left
                    active:scale-[0.98] transition-transform duration-150 ${focusRing}`}
      >
        <span>
          <span className="block text-[15px] font-semibold text-charcoal">Cacher l'anglais</span>
          <span className="block text-[12px] text-warm-gray mt-0.5">Pour t'entraîner : retrouve l'anglais, puis touche pour vérifier</span>
        </span>
        <span
          aria-hidden="true"
          className="relative w-11 h-6 rounded-full shrink-0 transition-colors"
          style={{ background: hideEn ? color : '#e3ddd3' }}
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${hideEn ? 'translate-x-5' : ''}`} />
        </span>
      </button>

      {groups.map(g => (
        <section key={g.id} className="mt-8">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.1em] text-warm-gray mb-3">{g.label}</h2>
          <div className="flex flex-col gap-3">
            {g.entries.map(e => (
              <Entry
                key={e.term}
                entry={e}
                hidden={hideEn && Boolean(e.en) && !revealed.has(e.term)}
                onReveal={() => reveal(e.term)}
                color={color}
              />
            ))}
          </div>
        </section>
      ))}

      {groups.length === 0 && (
        <p className="mt-10 text-center text-warm-gray text-[15px]">Aucun terme ne correspond à « {query} ».</p>
      )}
    </div>
  )
}

function ExtraBadge() {
  return (
    <span className="inline-block text-[10px] font-semibold text-warm-gray bg-sand rounded-full px-2 py-0.5 align-[1px] whitespace-nowrap">
      hors diapos
    </span>
  )
}

function Entry({ entry: e, hidden, onReveal, color }) {
  return (
    <article className="rounded-2xl bg-white border border-sand px-4 py-3.5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display font-bold text-[18px] leading-tight text-charcoal">{e.term}</h3>
        {e.extra && <ExtraBadge />}
      </div>
      {e.fr && <p className="mt-1.5"><Lang code="FR">{e.fr}</Lang></p>}
      {e.en && (
        <p className="mt-1">
          {hidden ? (
            <button
              onClick={onReveal}
              className={`pop-in inline-flex items-center rounded-lg border border-dashed px-2.5 py-1 text-[13px] font-semibold
                          active:scale-[0.97] transition-transform duration-150 ${focusRing}`}
              style={{ color, borderColor: `color-mix(in srgb, ${color} 45%, transparent)` }}
            >
              EN · Toucher pour voir
            </button>
          ) : (
            <Lang code="EN" lang="en">{e.en}</Lang>
          )}
        </p>
      )}
      <p className="text-[13px] leading-relaxed text-charcoal/70 mt-2"><Bars text={e.def} /></p>
    </article>
  )
}
