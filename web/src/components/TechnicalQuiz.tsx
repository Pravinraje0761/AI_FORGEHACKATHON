import { motion } from 'framer-motion'
import clsx from 'clsx'
import type { TechQuestion } from '../types'

type Props = {
  questions: TechQuestion[]
  answers: Record<string, number>
  setAnswers: (next: Record<string, number>) => void
  onBack: () => void
  onSubmit: () => void
}

export function TechnicalQuiz({ questions, answers, setAnswers, onBack, onSubmit }: Props) {
  const answered = questions.filter((q) => typeof answers[q.id] === 'number').length
  const complete = answered === questions.length

  return (
    <div className="relative min-h-[100dvh] noise">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.22),transparent_55%)]" />
      <div className="relative mx-auto max-w-3xl px-5 py-12 sm:px-8">
        <button type="button" onClick={onBack} className="text-sm text-slate-400 transition hover:text-white">
          ← Back
        </button>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
          <h2 className="font-heading text-3xl text-white sm:text-4xl">Rapid technical screen</h2>
          <p className="mt-2 text-sm text-slate-400">
            Five adaptive-style questions tuned to your role. Designed to finish in under a minute.
          </p>
          <p className="mt-3 text-xs text-slate-500">
            Answered {answered}/{questions.length}
          </p>

          <div className="mt-8 space-y-5">
            {questions.map((q, idx) => (
              <div key={q.id} className="glass rounded-3xl p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-200/80">Q{idx + 1}</p>
                <p className="mt-2 text-sm font-medium text-white">{q.question}</p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {q.options.map((opt, i) => {
                    const selected = answers[q.id] === i
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setAnswers({ ...answers, [q.id]: i })}
                        className={clsx(
                          'rounded-2xl border px-3 py-3 text-left text-xs leading-relaxed transition',
                          selected
                            ? 'border-indigo-400/70 bg-indigo-500/15 text-white'
                            : 'border-white/10 bg-white/5 text-slate-200 hover:border-white/20',
                        )}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={!complete}
              onClick={onSubmit}
              className="rounded-2xl bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-indigo-500/20 transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Run AI evaluation →
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
