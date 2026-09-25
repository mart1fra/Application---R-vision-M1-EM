import { useState, useEffect, useRef } from 'react'
import { shuffle, checkAnswer } from '../utils'

import anglais from '../data/anglais.json'
import comportement_humain from '../data/comportement_humain.json'
import statistique_informatique from '../data/statistique_informatique.json'
import systeme_information from '../data/systeme_information.json'
import droit_affaires from '../data/droit_affaires.json'

const DATA = { anglais, comportement_humain, statistique_informatique, systeme_information, droit_affaires }

export default function Quiz({ matiere, level, onFinish, onBack }) {
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [selected, setSelected] = useState(null)
  const [inputVal, setInputVal] = useState('')
  const [isCorrect, setIsCorrect] = useState(false)
  const [results, setResults] = useState([])
  const inputRef = useRef(null)

  useEffect(() => {
    const data = DATA[matiere.id] || []
    const filtered = data.filter(q => q.level === level)
    setQuestions(shuffle(filtered))
  }, [matiere.id, level])

  const q = questions[current]
  if (!q) return (
    <div className="px-5 pt-14 text-center text-warm-gray">
      <p className="text-[17px]">Aucun exercice disponible pour ce niveau.</p>
      <button onClick={onBack} className="mt-6 text-charcoal font-semibold underline">Retour</button>
    </div>
  )

  const total = questions.length
  const progress = ((current) / total) * 100

  const handleAnswer = (answer) => {
    if (answered) return
    setAnswered(true)

    let correct = false
    if (q.type === 'qcm') {
      setSelected(answer)
      correct = answer === q.answer
    } else if (q.type === 'fill') {
      correct = checkAnswer(inputVal, q.answers)
    } else if (q.type === 'free' || q.type === 'translation') {
      correct = checkAnswer(inputVal, q.answers)
    }
    setIsCorrect(correct)
    setResults(prev => [...prev, { question: q, correct, userAnswer: q.type === 'qcm' ? answer : inputVal }])
  }

  const next = () => {
    if (current + 1 >= total) {
      onFinish(results)
    } else {
      setCurrent(c => c + 1)
      setAnswered(false)
      setSelected(null)
      setInputVal('')
      setIsCorrect(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputVal.trim() && !answered) {
      handleAnswer()
    } else if (e.key === 'Enter' && answered) {
      next()
    }
  }

  return (
    <div className="px-5 pt-6 pb-8 flex flex-col min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-warm-gray text-[14px]
                     active:opacity-60 transition-opacity
                     focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Quitter
        </button>
        <span className="text-[14px] text-warm-gray font-medium">
          {current + 1} / {total}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-sand rounded-full overflow-hidden mb-8">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%`, background: matiere.color }}
        />
      </div>

      {/* Question type badge */}
      <div className="mb-3">
        <span
          className="inline-block text-[11px] font-semibold uppercase tracking-[0.08em] px-2.5 py-1 rounded-full"
          style={{
            color: matiere.color,
            background: `color-mix(in srgb, ${matiere.color} 10%, transparent)`
          }}
        >
          {q.type === 'qcm' ? 'QCM' : q.type === 'fill' ? 'Texte a trous' : q.type === 'translation' ? 'Traduction' : 'Reponse libre'}
        </span>
      </div>

      {/* Question */}
      <h2 className="font-display font-bold text-[20px] leading-snug tracking-[-0.02em] text-charcoal mb-6">
        {q.type === 'fill' ? (
          <span dangerouslySetInnerHTML={{
            __html: q.question.replace(/___/g, '<span class="inline-block w-24 border-b-2 border-dashed border-warm-gray/40 mx-1">&nbsp;</span>')
          }} />
        ) : q.question}
      </h2>

      {/* Answer area */}
      <div className="flex-1">
        {q.type === 'qcm' && (
          <div className="flex flex-col gap-3">
            {q.choices.map((choice, i) => {
              let bg = 'bg-white border-sand'
              let textColor = 'text-charcoal'
              if (answered) {
                if (choice === q.answer) {
                  bg = 'bg-success-light border-success/30'
                  textColor = 'text-success'
                } else if (choice === selected && !isCorrect) {
                  bg = 'bg-error-light border-error/30'
                  textColor = 'text-error'
                }
              }
              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(choice)}
                  disabled={answered}
                  className={`w-full text-left rounded-xl p-4 border text-[16px] font-medium
                             transition-all duration-200
                             active:scale-[0.98]
                             focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal
                             disabled:cursor-default
                             ${bg} ${textColor}`}
                >
                  <span className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg text-[13px] font-bold shrink-0
                                     bg-sand/60 text-warm-gray">
                      {String.fromCharCode(65 + i)}
                    </span>
                    {choice}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {(q.type === 'fill' || q.type === 'free' || q.type === 'translation') && (
          <div>
            {q.type === 'translation' && q.direction && (
              <p className="text-[13px] text-warm-gray mb-2">
                {q.direction === 'fr-en' ? 'Traduire en anglais' : 'Traduire en francais'}
              </p>
            )}
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={answered}
              placeholder="Ta reponse..."
              className="w-full rounded-xl border border-sand bg-white px-4 py-4 text-[16px]
                         placeholder:text-warm-gray/40
                         focus:outline-2 focus:outline-offset-0 focus:border-transparent
                         disabled:bg-sand/30"
              style={{ outlineColor: matiere.color }}
              autoComplete="off"
              autoCapitalize="off"
            />
            {!answered && (
              <button
                onClick={() => handleAnswer()}
                disabled={!inputVal.trim()}
                className="w-full mt-4 rounded-xl py-4 text-[16px] font-semibold text-white
                           transition-all duration-200
                           active:scale-[0.97]
                           disabled:opacity-40 disabled:cursor-not-allowed
                           focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                style={{ background: matiere.color }}
              >
                Valider
              </button>
            )}
          </div>
        )}
      </div>

      {/* Feedback */}
      {answered && (
        <div className={`mt-6 rounded-xl p-4 ${isCorrect ? 'bg-success-light border border-success/20' : 'bg-error-light border border-error/20'}`}>
          <p className={`font-semibold text-[15px] mb-1 ${isCorrect ? 'text-success' : 'text-error'}`}>
            {isCorrect ? 'Bonne reponse !' : 'Mauvaise reponse'}
          </p>
          {!isCorrect && q.type === 'qcm' && (
            <p className="text-[14px] text-charcoal/70">
              Reponse correcte : <strong>{q.answer}</strong>
            </p>
          )}
          {!isCorrect && (q.type === 'fill' || q.type === 'free' || q.type === 'translation') && (
            <p className="text-[14px] text-charcoal/70">
              {q.answers.length === 1
                ? <>Reponse attendue : <strong>{q.answers[0]}</strong></>
                : <>Reponses acceptees : <strong>{q.answers.join(' / ')}</strong></>
              }
            </p>
          )}
          {q.explanation && (
            <p className="text-[13px] text-charcoal/60 mt-2 leading-relaxed">
              {q.explanation}
            </p>
          )}
        </div>
      )}

      {/* Next button */}
      {answered && (
        <button
          onClick={next}
          className="w-full mt-4 rounded-xl py-4 text-[16px] font-semibold text-white
                     transition-all duration-200
                     active:scale-[0.97]
                     focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          style={{ background: matiere.color }}
        >
          {current + 1 >= total ? 'Voir le score' : 'Question suivante'}
        </button>
      )}
    </div>
  )
}
