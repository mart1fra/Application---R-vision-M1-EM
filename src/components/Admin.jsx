import { useState, useRef, useEffect, useCallback } from 'react'
import { jsPDF } from 'jspdf'
import { MATIERES } from '../utils'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || ''

export default function Admin({ onBack }) {
  const [authenticated, setAuthenticated] = useState(!ADMIN_PASSWORD)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = (e) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true)
      setError('')
    } else {
      setError('Mot de passe incorrect')
    }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-5">
        <form onSubmit={handleLogin} className="w-full max-w-[360px]">
          <h1 className="font-display font-bold text-[24px] text-charcoal mb-6 text-center">Admin</h1>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Mot de passe"
            className="w-full rounded-xl border border-sand bg-white px-4 py-4 text-[16px]
                       placeholder:text-warm-gray/40
                       focus:outline-2 focus:outline-offset-0 focus:outline-charcoal focus:border-transparent"
            autoComplete="off"
          />
          {error && <p className="text-error text-[14px] mt-2">{error}</p>}
          <button
            type="submit"
            className="w-full mt-4 rounded-xl py-4 text-[16px] font-semibold text-white bg-charcoal
                       active:scale-[0.97] transition-transform duration-150"
          >
            Connexion
          </button>
          <button
            type="button"
            onClick={onBack}
            className="w-full mt-3 text-warm-gray text-[14px] py-2"
          >
            Retour
          </button>
        </form>
      </div>
    )
  }

  return <Scanner onBack={onBack} />
}

