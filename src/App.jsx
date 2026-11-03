import { useState, useEffect, lazy, Suspense } from 'react'
import Home from './components/Home'
import LevelSelect from './components/LevelSelect'
import Quiz from './components/Quiz'
import Devoir from './components/Devoir'
import Fiche from './components/Fiche'
import Score from './components/Score'
import GlossaireQuiz, { GlossaireMenu } from './components/GlossaireCours'
import DissertationQuiz, { DissertationMenu, DissertationFiches, DissertationGrilles } from './components/Dissertation'
import { GlossaryProvider } from './components/Glossary'

const Admin = lazy(() => import('./components/Admin'))

function App() {
  const [screen, setScreen] = useState('home')
  const [matiere, setMatiere] = useState(null)
  const [level, setLevel] = useState(null)
  const [devoir, setDevoir] = useState(null)
  // Niveau du glossaire en cours (1 ou 2), null hors glossaire
  const [gloss, setGloss] = useState(null)
  // Niveau de la serie « Préparer la dissertation » (1 a 3), null hors de ces series ; terme a afficher dans les fiches reflexe
  const [dissert, setDissert] = useState(null)
  const [focusTerm, setFocusTerm] = useState(null)
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
    setDissert(null)
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

  const openDissertation = () => {
    setDissert(null)
    setResults(null)
    setScreen('dissert')
  }

  const startDissertation = (l) => {
    setDissert(l)
    setDevoir(null)
    setScreen('dissert-quiz')
  }

  const openFiches = (id = null) => {
    setFocusTerm(id)
    setScreen('dissert-fiches')
  }

  const finish = (r) => {
    setResults(r)
    setScreen('score')
  }

  const retry = () => {
    setResults(null)
    setRun(n => n + 1)
    setScreen(dissert ? 'dissert-quiz' : gloss ? 'glossaire-quiz' : devoir ? 'devoir' : 'quiz')
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
              onDissertation={openDissertation}
              onBack={goHome}
            />
          )}
          {screen === 'fiche' && <Fiche matiere={matiere} onBack={goLevels} />}
          {screen === 'glossaire' && <GlossaireMenu matiere={matiere} onStart={startGlossaire} onBack={goLevels} />}
          {screen === 'glossaire-quiz' && (
            <GlossaireQuiz key={`${gloss}-${run}`} matiere={matiere} level={gloss} onFinish={finish} onBack={openGlossaire} />
          )}
          {screen === 'dissert' && (
            <DissertationMenu
              matiere={matiere}
              onStart={startDissertation}
              onFiches={() => openFiches()}
              onGrilles={() => setScreen('dissert-grilles')}
              onBack={goLevels}
            />
          )}
          {screen === 'dissert-fiches' && <DissertationFiches key={focusTerm} matiere={matiere} focus={focusTerm} onBack={openDissertation} />}
          {screen === 'dissert-grilles' && <DissertationGrilles matiere={matiere} onOpenTerm={openFiches} onBack={openDissertation} />}
          {screen === 'dissert-quiz' && (
            <DissertationQuiz key={`${dissert}-${run}`} matiere={matiere} level={dissert} onFinish={finish} onBack={openDissertation} />
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
              subtitle={dissert ? `Dissertation · niveau ${dissert}` : gloss ? `Glossaire · niveau ${gloss}` : devoir ? `${devoir.title} · p. ${devoir.page}` : undefined}
              onRetry={retry}
              onHome={dissert ? openDissertation : gloss ? openGlossaire : devoir ? goLevels : goHome}
              homeLabel={dissert ? 'Retour à la dissertation' : gloss ? 'Retour au glossaire' : devoir ? 'Retour aux devoirs' : undefined}
            />
          )}
        </div>
      </div>
    </GlossaryProvider>
  )
}

export default App
