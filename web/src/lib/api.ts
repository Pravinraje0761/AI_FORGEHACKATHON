import type { EvaluateResponse, TechQuestion } from '../types'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

export async function fetchRoles(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/api/roles`)
  if (!res.ok) throw new Error('Failed to load roles')
  const data = (await res.json()) as { roles: string[] }
  return data.roles
}

export async function fetchQuestions(role: string, resumeFile?: File | null): Promise<TechQuestion[]> {
  try {
    if (resumeFile) {
      const fd = new FormData()
      fd.append('role', role)
      fd.append('resume', resumeFile)
      const res = await fetch(`${API_BASE}/api/questions`, { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Failed to load personalized questions')
      const data = (await res.json()) as { questions: TechQuestion[] }
      return data.questions
    }

    const params = new URLSearchParams({ role })
    const res = await fetch(`${API_BASE}/api/questions?${params}`)
    if (!res.ok) throw new Error('Failed to load questions')
    const data = (await res.json()) as { questions: TechQuestion[] }
    return data.questions
  } catch (err) {
    console.error('Fetch questions failed, falling back to static:', err)
    // Fallback if the endpoint is down or errors out
    const params = new URLSearchParams({ role })
    const res = await fetch(`${API_BASE}/api/questions?${params}`)
    const data = (await res.json()) as { questions: TechQuestion[] }
    return data.questions
  }
}

export async function submitEvaluation(form: {
  name: string
  role: string
  skillLevel: string
  githubUrl: string
  portfolioUrl: string
  linkedinUrl: string
  introText: string
  mockInterviewAnswer: string
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
  fd.append('mockInterviewAnswer', form.mockInterviewAnswer)
  fd.append('techAnswersJson', JSON.stringify(form.techAnswers))
  if (form.resumeFile) fd.append('resume', form.resumeFile)

  const res = await fetch(`${API_BASE}/api/evaluate`, { method: 'POST', body: fd })
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { detail?: string; error?: string }
    throw new Error(err.detail || err.error || 'Evaluation failed')
  }
  return (await res.json()) as EvaluateResponse
}
