import type { EvaluateResponse, TechQuestion } from '../types'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

export async function fetchRoles(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/api/roles`)
  if (!res.ok) throw new Error('Failed to load roles')
  const data = (await res.json()) as { roles: string[] }
  return data.roles
}

export async function fetchQuestions(role: string): Promise<TechQuestion[]> {
  const params = new URLSearchParams({ role })
  const res = await fetch(`${API_BASE}/api/questions?${params}`)
  if (!res.ok) throw new Error('Failed to load questions')
  const data = (await res.json()) as { questions: TechQuestion[] }
  return data.questions
}

export async function submitEvaluation(form: {
  name: string
  role: string
  skillLevel: string
  githubUrl: string
  portfolioUrl: string
  linkedinUrl: string
  introText: string
  techAnswers: Record<string, number>
  resumeFile?: File | null
}): Promise<EvaluateResponse> {
  const fd = new FormData()
  fd.append('name', form.name)
  fd.append('role', form.role)
  fd.append('skillLevel', form.skillLevel)
  fd.append('githubUrl', form.githubUrl)
  fd.append('portfolioUrl', form.portfolioUrl)
  fd.append('linkedinUrl', form.linkedinUrl)
  fd.append('introText', form.introText)
  fd.append('techAnswersJson', JSON.stringify(form.techAnswers))
  if (form.resumeFile) fd.append('resume', form.resumeFile)

  const res = await fetch(`${API_BASE}/api/evaluate`, { method: 'POST', body: fd })
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { detail?: string; error?: string }
    throw new Error(err.detail || err.error || 'Evaluation failed')
  }
  return (await res.json()) as EvaluateResponse
}
