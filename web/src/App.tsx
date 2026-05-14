import { useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Dashboard } from './components/Dashboard'
import { Intake } from './components/Intake'
import { Landing } from './components/Landing'
import { LoadingEval } from './components/LoadingEval'
import { TechnicalQuiz } from './components/TechnicalQuiz'
import { fetchQuestions, submitEvaluation } from './lib/api'
import type { EvaluateResponse, Step, TechQuestion } from './types'

type IntakePayload = {
  name: string
  role: string
  skillLevel: string
  resumeFile: File | null
  githubUrl: string
  portfolioUrl: string
  linkedinUrl: string
  introText: string
}

export function App() {
  const [step, setStep] = useState<Step>('landing')
  const [intake, setIntake] = useState<IntakePayload | null>(null)
  const [questions, setQuestions] = useState<TechQuestion[]>([])
  const [techAnswers, setTechAnswers] = useState<Record<string, number>>({})
  const [result, setResult] = useState<EvaluateResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reset = useCallback(() => {
    setStep('landing')
    setIntake(null)
    setQuestions([])
    setTechAnswers({})
    setResult(null)
    setError(null)
  }, [])

  const start = () => {
    setError(null)
    setStep('intake')
  }

  const afterIntake = async (payload: IntakePayload) => {
    setError(null)
    setIntake(payload)
    try {
      const qs = await fetchQuestions(payload.role)
      setQuestions(qs)
      setTechAnswers({})
      setStep('technical')
    } catch (e) {
      setError(String(e))
    }
  }

  const runEvaluation = async () => {
    if (!intake) return
    setError(null)
    setStep('loading')
    const minUi = new Promise<void>((resolve) => window.setTimeout(resolve, 2400))
    const evalPromise = submitEvaluation({
      name: intake.name,
      role: intake.role,
      skillLevel: intake.skillLevel,
      githubUrl: intake.githubUrl,
      portfolioUrl: intake.portfolioUrl,
      linkedinUrl: intake.linkedinUrl,
      introText: intake.introText,
      techAnswers,
      resumeFile: intake.resumeFile,
    })
    try {
      const [data] = await Promise.all([evalPromise, minUi])
      setResult(data)
      setStep('results')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setStep('technical')
    }
  }

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100">
      <AnimatePresence mode="wait">
        {error && step !== 'landing' && (
          <motion.div
            key="banner"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="fixed left-0 right-0 top-0 z-50 border-b border-rose-400/30 bg-rose-950/80 px-4 py-2 text-center text-xs text-rose-50 backdrop-blur"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {step === 'landing' && (
          <motion.div key="landing" exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
            <Landing onStart={start} />
          </motion.div>
        )}

        {step === 'intake' && (
          <motion.div key="intake" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Intake initialRole="Full Stack Developer" onBack={reset} onNext={afterIntake} />
          </motion.div>
        )}

        {step === 'technical' && intake && (
          <motion.div key="tech" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <TechnicalQuiz
              questions={questions}
              answers={techAnswers}
              setAnswers={setTechAnswers}
              onBack={() => setStep('intake')}
              onSubmit={runEvaluation}
            />
          </motion.div>
        )}

        {step === 'loading' && (
          <motion.div key="load" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LoadingEval />
          </motion.div>
        )}

        {step === 'results' && result && intake && (
          <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Dashboard data={result} candidateName={intake.name} onReset={reset} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
