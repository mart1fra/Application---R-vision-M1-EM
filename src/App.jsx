import { useState, useEffect, lazy, Suspense } from 'react'
import Home from './components/Home'
import LevelSelect from './components/LevelSelect'
import Quiz from './components/Quiz'
import Score from './components/Score'

const Admin = lazy(() => import('./components/Admin'))

function App() {
  const [screen, setScreen] = useState('home')
  const [matiere, setMatiere] = useState(null)
  const [level, setLevel] = useState(null)
  const [results, setResults] = useState(null)

  useEffect(() => {
    if (window.location.pathname === '/admin') {
      setScreen('admin')
    }
  }, [])

  const goHome = () => {
    setScreen('home')
    setMatiere(null)
    setLevel(null)
    setResults(null)
    window.history.replaceState(null, '', '/')
  }

  const selectMatiere = (m) => {
    setMatiere(m)
    setScreen('level')
  }

  const selectLevel = (l) => {
    setLevel(l)
    setScreen('quiz')
  }

  const finishQuiz = (r) => {
    setResults(r)
    setScreen('score')
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
    <div className="min-h-screen bg-cream">
      <div className="max-w-[430px] mx-auto min-h-screen relative">
        {screen === 'home' && <Home onSelect={selectMatiere} />}
        {screen === 'level' && <LevelSelect matiere={matiere} onSelect={selectLevel} onBack={goHome} />}
        {screen === 'quiz' && <Quiz matiere={matiere} level={level} onFinish={finishQuiz} onBack={goHome} />}
        {screen === 'score' && <Score results={results} matiere={matiere} onHome={goHome} onRetry={() => { setResults(null); setScreen('quiz') }} />}
      </div>
    </div>
  )
}

export default App