function Scanner({ onBack }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const overlayRef = useRef(null)
  const scannerRef = useRef(null)
  const streamRef = useRef(null)
  const animFrameRef = useRef(null)

  const [pages, setPages] = useState([])
  const [cvReady, setCvReady] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [showFinish, setShowFinish] = useState(false)
  const [selectedMatiere, setSelectedMatiere] = useState(null)
  const [cameraError, setCameraError] = useState('')

  // Load OpenCV.js
  useEffect(() => {
    if (window.cv && window.cv.Mat) {
      setCvReady(true)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://docs.opencv.org/4.9.0/opencv.js'
    script.async = true
    script.onload = () => {
      const checkCv = () => {
        if (window.cv && window.cv.Mat) {
          setCvReady(true)
        } else {
          setTimeout(checkCv, 100)
        }
      }
      checkCv()
    }
    document.head.appendChild(script)
    return () => {
      if (script.parentNode) script.parentNode.removeChild(script)
    }
  }, [])

  // Init jscanify once cv is ready
  useEffect(() => {
    if (!cvReady) return
    import('jscanify/client').then(mod => {
      const Jscanify = mod.default || mod
      scannerRef.current = new Jscanify()
    })
  }, [cvReady])

  // Start camera
  useEffect(() => {
    if (!cvReady) return
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.setAttribute('playsinline', 'true')
          videoRef.current.setAttribute('webkit-playsinline', 'true')
          await videoRef.current.play()
          setCameraReady(true)
        }
      } catch (err) {
        setCameraError('Impossible d\'acceder a la camera. Verifiez les permissions.')
        console.error(err)
      }
    }
    startCamera()
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [cvReady])

  // Real-time edge detection overlay
  useEffect(() => {
    if (!cameraReady || !scannerRef.current || !videoRef.current || !overlayRef.current) return

    const video = videoRef.current
    const overlay = overlayRef.current
    const ctx = overlay.getContext('2d')

    const drawOverlay = () => {
      if (!video.videoWidth) {
        animFrameRef.current = requestAnimationFrame(drawOverlay)
        return
      }

      overlay.width = video.videoWidth
      overlay.height = video.videoHeight

      try {
        const resultCanvas = scannerRef.current.highlightPaper(video, {
          color: '#22c55e',
          thickness: 6
        })
        ctx.clearRect(0, 0, overlay.width, overlay.height)
        ctx.drawImage(resultCanvas, 0, 0)
      } catch {
        // silently skip frame if detection fails
      }

      animFrameRef.current = requestAnimationFrame(drawOverlay)
    }

    animFrameRef.current = requestAnimationFrame(drawOverlay)
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [cameraReady])

  const capture = useCallback(() => {
    if (!videoRef.current || !scannerRef.current) return
    const video = videoRef.current

    try {
      const extracted = scannerRef.current.extractPaper(video, 595, 842)
      if (extracted) {
        const dataUrl = extracted.toDataURL('image/jpeg', 0.92)
        setPages(prev => [...prev, dataUrl])
      } else {
        // Fallback: capture raw frame if no paper detected
        const c = document.createElement('canvas')
        c.width = video.videoWidth
        c.height = video.videoHeight
        c.getContext('2d').drawImage(video, 0, 0)
        const dataUrl = c.toDataURL('image/jpeg', 0.92)
        setPages(prev => [...prev, dataUrl])
      }
    } catch {
      // Fallback capture
      const c = document.createElement('canvas')
      c.width = video.videoWidth
      c.height = video.videoHeight
      c.getContext('2d').drawImage(video, 0, 0)
      const dataUrl = c.toDataURL('image/jpeg', 0.92)
      setPages(prev => [...prev, dataUrl])
    }
  }, [])

  const removePage = (index) => {
    setPages(prev => prev.filter((_, i) => i !== index))
  }

  const generatePdf = () => {
    if (!selectedMatiere || pages.length === 0) return

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageWidth = 210
    const pageHeight = 297

    pages.forEach((dataUrl, i) => {
      if (i > 0) pdf.addPage()
      pdf.addImage(dataUrl, 'JPEG', 0, 0, pageWidth, pageHeight)
    })

    const date = new Date().toISOString().slice(0, 10)
    pdf.save(`${selectedMatiere.id}_${date}.pdf`)
  }

  if (cameraError) {
    return (
      <div className="min-h-screen bg-charcoal flex flex-col items-center justify-center px-5 text-white">
        <p className="text-[16px] text-center mb-6">{cameraError}</p>
        <button onClick={onBack} className="text-white/60 underline">Retour</button>
      </div>
    )
  }

  if (showFinish) {
    return (
      <div className="min-h-screen bg-cream px-5 pt-10 pb-8">
        <div className="max-w-[430px] mx-auto">
          <h2 className="font-display font-bold text-[22px] text-charcoal mb-2">
            {pages.length} page{pages.length > 1 ? 's' : ''} capturee{pages.length > 1 ? 's' : ''}
          </h2>
          <p className="text-warm-gray text-[14px] mb-6">Choisis la matiere pour nommer le PDF.</p>

          {/* Thumbnails */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
            {pages.map((p, i) => (
              <div key={i} className="relative shrink-0">
                <img src={p} alt={`Page ${i + 1}`} className="w-20 h-28 object-cover rounded-lg border border-sand" />
                <button
                  onClick={() => removePage(i)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-error text-white rounded-full text-[12px] font-bold
                             flex items-center justify-center active:scale-90 transition-transform"
                >
                  x
                </button>
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] bg-black/50 text-white px-1.5 rounded">
                  {i + 1}
                </span>
              </div>
            ))}
          </div>

          {/* Matiere selection */}
          <div className="flex flex-col gap-3 mb-6">
            {MATIERES.map(m => (
              <button
                key={m.id}
                onClick={() => setSelectedMatiere(m)}
                className={`w-full text-left rounded-xl p-4 border transition-all duration-150
                           active:scale-[0.98] ${
                  selectedMatiere?.id === m.id
                    ? 'border-charcoal bg-charcoal text-white'
                    : 'border-sand bg-white text-charcoal'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="text-xl">{m.icon}</span>
                  <span className="font-medium text-[15px]">{m.label}</span>
                </span>
              </button>
            ))}
          </div>

          {/* Actions */}
          <button
            onClick={generatePdf}
            disabled={!selectedMatiere || pages.length === 0}
            className="w-full rounded-xl py-4 text-[16px] font-semibold text-white bg-charcoal
                       active:scale-[0.97] transition-transform duration-150
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Telecharger le PDF
          </button>
          <button
            onClick={() => setShowFinish(false)}
            className="w-full mt-3 rounded-xl py-3 text-[14px] text-warm-gray border border-sand bg-white
                       active:scale-[0.97] transition-transform duration-150"
          >
            Reprendre la capture
          </button>
          <button
            onClick={onBack}
            className="w-full mt-2 text-warm-gray text-[13px] py-2"
          >
            Retour a l'accueil
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Loading */}
      {!cameraReady && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-black">
          <div className="text-white text-center">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[14px] text-white/60">Chargement de la camera...</p>
          </div>
        </div>
      )}

      {/* Camera view */}
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          playsInline
          webkit-playsinline="true"
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />
        <canvas
          ref={overlayRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-12 pb-3 bg-gradient-to-b from-black/60 to-transparent z-10">
          <button onClick={onBack} className="text-white text-[14px] active:opacity-60">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {pages.length > 0 && (
            <span className="text-white/80 text-[13px] font-medium bg-white/20 px-3 py-1 rounded-full">
              {pages.length} page{pages.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Page thumbnails strip */}
        {pages.length > 0 && (
          <div className="absolute top-24 right-3 flex flex-col gap-2 z-10">
            {pages.map((p, i) => (
              <div key={i} className="relative">
                <img src={p} alt="" className="w-12 h-16 object-cover rounded border-2 border-white/60" />
                <button
                  onClick={() => removePage(i)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-error text-white rounded-full text-[10px] font-bold
                             flex items-center justify-center"
                >
                  x
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="bg-black/90 px-5 pb-8 pt-4 flex items-center justify-between">
        <button
          onClick={() => { if (pages.length > 0) setShowFinish(true) }}
          disabled={pages.length === 0}
          className="text-white text-[13px] font-medium px-4 py-2 rounded-full border border-white/30
                     disabled:opacity-30 disabled:cursor-not-allowed
                     active:bg-white/10 transition-colors"
        >
          Terminer
        </button>

        {/* Capture button */}
        <button
          onClick={capture}
          disabled={!cameraReady}
          className="w-[72px] h-[72px] rounded-full border-[4px] border-white flex items-center justify-center
                     active:scale-90 transition-transform duration-100
                     disabled:opacity-40"
        >
          <div className="w-[58px] h-[58px] rounded-full bg-white" />
        </button>

        <button
          onClick={capture}
          disabled={!cameraReady}
          className="text-white text-[13px] font-medium px-4 py-2 rounded-full border border-white/30
                     disabled:opacity-30 disabled:cursor-not-allowed
                     active:bg-white/10 transition-colors"
        >
          Page +
        </button>
      </div>
    </div>
  )
}
