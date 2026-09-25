const LEVELS = [
  { id: 'facile', label: 'Facile', desc: 'Notions de base, rappels essentiels', emoji: '🟢' },
  { id: 'moyen', label: 'Moyen', desc: 'Approfondissement, cas pratiques', emoji: '🟡' },
  { id: 'difficile', label: 'Difficile', desc: 'Cas complexes, questions pieges', emoji: '🔴' },
]

export default function LevelSelect({ matiere, onSelect, onBack }) {
  return (
    <div className="px-5 pt-14 pb-8">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-warm-gray text-[15px] mb-8
                   active:opacity-60 transition-opacity
                   focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal"
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
          Choisis ton niveau de difficulte.
        </p>
      </header>

      <div className="flex flex-col gap-4">
        {LEVELS.map((l) => (
          <button
            key={l.id}
            onClick={() => onSelect(l.id)}
            className="w-full text-left rounded-2xl p-5 bg-white border border-sand
                       active:scale-[0.97] transition-transform duration-150
                       focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal"
          >
            <div className="flex items-center gap-4">
              <span className="text-2xl">{l.emoji}</span>
              <div>
                <span className="block font-semibold text-[17px] text-charcoal">{l.label}</span>
                <span className="block text-warm-gray text-[13px] mt-0.5">{l.desc}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
