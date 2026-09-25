export default function Score({ results, matiere, onHome, onRetry }) {
  const correct = results.filter(r => r.correct).length
  const total = results.length
  const pct = Math.round((correct / total) * 100)

  let message = ''
  let emoji = ''
  if (pct === 100) { message = 'Parfait !'; emoji = '🏆' }
  else if (pct >= 80) { message = 'Excellent !'; emoji = '🌟' }
  else if (pct >= 60) { message = 'Bien joue !'; emoji = '👏' }
  else if (pct >= 40) { message = 'Peut mieux faire'; emoji = '💪' }
  else { message = 'Continue a reviser'; emoji = '📚' }

  const radius = 54
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (pct / 100) * circumference

  return (
    <div className="px-5 pt-14 pb-8 flex flex-col items-center min-h-screen">
      <span className="text-5xl mb-4">{emoji}</span>
      <h1
        className="font-display font-bold text-[26px] tracking-[-0.03em] mb-2"
        style={{ color: matiere.color }}
      >
        {message}
      </h1>
      <p className="text-warm-gray text-[15px] mb-10">{matiere.label}</p>

      {/* Score circle */}
      <div className="relative w-40 h-40 mb-10">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#e8e4de" strokeWidth="8" />
          <circle
            cx="60" cy="60" r={radius} fill="none"
            stroke={matiere.color} strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[36px] font-bold text-charcoal leading-none">{pct}%</span>
          <span className="text-[13px] text-warm-gray mt-1">{correct}/{total}</span>
        </div>
      </div>

      {/* Results list */}
      <div className="w-full space-y-2 mb-10">
        {results.map((r, i) => (
          <div
            key={i}
            className={`rounded-xl p-3.5 border text-left ${
              r.correct ? 'bg-success-light/50 border-success/15' : 'bg-error-light/50 border-error/15'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <span className={`text-[14px] mt-0.5 ${r.correct ? 'text-success' : 'text-error'}`}>
                {r.correct ? '✓' : '✗'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] text-charcoal leading-snug">{r.question.question}</p>
                {!r.correct && (
                  <p className="text-[12px] text-warm-gray mt-1">
                    Ta reponse : {r.userAnswer} &middot; Correcte : {r.question.type === 'qcm' ? r.question.answer : r.question.answers[0]}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="w-full flex flex-col gap-3 mt-auto">
        <button
          onClick={onRetry}
          className="w-full rounded-xl py-4 text-[16px] font-semibold text-white
                     active:scale-[0.97] transition-transform duration-150
                     focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          style={{ background: matiere.color }}
        >
          Recommencer
        </button>
        <button
          onClick={onHome}
          className="w-full rounded-xl py-4 text-[16px] font-semibold text-charcoal bg-white border border-sand
                     active:scale-[0.97] transition-transform duration-150
                     focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal"
        >
          Changer de matiere
        </button>
      </div>
    </div>
  )
}
