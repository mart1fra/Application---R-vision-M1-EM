import { MATIERES } from '../utils'

export default function Home({ onSelect }) {
  return (
    <div className="px-5 pt-14 pb-8">
      <header className="mb-10">
        <h1 className="font-display font-bold text-[28px] tracking-[-0.03em] text-charcoal leading-tight">
          ReviseM1
        </h1>
        <p className="text-warm-gray text-[15px] mt-2 leading-relaxed">
          Choisis une matiere pour commencer ta revision.
        </p>
      </header>

      <div className="flex flex-col gap-4">
        {MATIERES.map((m) => (
          <button
            key={m.id}
            onClick={() => onSelect(m)}
            className="group relative w-full text-left rounded-2xl p-5 bg-white border border-sand
                       active:scale-[0.97] transition-transform duration-150
                       focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal"
            style={{ '--card-color': m.color }}
          >
            <div
              className="absolute inset-0 rounded-2xl opacity-[0.06]"
              style={{ background: m.color }}
            />
            <div className="relative flex items-center gap-4">
              <span
                className="flex items-center justify-center w-14 h-14 rounded-xl text-[28px] shrink-0"
                style={{ background: `color-mix(in srgb, ${m.color} 12%, transparent)` }}
              >
                {m.icon}
              </span>
              <div className="flex-1 min-w-0">
                <span
                  className="block font-semibold text-[17px] leading-snug"
                  style={{ color: m.color }}
                >
                  {m.label}
                </span>
                <span className="block text-warm-gray text-[13px] mt-0.5">
                  Facile &middot; Moyen &middot; Difficile
                </span>
              </div>
              <svg className="w-5 h-5 text-warm-gray/40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
