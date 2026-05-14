import { useEffect, useMemo, useState } from 'react'
import { animate, motion, useMotionValue, useMotionValueEvent } from 'framer-motion'
import clsx from 'clsx'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  Legend,
  XAxis,
  YAxis,
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

function HeatmapCell({ skill, score }: { skill: string; score: number }) {
  const color = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-rose-500'
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
        <span>{skill}</span>
        <span>{score}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          className={`h-full ${color}`}
        />
      </div>
    </div>
  )
}

export function Dashboard({ data, candidateName, onReset }: { data: EvaluateResponse; candidateName: string; onReset: () => void }) {
  const overall = useAnimatedInt(data.overall.score)
  const resume = useAnimatedInt(data.resume.score)
  const technical = useAnimatedInt(data.technical.score)
  const communication = useAnimatedInt(data.communication.score)
  const portfolio = useAnimatedInt(data.portfolio.score)
  const likelihood = useAnimatedInt(data.recruiter.likelihoodOfPassing)

  const radarRows = useMemo(
    () => [
      { axis: 'Resume', value: data.radar.resume },
      { axis: 'Technical', value: data.radar.technical },
      { axis: 'Communication', value: data.radar.communication },
      { axis: 'Portfolio', value: data.radar.portfolio },
    ],
    [data.radar],
  )

  const [tab, setTab] = useState<'overview' | 'roadmap' | 'mock' | 'resume-ai' | 'analytics'>('overview')

  return (
    <div className="relative min-h-[100dvh] bg-slate-950 text-slate-100 pb-20 selection:bg-indigo-500/30">
      {/* Dynamic Background Elements */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-emerald-500/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 pt-12">
        {/* Header */}
        <header className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-indigo-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500"></span>
              </span>
              Advanced Intelligence Active
            </div>
            <h1 className="font-heading text-4xl font-bold tracking-tight text-white md:text-5xl">
              Interview <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-200">Readiness</span> Report
            </h1>
            <p className="text-slate-400 max-w-2xl">
              Deep analysis for <span className="text-white font-medium">{candidateName}</span> as{' '}
              <span className="text-white font-medium">{data.role ?? 'your target role'}</span>.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Hiring Persona</span>
               <div className="flex items-center gap-2 mt-1">
                 <span className="text-xl">{data.communication?.persona?.icon || '🧠'}</span>
                 <span className="text-sm font-black text-white">{data.communication?.persona?.name || 'Candidate'}</span>
               </div>
            </div>
            <div className="h-8 w-[1px] bg-white/10" />
            <button
              onClick={onReset}
              className="group relative flex items-center gap-2 rounded-full bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-white/10 active:scale-95"
            >
              Reset Session
            </button>
          </div>
        </header>

        {/* Main Score & Probability Charts */}
        <div className="mt-10 grid gap-6 lg:grid-cols-4">
          <div className="group relative overflow-hidden rounded-[2.5rem] bg-slate-900/50 p-8 border border-white/10 backdrop-blur-xl lg:col-span-2">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            
            <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-400">Holistic Readiness</p>
                <div className="flex items-baseline gap-3">
                  <motion.span className="font-heading text-8xl font-black text-white" layout>
                    {overall}
                  </motion.span>
                  <span className="text-2xl font-bold text-slate-500">%</span>
                </div>
                <div className="mt-4 flex items-center gap-4">
                  <span className="rounded-full bg-indigo-500/10 border border-indigo-400/20 px-4 py-1.5 text-sm font-bold text-indigo-100 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                    {data.overall.level}
                  </span>
                </div>
              </div>

              <div className="w-full md:max-w-[340px]">
                <div className={`rounded-3xl border p-6 transition-all ${shortlistStyles(data.recruiter?.shortlist || 'maybe')}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Recruiter Verdict</span>
                    <span className="text-sm font-black">{likelihood}% Likelihood</span>
                  </div>
                  <p className="mt-3 text-2xl font-black leading-tight">{shortlistLabel(data.recruiter?.shortlist || 'maybe')}</p>
                  {data.recruiter?.verdictBand && (
                    <p className="mt-1 text-xs font-semibold text-slate-300">{data.recruiter.verdictBand}</p>
                  )}
                  <div className="mt-4 space-y-1">
                     <p className="text-[10px] font-bold uppercase opacity-60">Top Concern</p>
                     <p className="text-xs font-medium">{data.recruiter?.topConcerns?.[0] || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative mt-8 border-t border-white/5 pt-6">
              <p className="text-base leading-relaxed text-slate-300 font-medium italic">
                "{data.overall.insight}"
              </p>
            </div>
          </div>

          {/* Hiring Probability Predictor */}
          <div className="group relative overflow-hidden rounded-[2.5rem] bg-slate-900/50 p-8 border border-white/10 backdrop-blur-xl lg:col-span-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-400">Hiring Probability Predictor</p>
            <div className="mt-8 grid grid-cols-3 gap-6">
               {[
                 { label: 'Startup', val: data.hiringProbability?.startup || 0, color: 'text-sky-400' },
                 { label: 'Mid-Size', val: data.hiringProbability?.midSize || 0, color: 'text-indigo-400' },
                 { label: 'FAANG', val: data.hiringProbability?.faang || 0, color: 'text-emerald-400' },
               ].map(h => (
                 <div key={h.label} className="text-center">
                    <div className="relative inline-flex items-center justify-center">
                       <svg className="h-20 w-20 rotate-[-90deg]">
                         <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="4" className="text-white/5" />
                         <motion.circle 
                           cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="4" 
                           strokeDasharray={214}
                           initial={{ strokeDashoffset: 214 }}
                           animate={{ strokeDashoffset: 214 - (214 * h.val) / 100 }}
                           className={h.color}
                         />
                       </svg>
                       <span className="absolute text-sm font-black text-white">{h.val}%</span>
                    </div>
                    <p className="mt-2 text-[10px] font-bold uppercase text-slate-500 tracking-widest">{h.label}</p>
                 </div>
               ))}
            </div>
            <div className="mt-8 rounded-2xl bg-white/5 p-4">
               <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase text-slate-500">Estimated Salary Prediction</span>
                  <span className="text-sm font-black text-emerald-400">{data.career?.salaryPrediction?.range || 'N/A'} {data.career?.salaryPrediction?.currency || ''}</span>
               </div>
            </div>
          </div>
        </div>

        {/* Explainable AI Score Breakdown */}
        <div className="mt-6">
          {/* Explainable AI Section */}
          <div className="group relative overflow-hidden rounded-[2.5rem] bg-slate-900/50 p-8 border border-white/10 backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-400">Explainable AI: Why This Score?</p>
            <div className="mt-8 grid gap-8 md:grid-cols-2">
               <div className="space-y-4">
                  {data.explainableAI?.scoreContributors?.map((c, i) => (
                    <div key={i} className="flex flex-col gap-2">
                       <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-slate-300">{c.label}</span>
                          <span className={clsx(
                            c.impact === 'positive' ? 'text-emerald-400' : c.impact === 'negative' ? 'text-rose-400' : 'text-slate-500'
                          )}>{c.score}%</span>
                       </div>
                       <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${c.score}%` }}
                            className={clsx(
                              "h-full",
                              c.impact === 'positive' ? 'bg-emerald-500' : c.impact === 'negative' ? 'bg-rose-500' : 'bg-slate-600'
                            )}
                          />
                       </div>
                    </div>
                  )) || <p className="text-xs text-slate-500 italic">No score contributors available.</p>}
               </div>
               <div className="rounded-3xl border border-white/5 bg-slate-950/40 p-6 flex flex-col justify-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Engine Methodology</p>
                  <p className="text-sm text-slate-300 leading-relaxed italic">"{data.explainableAI?.reasoning || 'Hybrid logic engine is currently analyzing deterministic and NLP signals.'}"</p>
                  <div className="mt-6 flex items-center gap-3">
                     <div className="flex -space-x-2">
                        <div className="h-6 w-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold border border-slate-900">1</div>
                        <div className="h-6 w-6 rounded-full bg-sky-500 flex items-center justify-center text-[10px] font-bold border border-slate-900">2</div>
                        <div className="h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold border border-slate-900">3</div>
                     </div>
                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Hybrid Logic Active</span>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Signature Visual: Performance Timeline */}
        <div className="mt-6 rounded-[2.5rem] bg-slate-900/50 p-8 border border-white/10 backdrop-blur-xl">
           <div className="flex items-center justify-between mb-8">
              <div>
                 <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-400">Interview Signature Feature</p>
                 <h3 className="text-xl font-bold text-white mt-1">Interview Performance Timeline</h3>
              </div>
           </div>
           <div className="h-[300px] w-full">
              {data.performanceTimeline && data.performanceTimeline.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={data.performanceTimeline}>
                      <defs>
                         <linearGradient id="colorConf" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                         </linearGradient>
                         <linearGradient id="colorStress" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                         </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="time" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8 }} width={25} />
                      <Tooltip 
                         contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16 }}
                         itemStyle={{ fontSize: 12, fontWeight: 700 }}
                      />
                      <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', paddingBottom: '20px' }} />
                      <Area name="Confidence" type="monotone" dataKey="confidence" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorConf)" />
                      <Area name="Stress" type="monotone" dataKey="stress" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorStress)" />
                      <Line name="Filler Words" type="monotone" dataKey="fillerWords" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4, fill: '#f59e0b' }} />
                   </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-2xl border border-white/5 bg-white/5">
                   <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Timeline Analysis Pending...</p>
                </div>
              )}
           </div>
        </div>

        {/* Evidence Panels */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
           {data.evidencePanels?.map((panel, i) => (
             <div key={i} className="group relative overflow-hidden rounded-[2.5rem] bg-slate-900/50 p-8 border border-white/10 backdrop-blur-xl">
                <div className={clsx(
                  "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity group-hover:opacity-100",
                  panel.type === 'communication' ? 'from-rose-500/5' : panel.type === 'resume' ? 'from-sky-500/5' : 'from-emerald-500/5'
                )} />
                <div className="relative flex items-center justify-between mb-6">
                   <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">{panel.title}</p>
                   <span className={clsx(
                     "text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest",
                     panel.type === 'communication' ? 'bg-rose-500/10 text-rose-400' : panel.type === 'resume' ? 'bg-sky-500/10 text-sky-400' : 'bg-emerald-500/10 text-emerald-400'
                   )}>Evidence Detected</span>
                </div>
                <div className="relative space-y-4">
                   {panel.evidence?.map((ev, idx) => (
                     <div key={idx} className="flex items-start gap-4 rounded-2xl bg-white/5 p-4 border border-white/5">
                        <div className="mt-1 h-4 w-4 rounded-full border border-white/20 flex items-center justify-center text-[10px] font-bold text-slate-500">{idx + 1}</div>
                        <p className="text-sm text-slate-300 font-medium leading-relaxed">{ev}</p>
                     </div>
                   ))}
                </div>
             </div>
           ))}
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Resume', score: resume, sub: `ATS Match ${data.resume?.atsScore || 0}%`, color: 'from-blue-500/10' },
            { label: 'Technical', score: technical, sub: `Auth: ${data.technical?.authenticityScore || 0}% Verified`, color: 'from-purple-500/10' },
            { label: 'Communication', score: communication, sub: `${data.communication?.metrics?.sentiment || 'Neutral'} Sentiment`, color: 'from-rose-500/10' },
            { label: 'Portfolio', score: portfolio, sub: `Hidden: ${data.portfolio?.hiddenSkills?.[0] || 'N/A'}`, color: 'from-amber-500/10' },
          ].map((c) => (
            <div key={c.label} className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-xl transition-all hover:border-white/20`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${c.color} to-transparent opacity-0 transition-opacity group-hover:opacity-100`} />
              <p className="relative text-[10px] font-black uppercase tracking-widest text-slate-500">{c.label}</p>
              <div className="relative mt-4 flex items-baseline gap-1">
                <span className="font-heading text-4xl font-black text-white">{c.score}</span>
                <span className="text-sm font-bold text-slate-600">/100</span>
              </div>
              <p className="relative mt-2 text-xs font-semibold text-slate-500">{c.sub}</p>
            </div>
          ))}
        </div>

        {/* Deep Dive Sections */}
        <div className="mt-6 grid gap-6 lg:grid-cols-5">
          {/* Radar & Heatmap */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            <div className="rounded-[2.5rem] bg-slate-900/50 p-8 border border-white/10 backdrop-blur-xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Readiness Radar</p>
              <div className="mt-4 h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarRows} cx="50%" cy="50%" outerRadius="80%">
                    <PolarGrid stroke="rgba(255,255,255,0.05)" />
                    <PolarAngleAxis dataKey="axis" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Score" dataKey="value" stroke="#6366f1" strokeWidth={3} fill="url(#radarGradient)" fillOpacity={0.4} />
                    <defs>
                      <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#4f46e5" />
                      </linearGradient>
                    </defs>
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(15,23,42,0.95)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 16,
                        backdropFilter: 'blur(8px)',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                      }}
                      itemStyle={{ color: '#fff', fontSize: 12, fontWeight: 600 }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

                  <div className="rounded-[2.5rem] bg-slate-900/50 p-8 border border-white/10 backdrop-blur-xl">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Interview Heatmap</p>
                    <div className="mt-6 space-y-5">
                      {data.benchmarking?.skillHeatmap?.map((s) => (
                        <HeatmapCell key={s.skill} skill={s.skill} score={s.score} />
                      )) || <p className="text-xs text-slate-500">No heatmap data available</p>}
                    </div>
                  </div>
          </div>

          {/* Interactive Details */}
          <div className="flex flex-col rounded-[2.5rem] bg-slate-900/50 border border-white/10 backdrop-blur-xl lg:col-span-3">
            <div className="flex border-b border-white/5 p-2 overflow-x-auto no-scrollbar">
              {(
                [
                  ['overview', 'Key Insights'],
                  ['roadmap', 'Success Roadmap'],
                  ['mock', 'Interview Prep'],
                  ['resume-ai', 'Resume AI'],
                  ['analytics', 'Deep Analytics'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`flex-1 min-w-fit rounded-2xl px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all ${
                    tab === id
                      ? 'bg-white/10 text-white shadow-inner'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              {tab === 'overview' && (
                <div className="space-y-8">
                  {/* Career & Multi-Role Match */}
                  <div className="rounded-3xl border border-indigo-500/20 bg-indigo-500/5 p-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">AI Career Recommendation & Multi-Role Match</p>
                    <div className="mt-4 space-y-3">
                      {data.career?.recommendedRoles?.map(role => (
                        <div key={role.role} className="flex items-center justify-between">
                           <span className="text-xs font-bold text-white">{role.role}</span>
                           <div className="flex items-center gap-3">
                              <div className="h-1 w-24 bg-white/5 rounded-full overflow-hidden">
                                 <div className="h-full bg-indigo-500" style={{ width: `${role.match}%` }} />
                              </div>
                              <span className="text-[10px] font-black text-indigo-400">{role.match}% Match</span>
                           </div>
                        </div>
                      ))}
                    </div>
                    <p className="mt-4 text-[11px] text-slate-400 leading-relaxed italic border-t border-white/5 pt-4">"{data.career?.fitReasoning || 'N/A'}"</p>
                  </div>
                  {/* Benchmarking */}
                  <div className="rounded-3xl border border-white/5 bg-slate-950/40 p-6">
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-indigo-400">Industry Benchmarking</p>
                        <p className="text-sm text-slate-300">{data.benchmarking?.vsOthers || 'N/A'}</p>
                      </div>
                      <span className="text-2xl font-black text-white">{data.benchmarking?.percentile || 0}th <span className="text-[10px] uppercase text-slate-500">Percentile</span></span>
                    </div>
                  </div>

                  {/* Why You Might Fail */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-rose-400">Brutal Reality: Why You May Get Rejected</h3>
                    <div className="space-y-2">
                      {data.recruiter?.whyYouMightFail?.map((reason, i) => (
                        <div key={i} className="flex items-start gap-3 rounded-2xl bg-rose-500/5 p-4 border border-rose-500/10">
                          <div className="h-1.5 w-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                          <span className="text-xs font-medium text-rose-50/80">{reason}</span>
                        </div>
                      )) || <p className="text-xs text-slate-500 italic">No rejection risks identified.</p>}
                    </div>
                  </div>

                  {/* Career Risks */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-amber-400">Career Risk Factors</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {data.career?.riskFactors?.map((risk, i) => (
                        <div key={i} className="rounded-2xl border border-white/5 bg-slate-950/40 p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-bold text-white uppercase">{risk.factor}</span>
                            <span className={clsx(
                              "text-[8px] font-black px-2 py-0.5 rounded-full uppercase",
                              risk.severity === 'high' ? "bg-rose-500/20 text-rose-400" : risk.severity === 'medium' ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"
                            )}>{risk.severity} Risk</span>
                          </div>
                        </div>
                      )) || <p className="text-xs text-slate-500 italic">No significant risks detected.</p>}
                    </div>
                  </div>
                </div>
              )}

              {tab === 'analytics' && (
                <div className="space-y-8">
                  {/* Readiness Timeline */}
                  <div className="rounded-3xl border border-indigo-500/20 bg-indigo-500/5 p-6">
                    <h3 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Estimated Readiness Timeline</h3>
                    <div className="mt-4 flex items-end gap-2">
                       <span className="text-4xl font-black text-white">{data.timeline?.readinessWeeks || 0}</span>
                       <span className="text-sm font-bold text-slate-500 mb-1">Weeks until Industry Ready</span>
                    </div>
                    <div className="mt-6 space-y-3">
                       {data.timeline?.breakdown?.map((b, i) => (
                         <div key={i} className="flex justify-between items-center text-xs">
                           <span className="text-slate-400">{b.area}</span>
                           <span className="font-bold text-white">{b.time}</span>
                         </div>
                       )) || <p className="text-xs text-slate-500 italic">No timeline breakdown available.</p>}
                    </div>
                  </div>

                  {/* Attention Heatmap */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Recruiter Attention Heatmap</h3>
                    <div className="space-y-3">
                      {data.resume?.attentionHeatmap?.map((zone, i) => (
                        <div key={i} className="rounded-2xl border border-white/5 bg-slate-950/40 p-4">
                          <div className="flex justify-between items-center">
                             <span className="text-xs font-bold text-white">{zone.section}</span>
                             <div className={clsx(
                               "h-2 w-2 rounded-full",
                               zone.focus === 'high' ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]" : zone.focus === 'medium' ? "bg-amber-500" : "bg-slate-700"
                             )} />
                          </div>
                          <p className="mt-2 text-[10px] text-slate-400">{zone.reason}</p>
                        </div>
                      )) || <p className="text-xs text-slate-500 italic">No heatmap data available.</p>}
                    </div>
                  </div>

                  {/* Replay Analysis */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Interview Replay Analysis</h3>
                    <div className="rounded-2xl border border-white/5 bg-slate-950/40 overflow-hidden">
                       {data.mockInterview?.replayAnalysis?.map((event, i) => (
                         <div key={i} className="flex items-center gap-4 p-4 border-b border-white/5 last:border-0">
                            <span className="text-[10px] font-mono text-indigo-400">{event.time}</span>
                            <span className={clsx(
                              "text-[8px] font-black px-2 py-0.5 rounded-full uppercase",
                              event.type === 'mistake' ? "bg-rose-500/20 text-rose-400" : event.type === 'strength' ? "bg-emerald-500/20 text-emerald-400" : "bg-indigo-500/20 text-indigo-400"
                            )}>{event.type}</span>
                            <span className="text-xs text-slate-300 font-medium">{event.event}</span>
                         </div>
                       )) || <p className="p-4 text-xs text-slate-500 italic">No replay analysis available.</p>}
                    </div>
                  </div>
                </div>
              )}

              {tab === 'roadmap' && (
                <div className="space-y-6">
                  {data.roadmap?.map((w) => (
                    <div key={w.week} className="group relative overflow-hidden rounded-3xl border border-white/5 bg-slate-950/40 p-6 transition-all hover:border-indigo-500/30">
                      <div className="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-indigo-500 to-indigo-700 opacity-50 transition-opacity group-hover:opacity-100" />
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">PHASE 0{w.week}</span>
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">{w.title}</h4>
                      </div>
                      <ul className="mt-4 space-y-3">
                        {w.items?.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-sm text-slate-300">
                            <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                            <div className="flex flex-col">
                              <span className="font-medium leading-relaxed">{item.text}</span>
                              {item.link && (
                                <a href={item.link} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-sky-400 hover:underline mt-1 flex items-center gap-1">
                                  View Resource
                                  <svg className="h-2 w-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </a>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )) || <p className="text-xs text-slate-500 italic">No roadmap available.</p>}
                </div>
              )}

              {tab === 'mock' && (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400">AI-Generated Technical Challenges</h3>
                    <div className="space-y-3">
                      {data.mockInterview?.technical?.map((q, i) => (
                        <div key={i} className="rounded-2xl border border-white/5 bg-slate-950/40 p-4 text-sm font-medium text-slate-200 leading-relaxed">
                          {q}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-400">Behavioral Focus</h3>
                      <div className="space-y-3">
                        {data.mockInterview?.behavioral?.map((q, i) => (
                          <div key={i} className="rounded-2xl border border-white/5 bg-white/5 p-4 text-xs font-medium text-slate-300 leading-relaxed">
                            {q}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-amber-400">HR & Motivation</h3>
                      <div className="space-y-3">
                        {data.mockInterview?.hr?.map((q, i) => (
                          <div key={i} className="rounded-2xl border border-white/5 bg-white/5 p-4 text-xs font-medium text-slate-300 leading-relaxed">
                            {q}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {tab === 'resume-ai' && (
                <div className="space-y-6">
                  <div className="rounded-3xl border border-indigo-500/20 bg-indigo-500/5 p-6 mb-8">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Resume Optimizer</h3>
                    <p className="mt-2 text-xs text-slate-400">We've identified weak impact statements and generated higher-ROI alternatives for your role.</p>
                  </div>
                  <div className="space-y-4">
                    {data.resume?.rewrites?.map((r, i) => (
                      <div key={i} className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl border border-rose-500/10 bg-rose-500/5 p-4">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-rose-400">Before</p>
                          <p className="mt-2 text-xs text-slate-400 line-through italic">"{r.original}"</p>
                        </div>
                        <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-4">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">After (AI Optimized)</p>
                          <p className="mt-2 text-xs text-emerald-50 font-medium">"{r.improved}"</p>
                        </div>
                      </div>
                    )) || <p className="text-xs text-slate-500 italic">No resume rewrites available.</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Technical Breakdown Section */}
        <div className="mt-6 rounded-[2.5rem] bg-slate-900/50 p-8 border border-white/10 backdrop-blur-xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Technical Skill Breakdown</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.technical?.breakdown?.map((line, i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl bg-white/5 p-4 border border-white/5 transition-all hover:border-white/10 hover:bg-white/10">
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${line.startsWith('✓') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                  {line.startsWith('✓') ? '✓' : '✗'}
                </span>
                <span className="text-xs font-medium text-slate-300 leading-tight">
                  {line.substring(2)}
                </span>
              </div>
            )) || <p className="text-xs text-slate-500 italic">No technical breakdown available.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
