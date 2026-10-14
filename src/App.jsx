import { useState, useEffect, lazy, Suspense } from 'react'
import Home from './components/Home'
import LevelSelect from './components/LevelSelect'
import Quiz from './components/Quiz'
import Devoir from './components/Devoir'
import Fiche from './components/Fiche'
import Score from './components/Score'
import GlossaireQuiz, { GlossaireMenu } from './components/GlossaireCours'
import { GlossaryProvider } from './components/Glossary'

const Admin = lazy(() => import('./components/Admin'))

function App() {
  const [screen, setScreen] = useState('home')
  const [matiere, setMatiere] = useState(null)
  const [level, setLevel] = useState(null)
  const [devoir, setDevoir] = useState(null)
  // Niveau du glossaire en cours (1 ou 2), null hors glossaire
  const [gloss, setGloss] = useState(null)
  const [results, setResults] = useState(null)
  const [run, setRun] = useState(0)

  useEffect(() => {
    if (window.location.pathname === '/admin') {
      setScreen('admin')
    }
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [screen, run])

  const goHome = () => {
    setScreen('home')
    setMatiere(null)
    setLevel(null)
    setDevoir(null)
    setResults(null)
    window.history.replaceState(null, '', '/')
  }

  const goLevels = () => {
    setScreen('level')
    setDevoir(null)
    setGloss(null)
    setResults(null)
  }

  const selectMatiere = (m) => {
    setMatiere(m)
    setScreen('level')
  }

  const selectLevel = (l) => {
    setLevel(l)
    setDevoir(null)
    setScreen('quiz')
  }

  const selectDevoir = (d) => {
    setDevoir(d)
    setScreen('devoir')
  }

  const openGlossaire = () => {
    setGloss(null)
    setResults(null)
    setScreen('glossaire')
  }

  const startGlossaire = (l) => {
    setGloss(l)
    setDevoir(null)
    setScreen('glossaire-quiz')
  }

  const finish = (r) => {
    setResults(r)
    setScreen('score')
  }

  const retry = () => {
    setResults(null)
    setRun(n => n + 1)
    setScreen(gloss ? 'glossaire-quiz' : devoir ? 'devoir' : 'quiz')
  }

  if (screen === 'admin') {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-cream flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-charcoal/20 border-t-charcoal rounded-full animate-spin" />
        </div>
      }>
        <Admin onBack={goHome} />
      </Suspense>
    )
  }

  return (
    <GlossaryProvider>
      <div className="min-h-screen bg-cream">
        <div className="max-w-[430px] mx-auto min-h-screen relative">
          {screen === 'home' && <Home onSelect={selectMatiere} />}
          {screen === 'level' && (
            <LevelSelect
              matiere={matiere}
              onSelect={selectLevel}
              onDevoir={selectDevoir}
              onFiche={() => setScreen('fiche')}
              onGlossaire={openGlossaire}
              onBack={goHome}
            />
          )}
          {screen === 'fiche' && <Fiche matiere={matiere} onBack={goLevels} />}
          {screen === 'glossaire' && <GlossaireMenu matiere={matiere} onStart={startGlossaire} onBack={goLevels} />}
          {screen === 'glossaire-quiz' && (
            <GlossaireQuiz key={`${gloss}-${run}`} matiere={matiere} level={gloss} onFinish={finish} onBack={openGlossaire} />
          )}
          {screen === 'quiz' && (
            <Quiz key={run} matiere={matiere} level={level} onFinish={finish} onBack={goLevels} />
          )}
          {screen === 'devoir' && (
            <Devoir key={`${devoir.id}-${run}`} devoir={devoir} matiere={matiere} onFinish={finish} onBack={goLevels} />
          )}
          {screen === 'score' && (
            <Score
              results={results}
              matiere={matiere}
              subtitle={gloss ? `Glossaire · niveau ${gloss}` : devoir ? `${devoir.title} · p. ${devoir.page}` : undefined}
              onRetry={retry}
              onHome={gloss ? openGlossaire : devoir ? goLevels : goHome}
              homeLabel={gloss ? 'Retour au glossaire' : devoir ? 'Retour aux devoirs' : undefined}
            />
          )}
        </div>
      </div>
    </GlossaryProvider>
  )
}

export default App
