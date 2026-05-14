import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'

type Props = {
  question: string
  onBack: () => void
  onSubmit: (answer: string) => void
}

const PERSONALITIES = [
  { id: 'friendly', name: 'Friendly HR', desc: 'Encouraging and focused on culture fit.', icon: '😊' },
  { id: 'tech', name: 'Aggressive Tech Lead', desc: 'Direct, focuses on deep technical implementation.', icon: '🤨' },
  { id: 'founder', name: 'Startup Founder', desc: 'Fast-paced, looks for ownership and vision.', icon: '🚀' },
  { id: 'faang', name: 'FAANG Recruiter', desc: 'Strictly structured, follows STAR method closely.', icon: '🏢' },
]

export function MockInterview({ question, onBack, onSubmit }: Props) {
  const [answer, setAnswer] = useState('')
  const [listening, setListening] = useState(false)
  const [confidence, setConfidence] = useState(70)
  const [pacing, setPacing] = useState(50)
  const [persona, setPersona] = useState(PERSONALITIES[0])
  const [timeLeft, setTimeLeft] = useState(120) // 2 minutes pressure timer
  const [isPressureActive, setIsPressureActive] = useState(false)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    let timer: number
    if (isPressureActive && timeLeft > 0) {
      timer = window.setInterval(() => setTimeLeft(prev => prev - 1), 1000)
    }
    return () => clearInterval(timer)
  }, [isPressureActive, timeLeft])

  // Simulate real-time analysis based on typing/dictation
  useEffect(() => {
    if (answer.length > 0) {
      const interval = setInterval(() => {
        setConfidence(prev => Math.min(95, Math.max(60, prev + (Math.random() * 10 - 5))))
        setPacing(prev => Math.min(90, Math.max(40, prev + (Math.random() * 14 - 7))))
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [answer])

  const startDictation = () => {
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!Ctor) {
      alert('Speech recognition is not supported in this browser.')
      return
    }
    const rec = new Ctor()
    rec.lang = 'en-US'
    rec.continuous = true
    rec.interimResults = true
    recognitionRef.current = rec
    rec.onresult = (ev: any) => {
      let chunk = ''
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        chunk += ev.results[i][0].transcript
      }
      setAnswer(prev => `${prev}${prev && !prev.endsWith(' ') ? ' ' : ''}${chunk}`)
    }
    rec.onerror = () => setListening(false)
    rec.onend = () => setListening(false)
    setListening(true)
    rec.start()
  }

  const stopDictation = () => {
    recognitionRef.current?.stop()
    setListening(false)
  }

  return (
    <div className="relative min-h-[100dvh] noise flex items-center justify-center p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.2),transparent_55%)]" />
      
      <div className="relative glass max-w-3xl w-full rounded-[2.5rem] p-8 sm:p-12 overflow-hidden">
        <div className="absolute top-0 right-0 p-8">
           <div className="flex gap-6">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Confidence</span>
                <div className="h-1 w-24 bg-white/5 rounded-full mt-2 overflow-hidden">
                  <motion.div 
                    animate={{ width: `${confidence}%` }}
                    className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                  />
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pacing</span>
                <div className="h-1 w-24 bg-white/5 rounded-full mt-2 overflow-hidden">
                  <motion.div 
                    animate={{ width: `${pacing}%` }}
                    className="h-full bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.5)]" 
                  />
                </div>
              </div>
           </div>
        </div>

        <button type="button" onClick={onBack} className="text-sm text-slate-400 transition hover:text-white mb-8">
          ← Back
        </button>

        <div className="mb-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PERSONALITIES.map((p) => (
            <button
              key={p.id}
              onClick={() => setPersona(p)}
              className={clsx(
                'flex flex-col items-center gap-2 rounded-2xl border p-3 transition-all',
                persona?.id === p.id 
                  ? 'border-indigo-500 bg-indigo-500/10' 
                  : 'border-white/5 bg-white/5 hover:bg-white/10'
              )}
            >
              <span className="text-xl">{p.icon}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-white">{p.name}</span>
            </button>
          ))}
        </div>

        <div className="text-left">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400">Step 3: Behavioral Simulation</p>
            <div className="flex items-center gap-4">
              {isPressureActive && (
                <div className="flex items-center gap-2 rounded-full bg-rose-500/10 border border-rose-500/20 px-3 py-1">
                  <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest animate-pulse">
                    Timer: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              )}
              <button 
                onClick={() => setIsPressureActive(!isPressureActive)}
                className={clsx(
                  "text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border transition-all",
                  isPressureActive ? "bg-rose-500 border-rose-600 text-white" : "border-white/10 text-slate-500 hover:text-white"
                )}
              >
                {isPressureActive ? 'Pressure Mode ON' : 'Enable Pressure Mode'}
              </button>
            </div>
          </div>
          <h2 className="mt-4 font-heading text-3xl text-white sm:text-4xl">AI Mock Interview</h2>
          <p className="mt-4 text-slate-400 max-w-xl">
            Currently interviewing with <span className="text-white font-bold">{persona?.name}</span>. {persona?.desc}
          </p>

          <div className="mt-10 space-y-8">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Recruiter Question</span>
              </div>
              <p className="text-lg sm:text-xl font-medium text-white leading-relaxed italic">
                "{question}"
              </p>
            </div>

            <div className="relative group">
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-full h-48 rounded-[2rem] border border-white/10 bg-slate-950/50 p-6 text-sm text-white outline-none ring-0 transition focus:border-indigo-500/50 resize-none"
                placeholder="Start typing or use the microphone to record your response..."
              />
              <div className="absolute bottom-6 right-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={listening ? stopDictation : startDictation}
                  className={clsx(
                    'flex h-10 w-10 items-center justify-center rounded-full transition-all',
                    listening 
                      ? 'bg-rose-500 text-white animate-pulse' 
                      : 'bg-white/10 text-white hover:bg-white/20'
                  )}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-white/5">
                  <div className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Live Analysis</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:justify-end">
            <button
              onClick={() => onSubmit(answer)}
              disabled={answer.length < 20}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-400 px-8 py-4 text-sm font-bold text-slate-950 shadow-lg shadow-indigo-500/25 transition enabled:hover:scale-[1.02] disabled:opacity-40"
            >
              <span className="relative z-10">Generate Final Readiness Report →</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
