import { useState, useRef, useEffect } from 'react'
import { shuffle, gradeAnswer, SESSION_SIZE } from '../utils'
import { TappableText, GlossaryHint } from './Glossary'
import {
  ChoiceList, FeedbackCard, GapSentence, TextAnswer, HintButton, BackButton,
  ProgressBar, TypeBadge, PrimaryButton, GhostButton,
} from './ui'

import { DATA } from '../data'

const TYPE_LABEL = { qcm: 'QCM', fill: 'Texte à trous', translation: 'Traduction', free: 'Réponse libre' }

// Tire une serie de questions et melange l'ordre des choix de chaque QCM :
// la bonne reponse n'est jamais toujours a la meme place.
function buildSession(matiereId, level) {
  const pool = (DATA[matiereId] || []).filter(q => q.level === level)
  return shuffle(pool)
    .slice(0, SESSION_SIZE)
    .map(q => (q.type === 'qcm' ? { ...q, choices: shuffle(q.choices) } : q))
}

export default function Quiz({ matiere, level, onFinish, onBack }) {
  const [questions] = useState(() => buildSession(matiere.id, level))
  const [current, setCurrent] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [selected, setSelected] = useState(null)
  const [inputVal, setInputVal] = useState('')
  const [grade, setGrade] = useState(null)
  const [hintShown, setHintShown] = useState(false)
  const [results, setResults] = useState([])
  const nextRef = useRef(null)

  const q = questions[current]
  const english = matiere.id === 'anglais'

  useEffect(() => {
    if (answered) nextRef.current?.focus()
  }, [answered])

  if (!q) return (
    <div className="px-5 pt-14 text-center text-warm-gray">
      <p className="text-[17px]">Aucun exercice disponible pour ce niveau.</p>
      <button onClick={onBack} className="mt-6 text-charcoal font-semibold underline">Retour</button>
    </div>
  )

  const total = questions.length
  const isWritten = q.type !== 'qcm'
  const accepted = q.type === 'qcm' ? [q.answer] : q.answers
  const isCorrect = grade?.correct

  const record = (correct, userAnswer) => {
    setAnswered(true)
    setResults(prev => [...prev, { question: q, correct, userAnswer }])
  }

  const pickChoice = (choice) => {
    if (answered) return
    setSelected(choice)
    const correct = choice === q.answer
    setGrade({ correct, typo: false })
    record(correct, choice)
  }

  const submitWritten = () => {
    if (answered || !inputVal.trim()) return
    const g = gradeAnswer(inputVal, q.answers, q.tol)
    setGrade(g)
    record(g.correct, inputVal)
  }

  const giveUp = () => {
    if (answered) return
    setGrade({ correct: false, typo: false })
    record(false, '—')
  }

  const next = () => {
    if (current + 1 >= total) {
      onFinish(results)
      return
    }
    setCurrent(c => c + 1)
    setAnswered(false)
    setSelected(null)
    setInputVal('')
    setGrade(null)
    setHintShown(false)
  }

  // Mots a ne pas traduire tant que la question n'est pas corrigee (sinon la traduction donne la reponse)
  const exclude = answered ? undefined : [q.word, q.answer, ...(q.answers || []), ...(q.choices || [])].filter(Boolean)
  const gapText = q.sentence || (q.type === 'fill' ? q.question : null)
  const gapFill = answered ? (q.type === 'qcm' ? q.answer : q.answers[0]) : null
  const prompt = q.prompt || (q.type === 'translation'
    ? (q.direction === 'fr-en' ? 'Traduis en anglais' : 'Traduis en français')
    : q.type === 'fill' ? 'Complète la phrase' : null)
  const hasEnglishText = english && (q.definition || gapText || q.example)

  return (
    <div className="px-5 pt-6 pb-8 flex flex-col min-h-screen">
      <div className="flex items-center justify-between mb-4">
        <BackButton onClick={onBack} />
        <span className="text-[14px] text-warm-gray font-medium tabular-nums">{current + 1} / {total}</span>
      </div>

      <div className="mb-8">
        <ProgressBar value={current / total} color={matiere.color} />
      </div>

      <div className="mb-3 flex items-center gap-2">
        <TypeBadge color={matiere.color}>{q.context ? 'Étude de cas' : TYPE_LABEL[q.type]}</TypeBadge>
        {q.source && <span className="text-[11px] text-warm-gray/80">{q.source}</span>}
      </div>

      {hasEnglishText && !answered && <GlossaryHint />}

      {/* Situation d'une etude de cas */}
      {q.context && (
        <div className="rounded-2xl bg-white border border-sand px-4 py-4 mb-5 elevated">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] mb-1.5" style={{ color: matiere.color }}>Situation</p>
          <p className="text-[16px] leading-relaxed text-charcoal">{q.context}</p>
        </div>
      )}

      {/* Enonce */}
      <div className="mb-6">
        {prompt && <p className="text-[14px] text-warm-gray font-medium mb-2">{prompt}</p>}
        {q.word ? (
          <h2
            lang={q.wordLang === 'fr' ? 'fr' : english ? 'en' : undefined}
            className="font-display font-bold text-[30px] leading-tight tracking-[-0.03em] text-charcoal"
          >
            {q.word}
          </h2>
        ) : q.definition ? (
          <blockquote
            lang="en"
            className="font-display text-[20px] leading-snug tracking-[-0.01em] text-charcoal border-l-4 pl-4"
            style={{ borderColor: matiere.color }}
          >
            {english ? <TappableText text={q.definition} exclude={exclude} /> : q.definition}
          </blockquote>
        ) : gapText ? (
          <h2 lang={english ? 'en' : undefined} className="font-display font-bold text-[20px] leading-[1.6] tracking-[-0.02em] text-charcoal">
            <GapSentence
              text={gapText}
              fill={gapFill}
              fillTone="bg-success-light text-success"
              exclude={exclude}
              translatable={english}
            />
          </h2>
        ) : (
          <h2 className="font-display font-bold text-[20px] leading-snug tracking-[-0.02em] text-charcoal">
            {q.question}
          </h2>
        )}
      </div>

      {/* Reponse */}
      <div className="flex-1">
        {q.type === 'qcm' && (
          <ChoiceList
            choices={q.choices}
            answer={q.answer}
            selected={selected}
            answered={answered}
            onPick={pickChoice}
            notes={q.notes}
            english={q.choicesLang === 'en'}
          />
        )}

        {isWritten && (
          <div>
            <TextAnswer
              value={inputVal}
              onChange={setInputVal}
              onSubmit={submitWritten}
              disabled={answered}
              color={matiere.color}
            />
            {!answered && (
              <>
                <HintButton hint={q.hint} shown={hintShown} onShow={() => setHintShown(true)} />
                <div className="flex gap-3 mt-4">
                  <GhostButton onClick={giveUp} className="shrink-0">Je ne sais pas</GhostButton>
                  <PrimaryButton color={matiere.color} onClick={submitWritten} disabled={!inputVal.trim()}>
                    Valider
                  </PrimaryButton>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Correction */}
      {answered && (
        <FeedbackCard status={grade.typo ? 'typo' : isCorrect ? 'correct' : 'wrong'}>
          {!isCorrect && q.type === 'qcm' && (
            <p>Réponse correcte : <strong lang={q.choicesLang === 'en' ? 'en' : undefined}>{q.answer}</strong></p>
          )}
          {isWritten && !isCorrect && (
            <p>
              {accepted.length === 1
                ? <>Réponse attendue : <strong>{accepted[0]}</strong></>
                : <>Réponses acceptées : <strong>{accepted.join(' / ')}</strong></>}
            </p>
          )}
          {grade.typo && <p>Orthographe exacte : <strong>{grade.closest}</strong></p>}
          {q.explanation && <p>{q.explanation}</p>}
          {q.example && (
            <p lang="en" className="italic text-charcoal/70 border-l-2 border-charcoal/15 pl-3">
              {english ? <TappableText text={q.example} /> : q.example}
            </p>
          )}
        </FeedbackCard>
      )}

      {answered && (
        <PrimaryButton ref={nextRef} color={matiere.color} onClick={next} className="mt-4">
          {current + 1 >= total ? 'Voir le score' : 'Question suivante'}
        </PrimaryButton>
      )}
    </div>
  )
}
