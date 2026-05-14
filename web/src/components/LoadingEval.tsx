import { motion } from 'framer-motion'

const STEPS = ['Resume analysis', 'Technical evaluation', 'Communication scan', 'Portfolio signals']

export function LoadingEval() {
  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center noise px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.35),transparent_60%)]" />
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass relative max-w-lg rounded-3xl p-8 text-center"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200/80">Evaluating</p>
        <h2 className="font-heading mt-3 text-3xl text-white">Building your readiness profile</h2>
        <p className="mt-3 text-sm text-slate-400">
          Synthesizing resume intelligence, technical screen results, communication heuristics, and portfolio signals.
        </p>

        <div className="mt-8 space-y-3 text-left">
          {STEPS.map((label) => (
            <motion.div
              key={label}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
              initial={{ opacity: 0.35 }}
              animate={{ opacity: [0.35, 1, 0.35] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: STEPS.indexOf(label) * 0.25 }}
            >
              <span className="h-2.5 w-2.5 rounded-full bg-sky-400 shadow-[0_0_16px_rgba(56,189,248,0.8)]" />
              <span className="text-sm text-white">{label}</span>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 h-1.5 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full w-1/3 rounded-full bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-300"
            animate={{ x: ['-30%', '120%'] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
          />
        </div>

        <p className="mt-5 text-xs text-slate-400">This usually takes a couple of seconds — we keep the UI warm while scoring finishes.</p>
      </motion.div>
    </div>
  )
}
