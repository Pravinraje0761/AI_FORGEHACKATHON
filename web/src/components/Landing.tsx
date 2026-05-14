import { motion } from 'framer-motion'

export function Landing({ onStart }: { onStart: () => void }) {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden noise">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.35),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(14,165,233,0.22),transparent_50%)]" />
      <div className="relative mx-auto flex min-h-[100dvh] max-w-6xl flex-col justify-center px-5 py-16 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="max-w-3xl"
        >
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-indigo-100/90">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.9)]" />
            AI recruiter simulation · holistic readiness in one flow
          </p>
          <h1 className="font-heading text-4xl leading-[1.05] text-white sm:text-6xl">
            Discover interview gaps{' '}
            <span className="bg-gradient-to-r from-indigo-200 via-sky-200 to-emerald-200 bg-clip-text text-transparent">
              before
            </span>{' '}
            recruiters do.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Most tools only quiz coding. This platform evaluates resume quality, rapid technical signal, communication
            patterns, and portfolio credibility — then synthesizes a recruiter-style verdict and a personalized roadmap.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onStart}
              className="glow inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-400 px-7 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-indigo-500/25 transition hover:brightness-110"
            >
              Get interview ready in under 2 minutes
            </button>
            <p className="text-xs text-slate-400 sm:ml-2">No account · optimized for hackathon demos</p>
          </div>
          <div className="mt-14 grid gap-4 sm:grid-cols-3">
            {[
              { t: 'Resume intelligence', d: 'ATS-style keyword fit + structure signals' },
              { t: '5-question technical', d: 'Role-specific screen with instant scoring' },
              { t: 'Communication scan', d: 'Filler density + structure heuristics' },
            ].map((c) => (
              <div key={c.t} className="glass rounded-2xl p-4">
                <p className="text-sm font-semibold text-white">{c.t}</p>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">{c.d}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
