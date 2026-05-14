export type Step = 'landing' | 'intake' | 'technical' | 'mock-interview' | 'loading' | 'results'

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
    sectionAnalysis?: Record<string, number>
    rewrites: { original: string; improved: string }[]
    attentionHeatmap: { section: string; focus: 'high' | 'medium' | 'low'; reason: string }[]
  }
  technical: {
    score: number
    correct: number
    total: number
    strengths: string[]
    weaknesses: string[]
    breakdown: string[]
    authenticityScore: number
  }
  communication: {
    score: number
    strengths: string[]
    weaknesses: string[]
    metrics: { 
      wpmEstimate: number; 
      fillerRatio: number; 
      sentiment: string;
      confidenceRecovery: string;
      fatigueDetected: boolean;
    }
    behavioralAnalysis: { trait: string; score: number; feedback: string }[]
    persona: { name: string; icon: string; description: string }
  }
  portfolio: { 
    score: number; 
    strengths: string[]; 
    weaknesses: string[];
    hiddenSkills: string[];
    github?: {
      ok: boolean;
      publicRepos: number;
      stars: number;
      languages: string[];
      followers: number;
    }
  }
  recruiter: { 
    shortlist: RecruiterShortlist; 
    verdictBand?: string
    reasoning: string;
    likelihoodOfPassing: number;
    topConcerns: string[];
    whyYouMightFail: string[];
    pressureHandlingScore: number;
  }
  hiringProbability: {
    startup: number
    midSize: number
    faang: number
  }
  benchmarking: { 
    percentile: number; 
    vsOthers: string; 
    skillHeatmap: { skill: string; score: number }[];
    realRecruiterComparison: string;
  }
  career: { 
    recommendedRoles: { role: string; match: number }[]; 
    fitReasoning: string;
    salaryPrediction: { range: string; currency: string };
    riskFactors: { factor: string; severity: 'high' | 'medium' | 'low' }[];
  }
  timeline: { 
    readinessWeeks: number; 
    breakdown: { area: string; time: string }[];
  }
  radar: { resume: number; technical: number; communication: number; portfolio: number; fullMark: number }
  explainableAI: {
    scoreContributors: { label: string; score: number; impact: 'positive' | 'negative' | 'neutral' }[]
    reasoning: string
  }
  evidencePanels: {
    title: string
    type: 'communication' | 'resume' | 'technical'
    evidence: string[]
  }[]
  performanceTimeline: {
    time: string
    confidence: number
    fillerWords: number
    stress: number
  }[]
  personalizedMockQuestion?: string
  nextStepsForGrowth?: string[]
  roadmap: { week: number; title: string; items: { text: string; link?: string }[] }[]
  mockInterview: { 
    technical: string[]; 
    hr: string[]; 
    behavioral: string[];
    replayAnalysis: { time: string; event: string; type: 'mistake' | 'strength' | 'filler' }[];
  }
  meta: { usedOpenAI: boolean; processingMs: number }
  /** Target role used for this evaluation (mirrors request). */
  role?: string
}
