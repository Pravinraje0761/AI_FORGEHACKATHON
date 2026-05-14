export type Step = 'landing' | 'intake' | 'technical' | 'loading' | 'results'

export type RecruiterShortlist = 'yes' | 'maybe' | 'no'

export interface TechQuestion {
  id: string
  question: string
  options: string[]
}

export interface EvaluateResponse {
  overall: { score: number; level: string; insight: string }
  weights: { resume: number; technical: number; communication: number; portfolio: number }
  resume: {
    score: number
    atsScore: number
    missingKeywords: string[]
    strengths: string[]
    weaknesses: string[]
  }
  technical: {
    score: number
    correct: number
    total: number
    strengths: string[]
    weaknesses: string[]
    breakdown: string[]
  }
  communication: {
    score: number
    strengths: string[]
    weaknesses: string[]
    metrics: { wpmEstimate: number; fillerRatio: number; sentiment: string }
  }
  portfolio: { score: number; strengths: string[]; weaknesses: string[] }
  recruiter: { shortlist: RecruiterShortlist; reasoning: string }
  radar: { resume: number; technical: number; communication: number; portfolio: number; fullMark: number }
  roadmap: { week: number; title: string; items: string[] }[]
  mockInterview: { technical: string[]; hr: string[]; behavioral: string[] }
  meta: { usedOpenAI: boolean; processingMs: number }
}
