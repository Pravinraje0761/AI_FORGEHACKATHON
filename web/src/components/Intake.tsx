import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import { fetchRoles } from '../lib/api'

type Props = {
  initialRole: string
  onBack: () => void
  onNext: (payload: {
    name: string
    role: string
    skillLevel: string
    resumeFile: File | null
    githubUrl: string
    portfolioUrl: string
    linkedinUrl: string
    introText: string
  }) => void
}

export function Intake({ initialRole, onBack, onNext }: Props) {
  const [roles, setRoles] = useState<string[]>([])
  const [name, setName] = useState('')
  const [role, setRole] = useState(initialRole)
  const [skillLevel, setSkillLevel] = useState('Mid')
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [githubUrl, setGithubUrl] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [introText, setIntroText] = useState('')
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    fetchRoles()
      .then(setRoles)
      .catch(() => setRoles(['Full Stack Developer', 'Data Analyst', 'AI Engineer', 'UI/UX Designer']))
  }, [])

  const roleOptions = useMemo(() => (roles.length ? roles : [initialRole]), [roles, initialRole])

  useEffect(() => {
    setRole((r) => (roleOptions.includes(r) ? r : roleOptions[0]!))
  }, [roleOptions])

  const startDictation = () => {
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Ctor) {
      alert('Speech recognition is not supported in this browser. Try Chrome or paste your answer.')
      return
    }
    const rec = new Ctor()
    rec.lang = 'en-US'
    rec.continuous = true
    rec.interimResults = true
    recognitionRef.current = rec
    rec.onresult = (ev) => {
      let chunk = ''
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        chunk += ev.results[i]![0]!.transcript
      }
      setIntroText((prev) => `${prev}${prev && !prev.endsWith(' ') ? ' ' : ''}${chunk}`)
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

  const canContinue = name.trim().length >= 2

  return (
    <div className="relative min-h-[100dvh] noise">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.25),transparent_55%)]" />
      <div className="relative mx-auto max-w-3xl px-5 py-12 sm:px-8">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-slate-400 transition hover:text-white"
        >
          ← Back
        </button>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
          <h2 className="font-heading text-3xl text-white sm:text-4xl">Candidate profile</h2>
          <p className="mt-2 text-sm text-slate-400">
            Upload a resume (PDF/DOCX) and add links. Optional: dictate “Tell me about yourself” with your mic.
          </p>

          <div className="mt-8 space-y-5">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Full name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none ring-0 transition focus:border-indigo-400/60"
                placeholder="Alex Rivera"
              />
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Target role</span>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-indigo-400/60"
                >
                  {roleOptions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Experience band</span>
                <select
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-indigo-400/60"
                >
                  {['Junior', 'Mid', 'Senior'].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Resume (PDF / DOCX)</span>
              <input
                type="file"
                accept=".pdf,.docx,.txt,.md,application/pdf"
                onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
                className="mt-2 block w-full text-sm text-slate-300 file:mr-4 file:rounded-xl file:border-0 file:bg-indigo-500/20 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-100 hover:file:bg-indigo-500/30"
              />
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">GitHub URL</span>
                <input
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-indigo-400/60"
                  placeholder="https://github.com/you"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Portfolio URL</span>
                <input
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-indigo-400/60"
                  placeholder="https://you.com"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">LinkedIn URL</span>
                <input
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-indigo-400/60"
                  placeholder="https://linkedin.com/in/you"
                />
              </label>
            </div>

            <div className="glass rounded-3xl p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Tell me about yourself</p>
                  <p className="text-xs text-slate-400">60–120 seconds. We analyze structure, fillers, and clarity.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={listening ? stopDictation : startDictation}
                    className={clsx(
                      'rounded-xl px-4 py-2 text-xs font-semibold transition',
                      listening
                        ? 'bg-rose-500/20 text-rose-100 ring-1 ring-rose-400/40'
                        : 'bg-white/10 text-white hover:bg-white/15',
                    )}
                  >
                    {listening ? 'Stop mic' : 'Dictate'}
                  </button>
                </div>
              </div>
              <textarea
                value={introText}
                onChange={(e) => setIntroText(e.target.value)}
                rows={6}
                className="mt-4 w-full resize-y rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-100 outline-none focus:border-indigo-400/60"
                placeholder="Paste or dictate a concise story: what you build, what you’re strongest at, and what you want next."
              />
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={!canContinue}
              onClick={() =>
                onNext({
                  name: name.trim(),
                  role,
                  skillLevel,
                  resumeFile,
                  githubUrl: githubUrl.trim(),
                  portfolioUrl: portfolioUrl.trim(),
                  linkedinUrl: linkedinUrl.trim(),
                  introText: introText.trim(),
                })
              }
              className="rounded-2xl bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-indigo-500/20 transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continue to technical screen →
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
