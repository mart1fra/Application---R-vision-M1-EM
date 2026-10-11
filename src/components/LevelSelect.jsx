import { DATA, DEVOIRS } from '../data'
import { SESSION_SIZE, KIND_LABEL } from '../utils'
import { focusRing } from './ui'

const LEVELS = [
  { id: 'facile', label: 'Facile', desc: 'Notions de base, rappels essentiels', emoji: '🟢' },
  { id: 'moyen', label: 'Moyen', desc: 'Approfondissement, cas pratiques', emoji: '🟡' },
  { id: 'difficile', label: 'Difficile', desc: 'Cas complexes, questions pieges', emoji: '🔴' },
]

const LEVEL_DESC = {
  anglais: {
    facile: 'Que veut dire ce mot ? 3 choix possibles',
    moyen: 'Mots en contexte, pièges, traductions à écrire',
    difficile: 'Expressions à traduire, phrases à compléter',
  },
}

export default function LevelSelect({ matiere, onSelect, onDevoir, onBack }) {
  const pool = DATA[matiere.id] || []
  const devoirs = DEVOIRS[matiere.id] || []
  const docs = [...new Set(devoirs.map(d => d.doc))]

  return (
    <div className="px-5 pt-14 pb-10">
      <button
        onClick={onBack}
        className={`flex items-center gap-1.5 text-warm-gray text-[15px] mb-8 rounded
                   hover:text-charcoal active:opacity-60 transition-opacity ${focusRing}`}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Retour
      </button>

      <header className="mb-10">
        <span className="text-3xl mb-2 block">{matiere.icon}</span>
        <h1
          className="font-display font-bold text-[24px] tracking-[-0.03em] leading-tight"
          style={{ color: matiere.color }}
        >
          {matiere.label}
        </h1>
        <p className="text-warm-gray text-[15px] mt-2">
          Choisis ton niveau de difficulté.
        </p>
      </header>

      <div className="flex flex-col gap-4">
        {LEVELS.map((l) => {
          const n = pool.filter(q => q.level === l.id).length
          return (
            <button
              key={l.id}
              onClick={() => onSelect(l.id)}
              className={`w-full text-left rounded-2xl p-5 bg-white border border-sand
                         hover:border-warm-gray/30 active:scale-[0.97] transition-transform duration-150 ${focusRing}`}
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl">{l.emoji}</span>
                <div className="flex-1 min-w-0">
                  <span className="block font-semibold text-[17px] text-charcoal">{l.label}</span>
                  <span className="block text-warm-gray text-[13px] mt-0.5">{LEVEL_DESC[matiere.id]?.[l.id] || l.desc}</span>
                  {n > 0 && (
                    <span className="block text-warm-gray/70 text-[12px] mt-1">
                      {n > SESSION_SIZE ? `${SESSION_SIZE} questions au hasard parmi ${n}` : `${n} questions`}
                    </span>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {devoirs.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display font-bold text-[21px] tracking-[-0.03em] text-charcoal leading-tight">
            Devoirs <span style={{ color: matiere.color }}>AT HOME</span>
          </h2>
          <p className="text-warm-gray text-[14px] mt-1.5 mb-6 leading-relaxed">
            Les exercices « AT HOME » des documents de cours, recréés en interactif, avec la correction expliquée.
          </p>

          {docs.map(doc => (
            <div key={doc} className="mb-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-warm-gray mb-3">{doc}</p>
              <div className="flex flex-col gap-3">
                {devoirs.filter(d => d.doc === doc).map(d => (
                  d.unavailable ? (
                    <div key={d.id} className="rounded-2xl p-4 border border-dashed border-sand bg-sand/30 flex gap-4">
                      <PageBadge page={d.page} muted />
                      <div className="min-w-0">
                        <span className="block font-semibold text-[15px] text-charcoal/60" lang="en">{d.title}</span>
                        <span className="block text-warm-gray text-[13px] mt-0.5 leading-snug">{d.unavailable}</span>
                      </div>
                    </div>
                  ) : (
                    <button
                      key={d.id}
                      onClick={() => onDevoir(d)}
                      className={`w-full text-left rounded-2xl p-4 bg-white border border-sand elevated
                                 hover:border-warm-gray/30 active:scale-[0.97] transition-transform duration-150 ${focusRing}`}
                    >
                      <div className="flex gap-4 items-center">
                        <PageBadge page={d.page} color={matiere.color} />
                        <div className="flex-1 min-w-0">
                          <span className="block font-semibold text-[15px] text-charcoal leading-snug" lang="en">{d.title}</span>
                          <span className="block text-warm-gray text-[13px] mt-0.5">{d.titleFr}</span>
                          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-[12px] text-warm-gray/80">
                            <span>{KIND_LABEL[d.kind]} · {d.items.length} {d.kind === 'match' ? 'paires' : 'questions'}</span>
                            {d.bonus && (
                              <span className="font-semibold text-systeme bg-systeme/10 px-2 py-0.5 rounded-full">Variante bonus</span>
                            )}
                          </span>
                        </div>
                        <svg className="w-5 h-5 text-warm-gray/40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  )
                ))}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}

function PageBadge({ page, color, muted }) {
  return (
    <span
      className="flex flex-col items-center justify-center w-12 h-14 rounded-xl shrink-0 leading-none"
      style={muted
        ? { background: '#f0ebe3', color: '#6b6560' }
        : { background: `color-mix(in srgb, ${color} 10%, transparent)`, color }}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] opacity-70">page</span>
      <span className="font-display font-bold text-[20px] mt-1">{page}</span>
    </span>
  )
}
