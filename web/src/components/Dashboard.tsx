import { useEffect, useMemo, useState } from 'react'
import { animate, motion, useMotionValue, useMotionValueEvent } from 'framer-motion'
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { EvaluateResponse, RecruiterShortlist } from '../types'

function useAnimatedInt(target: number, duration = 1.1) {
  const mv = useMotionValue(0)
  const [display, setDisplay] = useState(0)
  useMotionValueEvent(mv, 'change', (v) => setDisplay(Math.round(v)))

  useEffect(() => {
    const controls = animate(mv, target, { duration, ease: 'easeOut' })
    return () => controls.stop()
  }, [mv, target, duration])

  return display
}

function shortlistLabel(s: RecruiterShortlist) {
  if (s === 'yes') return 'Shortlist: Yes'
  if (s === 'maybe') return 'Shortlist: Maybe'
  return 'Shortlist: No'
}

function shortlistStyles(s: RecruiterShortlist) {
  if (s === 'yes') return 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100'
  if (s === 'maybe') return 'border-amber-400/40 bg-amber-500/10 text-amber-100'
  return 'border-rose-400/40 bg-rose-500/10 text-rose-100'
}

export function Dashboard({ data, candidateName, onReset }: { data: EvaluateResponse; candidateName: string; onReset: () => void }) {
  const overall = useAnimatedInt(data.overall.score)
  const resume = useAnimatedInt(data.resume.score)
  const technical = useAnimatedInt(data.technical.score)
  const communication = useAnimatedInt(data.communication.score)
  const portfolio = useAnimatedInt(data.portfolio.score)

  const radarRows = useMemo(
    () => [
      { axis: 'Resume', value: data.radar.resume },
      { axis: 'Technical', value: data.radar.technical },
      { axis: 'Communication', value: data.radar.communication },
      { axis: 'Portfolio', value: data.radar.portfolio },
    ],
    [data.radar],
  )

  const [tab, setTab] = useState<'overview' | 'roadmap' | 'mock'>('overview')

  return (
    <div className="relative min-h-[100dvh] noise pb-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.22),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(16,185,129,0.12),transparent_55%)]" />
      <div className="relative mx-auto max-w-6xl px-5 pt-10 sm:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200/80">Results</p>
            <h1 className="font-heading mt-2 text-3xl text-white sm:text-4xl">Interview readiness dashboard</h1>
            <p className="mt-2 text-sm text-slate-400">
              {candidateName} · weighted blend mirrors recruiter signal (technical weighted highest).
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
              {data.meta.usedOpenAI ? 'AI narrative: OpenAI' : 'AI narrative: heuristic'}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
              {data.meta.processingMs}ms server
            </span>
            <button
              type="button"
              onClick={onReset}
              className="rounded-full border border-white/15 bg-slate-950/40 px-4 py-1 text-xs font-semibold text-white hover:bg-white/10"
            >
              New candidate
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          <div className="glass glow relative overflow-hidden rounded-3xl p-6 lg:col-span-2">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Overall readiness</p>
                <div className="mt-3 flex items-end gap-3">
                  <motion.p className="font-heading text-6xl text-white" layout>
                    {overall}
                  </motion.p>
                  <p className="pb-2 text-sm text-slate-400">/ 100</p>
                </div>
                <p className="mt-3 inline-flex rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-100">
                  {data.overall.level}
                </p>
              </div>
              <div className="sm:max-w-sm">
                <div className={`rounded-2xl border px-4 py-3 text-sm ${shortlistStyles(data.recruiter.shortlist)}`}>
                  <p className="text-xs font-semibold uppercase tracking-wide opacity-80">Recruiter simulation</p>
                  <p className="mt-2 text-base font-semibold">{shortlistLabel(data.recruiter.shortlist)}</p>
                  <p className="mt-2 text-xs leading-relaxed opacity-90">{data.recruiter.reasoning}</p>
                </div>
              </div>
            </div>
            <p className="mt-6 text-sm leading-relaxed text-slate-300">{data.overall.insight}</p>
            <p className="mt-4 text-xs text-slate-500">
              Weights: resume {(data.weights.resume * 100).toFixed(0)}% · technical {(data.weights.technical * 100).toFixed(0)}% ·
              communication {(data.weights.communication * 100).toFixed(0)}% · portfolio {(data.weights.portfolio * 100).toFixed(0)}%
            </p>
          </div>

          <div className="glass rounded-3xl p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">ATS-style match</p>
            <p className="font-heading mt-3 text-5xl text-white">{data.resume.atsScore}</p>
            <p className="mt-1 text-xs text-slate-400">Keyword coverage vs role dictionary</p>
            <div className="mt-4">
              <p className="text-xs font-semibold text-slate-300">Missing keyword ideas</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {data.resume.missingKeywords.map((k) => (
                  <span key={k} className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-slate-200">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Resume', score: resume, sub: `ATS ${data.resume.atsScore}` },
            { label: 'Technical', score: technical, sub: `${data.technical.correct}/${data.technical.total} correct` },
            {
              label: 'Communication',
              score: communication,
              sub: `Filler ratio ${data.communication.metrics.fillerRatio.toFixed(2)}`,
            },
            { label: 'Portfolio', score: portfolio, sub: 'Links + GitHub signal' },
          ].map((c) => (
            <div key={c.label} className="glass rounded-3xl p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{c.label}</p>
              <p className="font-heading mt-3 text-4xl text-white">{c.score}</p>
              <p className="mt-2 text-xs text-slate-500">{c.sub}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-5">
          <div className="glass rounded-3xl p-4 lg:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Radar</p>
            <div className="mt-2 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarRows} cx="50%" cy="50%" outerRadius="78%">
                  <PolarGrid stroke="rgba(148,163,184,0.25)" />
                  <PolarAngleAxis dataKey="axis" tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Score" dataKey="value" stroke="#818cf8" fill="#818cf8" fillOpacity={0.35} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(2,6,23,0.9)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 12,
                      color: '#e2e8f0',
                      fontSize: 12,
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass rounded-3xl p-5 lg:col-span-3">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['overview', 'Insights'],
                  ['roadmap', 'Roadmap'],
                  ['mock', 'Mock questions'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={
                    tab === id
                      ? 'rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold text-white'
                      : 'rounded-full px-4 py-1.5 text-xs font-semibold text-slate-400 hover:text-white'
                  }
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === 'overview' && (
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold text-emerald-200/90">Strength themes</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-200">
                    {[...data.resume.strengths, ...data.technical.strengths, ...data.communication.strengths, ...data.portfolio.strengths]
                      .slice(0, 8)
                      .map((s, i) => (
                        <li key={`${i}-${s}`} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                          {s}
                        </li>
                      ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-rose-200/90">Priority gaps</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-200">
                    {[...data.resume.weaknesses, ...data.technical.weaknesses, ...data.communication.weaknesses, ...data.portfolio.weaknesses]
                      .slice(0, 8)
                      .map((s, i) => (
                        <li key={`${i}-${s}`} className="rounded-xl border border-rose-400/15 bg-rose-500/5 px-3 py-2">
                          {s}
                        </li>
                      ))}
                  </ul>
                </div>
                <div className="md:col-span-2 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <p className="text-xs font-semibold text-slate-300">Communication metrics (heuristic)</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="text-[11px] text-slate-400">WPM estimate</p>
                      <p className="mt-1 text-lg font-semibold text-white">{data.communication.metrics.wpmEstimate}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="text-[11px] text-slate-400">Filler ratio</p>
                      <p className="mt-1 text-lg font-semibold text-white">{data.communication.metrics.fillerRatio.toFixed(2)}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="text-[11px] text-slate-400">Tone</p>
                      <p className="mt-1 text-lg font-semibold text-white">{data.communication.metrics.sentiment}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'roadmap' && (
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {data.roadmap.map((w) => (
                  <div key={w.week} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-indigo-200/80">Week {w.week}</p>
                    <p className="mt-2 text-sm font-semibold text-white">{w.title}</p>
                    <ul className="mt-3 space-y-2 text-xs text-slate-300">
                      {w.items.map((it) => (
                        <li key={it}>• {it}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {tab === 'mock' && (
              <div className="mt-5 space-y-5">
                {(
                  [
                    ['Technical', data.mockInterview.technical],
                    ['HR', data.mockInterview.hr],
                    ['Behavioral', data.mockInterview.behavioral],
                  ] as const
                ).map(([title, items]) => (
                  <div key={title}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
                    <ul className="mt-2 space-y-2">
                      {items.map((q) => (
                        <li key={q} className="rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-200">
                          {q}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 glass rounded-3xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Technical breakdown</p>
          <ul className="mt-3 grid gap-2 md:grid-cols-2">
            {data.technical.breakdown.map((line) => (
              <li key={line} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200">
                {line}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
