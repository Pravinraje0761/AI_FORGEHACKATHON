import OpenAI from 'openai'
import { scoreTechnical } from './questionsBank.js'

const FILLERS = /\b(um|uh|like|you know|basically|actually|literally|sort of|kind of)\b/gi

const ROLE_KEYWORDS = {
  'Full Stack Developer': [
    'react',
    'node',
    'api',
    'sql',
    'typescript',
    'docker',
    'ci/cd',
    'authentication',
    'rest',
    'mongodb',
    'postgres',
  ],
  'Data Analyst': ['sql', 'python', 'excel', 'tableau', 'power bi', 'statistics', 'pandas', 'visualization', 'etl', 'metrics'],
  'AI Engineer': ['pytorch', 'tensorflow', 'llm', 'nlp', 'transformer', 'vector', 'embedding', 'ml', 'model', 'evaluation'],
  'UI/UX Designer': ['figma', 'prototype', 'usability', 'accessibility', 'wcag', 'wireframe', 'research', 'design system'],
}

const ACTION_VERBS =
  /\b(achieved|accelerated|built|delivered|designed|developed|engineered|improved|increased|led|optimized|owned|reduced|scaled|shipped|automated|implemented)\b/i

function wordCount(text) {
  return (text.trim().match(/\b[\w'-]+\b/g) || []).length
}

function resumeHeuristic(text, role) {
  const t = text || ''
  const lower = t.toLowerCase()
  const wc = wordCount(t)
  let score = 45
  const strengths = []
  const weaknesses = []
  const missingKeywords = []

  if (wc > 120) score += 8
  else weaknesses.push('Resume text is short or empty — add measurable outcomes and context.')

  const sections = [
    ['experience|employment|work history', 'Clear experience section'],
    ['education|university|degree', 'Education section present'],
    ['project', 'Projects section present'],
    ['skill', 'Skills section present'],
  ]
  for (const [pattern, label] of sections) {
    if (new RegExp(pattern, 'i').test(t)) {
      score += 4
      strengths.push(label)
    } else {
      weaknesses.push(`Consider adding or strengthening: ${label.toLowerCase()}.`)
    }
  }

  if (/\d+%|\$\d|[\d,]+\s*(usd|inr|users|requests|ms|seconds|minutes)/i.test(t)) {
    score += 10
    strengths.push('Includes quantified impact signals (numbers, %, scale).')
  } else {
    weaknesses.push('Add quantified achievements (%, revenue, latency, users, scale).')
  }

  if (ACTION_VERBS.test(t)) {
    score += 6
    strengths.push('Uses strong action-oriented language.')
  } else {
    weaknesses.push('Replace weak phrasing with stronger action verbs (delivered, scaled, optimized).')
  }

  if (/github\.com|linkedin\.com|portfolio|http(s)?:\/\//i.test(t)) {
    score += 6
    strengths.push('Contains outbound links (GitHub, LinkedIn, or portfolio).')
  } else {
    weaknesses.push('Add GitHub or portfolio links to validate engineering work.')
  }

  const kws = ROLE_KEYWORDS[role] || ROLE_KEYWORDS['Full Stack Developer']
  let hits = 0
  for (const kw of kws) {
    if (lower.includes(kw)) hits += 1
    else missingKeywords.push(kw)
  }
  const atsRatio = hits / kws.length
  score += Math.round(atsRatio * 18)
  if (hits >= 6) strengths.push('Role-relevant keywords align with target job family.')
  if (hits < 4) weaknesses.push('Increase role-relevant keywords naturally (tools, domains, outcomes).')

  score = Math.min(100, Math.max(30, score))

  const atsScore = Math.round(Math.min(100, 40 + atsRatio * 60))

  return {
    score,
    atsScore,
    missingKeywords: missingKeywords.slice(0, 6),
    strengths: strengths.slice(0, 5),
    weaknesses: weaknesses.slice(0, 6),
  }
}

function communicationHeuristic(introText) {
  const text = introText || ''
  const wc = wordCount(text)
  const fillers = (text.match(FILLERS) || []).length
  const fillerRatio = wc > 0 ? fillers / wc : 0

  let score = 62
  const strengths = []
  const weaknesses = []

  if (wc < 40) {
    score -= 18
    weaknesses.push('Answer is very short — recruiters expect a concise 45–90 second story.')
  } else if (wc > 220) {
    score -= 8
    weaknesses.push('Answer may be too long — tighten to a crisp narrative arc.')
  } else {
    score += 6
    strengths.push('Answer length is in a practical mock-interview range.')
  }

  if (fillerRatio > 0.08) {
    score -= 14
    weaknesses.push('Elevated filler-word density — practice pausing instead of filler.')
  } else if (fillerRatio > 0.04) {
    score -= 6
    weaknesses.push('Some filler words detected — aim for cleaner pacing.')
  } else {
    score += 8
    strengths.push('Low filler-word density relative to length.')
  }

  if (/\b(i|my)\b.*\b(built|led|shipped|improved|designed)\b/i.test(text)) {
    score += 10
    strengths.push('Shows ownership language (I built/led/shipped).')
  } else {
    weaknesses.push('Add a clear ownership line: what you did, with what outcome.')
  }

  if (/first|then|finally|as a result|outcome|impact/i.test(text)) {
    score += 6
    strengths.push('Hints of structured storytelling (sequence/outcome).')
  } else {
    weaknesses.push('Structure with a simple arc: context → action → outcome.')
  }

  const sentiment = score >= 72 ? 'positive' : score >= 58 ? 'neutral' : 'needs work'

  score = Math.min(92, Math.max(38, score))

  const wpmEstimate = wc > 0 ? Math.min(190, 110 + Math.round(wc / 3)) : 90

  return {
    score,
    strengths: strengths.slice(0, 4),
    weaknesses: weaknesses.slice(0, 5),
    metrics: {
      wpmEstimate,
      fillerRatio: Math.round(fillerRatio * 1000) / 1000,
      sentiment,
    },
  }
}

function githubUsername(url) {
  try {
    const u = new URL(url)
    if (!u.hostname.includes('github.com')) return null
    const parts = u.pathname.split('/').filter(Boolean)
    return parts[0] || null
  } catch {
    return null
  }
}

async function githubSignals(username) {
  if (!username) return { ok: false, publicRepos: 0, bio: '' }
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 4500)
  try {
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
      headers: { 'User-Agent': 'InterviewReadinessDemo/1.0' },
      signal: controller.signal,
    })
    if (!res.ok) return { ok: false, publicRepos: 0, bio: '' }
    const data = await res.json()
    return { ok: true, publicRepos: data.public_repos ?? 0, bio: data.bio || '' }
  } catch {
    return { ok: false, publicRepos: 0, bio: '' }
  } finally {
    clearTimeout(timeout)
  }
}

function portfolioHeuristic({ githubUrl, portfolioUrl, linkedinUrl, resumeText }) {
  let score = 48
  const strengths = []
  const weaknesses = []

  const hasGh = !!githubUrl && githubUrl.includes('github.com')
  const hasPf = !!portfolioUrl && /^https?:\/\//i.test(portfolioUrl)
  const hasLi = !!linkedinUrl && linkedinUrl.includes('linkedin.com')

  if (hasGh) {
    score += 14
    strengths.push('GitHub profile link provided.')
  } else weaknesses.push('Add a GitHub link to validate code and collaboration.')

  if (hasPf) {
    score += 16
    strengths.push('Portfolio site link provided.')
  } else weaknesses.push('Add a portfolio or deployed project showcase.')

  if (hasLi) {
    score += 10
    strengths.push('LinkedIn link provided for professional context.')
  } else weaknesses.push('Add LinkedIn for recruiter verification and narrative consistency.')

  if (/github\.com/i.test(resumeText || '')) {
    score += 4
    strengths.push('Resume references GitHub — good credibility signal.')
  }

  return { score: Math.min(100, Math.max(35, score)), strengths, weaknesses, hasGh, hasPf, hasLi }
}

function overallLevel(score) {
  if (score >= 85) return 'Industry Ready'
  if (score >= 70) return 'Interview Ready'
  if (score >= 55) return 'Developing'
  return 'Early Stage'
}

function shortlist(score) {
  if (score >= 80) return 'yes'
  if (score >= 64) return 'maybe'
  return 'no'
}

function buildRoadmap({ resume, technical, communication, portfolio, role }) {
  const weeks = [
    {
      week: 1,
      title: 'Foundations',
      items: [] /** @type {string[]} */,
    },
    { week: 2, title: 'Depth', items: [] },
    { week: 3, title: 'Polish', items: [] },
  ]

  if (resume.score < 72) {
    weeks[0].items.push('Rewrite top 3 bullets with quantified impact (%, scale, latency).')
    weeks[0].items.push('Add missing sections: Projects, Skills, and outbound links.')
  }
  if (technical.score < 72) {
    weeks[1].items.push(`Drill ${role} fundamentals: spaced repetition on weak MCQ topics above.`)
    weeks[1].items.push('Build one small end-to-end exercise (API + persistence + tests).')
  }
  if (communication.score < 72) {
    weeks[0].items.push('Practice STAR answers aloud; record and remove filler words.')
    weeks[2].items.push('Do 3 mock “Tell me about yourself” iterations with a timer (60–90s).')
  }
  if (portfolio.score < 72) {
    weeks[1].items.push('Ship one deployed project with README: problem, approach, metrics, demo link.')
    weeks[2].items.push('Tighten README templates across repos (setup, architecture, results).')
  }

  if (weeks[0].items.length === 0) weeks[0].items.push('Tune resume storytelling for the target role keywords.')
  if (weeks[1].items.length === 0) weeks[1].items.push('Add a challenge project aligned to your target job postings.')
  if (weeks[2].items.length === 0) weeks[2].items.push('Run a full mock interview loop: behavioral + technical + retro.')

  for (const w of weeks) {
    if (w.items.length > 4) w.items.length = 4
  }
  return weeks
}

function mockInterviewQuestions(role, resumeText) {
  const tokens = (resumeText || '')
    .toLowerCase()
    .match(/\b[a-z]{4,}\b/g)
  const top = [...new Set((tokens || []).filter((t) => !STOPWORDS.has(t)).slice(0, 8))].slice(0, 3)

  const tech = [
    `Walk through how you would design a scalable ${role.includes('Data') ? 'metrics pipeline' : 'API layer'} for your strongest project.`,
    `What trade-offs did you consider between ${top[0] || 'performance'} and maintainability in your recent work?`,
    `How would you debug a production incident affecting ${role.includes('AI') ? 'model latency' : 'p99 latency'}?`,
  ]
  const hr = [
    'Why this role, and why now?',
    'Tell me about a time you disagreed with a teammate. What was the outcome?',
  ]
  const behavioral = [
    'Describe a project where requirements changed late. How did you adapt?',
    'Give an example of a mistake you shipped. What did you change afterward?',
  ]
  return { technical: tech, hr, behavioral }
}

const STOPWORDS = new Set([
  'with',
  'from',
  'that',
  'this',
  'your',
  'have',
  'will',
  'been',
  'were',
  'they',
  'their',
  'about',
  'into',
  'more',
  'than',
  'then',
  'some',
  'such',
  'also',
  'using',
  'based',
  'experience',
  'skills',
  'education',
  'project',
  'projects',
  'work',
  'company',
])

/**
 * @param {object} input
 * @param {string} input.name
 * @param {string} input.role
 * @param {string} input.skillLevel
 * @param {string} input.resumeText
 * @param {string} input.githubUrl
 * @param {string} input.portfolioUrl
 * @param {string} input.linkedinUrl
 * @param {string} input.introText
 * @param {Record<string, number>} input.techAnswers
 */
export async function evaluateCandidate(input) {
  const started = Date.now()
  const role = input.role || 'Full Stack Developer'

  const resume = resumeHeuristic(input.resumeText || '', role)
  const tech = scoreTechnical(role, input.techAnswers || {})
  const comm = communicationHeuristic(input.introText || '')
  const pfBase = portfolioHeuristic({
    githubUrl: input.githubUrl,
    portfolioUrl: input.portfolioUrl,
    linkedinUrl: input.linkedinUrl,
    resumeText: input.resumeText || '',
  })

  let portfolioScore = pfBase.score
  const portfolioStrengths = [...pfBase.strengths]
  const portfolioWeaknesses = [...pfBase.weaknesses]

  const ghUser = githubUsername(input.githubUrl || '')
  const gh = await githubSignals(ghUser)
  if (gh.ok) {
    if (gh.publicRepos >= 12) {
      portfolioScore = Math.min(100, portfolioScore + 8)
      portfolioStrengths.push(`GitHub shows consistent public activity (${gh.publicRepos}+ repos).`)
    } else if (gh.publicRepos > 0) {
      portfolioStrengths.push('GitHub profile resolves publicly — good baseline credibility.')
    } else {
      portfolioWeaknesses.push('GitHub account shows limited public repo visibility — add standout projects.')
    }
  } else if (pfBase.hasGh) {
    portfolioWeaknesses.push('Could not verify GitHub publicly (rate limit or private profile) — ensure a strong README.')
  }

  const skillBoost = input.skillLevel === 'Senior' ? 4 : input.skillLevel === 'Junior' ? -2 : 0
  const technicalScore = Math.min(100, Math.max(30, tech.score + skillBoost))

  const weights = { resume: 0.25, technical: 0.35, communication: 0.2, portfolio: 0.2 }
  const overallScore = Math.round(
    resume.score * weights.resume +
      technicalScore * weights.technical +
      comm.score * weights.communication +
      portfolioScore * weights.portfolio
  )

  const level = overallLevel(overallScore)
  const short = shortlist(overallScore)

  const recruiterReasoning =
    short === 'yes'
      ? 'Strong signals across technical depth and presentation; likely to progress with standard panel interviews.'
      : short === 'maybe'
        ? 'Mixed signals: technical or portfolio credibility is promising, but polish gaps remain in packaging and narrative.'
        : 'Readiness gaps are visible in resume/portfolio evidence or communication clarity; additional preparation is recommended before screening.'

  const insight = `Candidate demonstrates ${
    technicalScore >= 72 ? 'solid' : 'developing'
  } technical signals for ${role}, with ${
    resume.score >= 72 ? 'credible resume structure' : 'resume gaps around measurable impact'
  } and ${
    comm.score >= 72 ? 'clear communication fundamentals' : 'communication areas to tighten (structure/filler)'
  }. Portfolio reads as ${portfolioScore >= 72 ? 'credible' : 'under-evidenced'} for recruiter verification.`

  const roadmap = buildRoadmap({
    resume: { score: resume.score },
    technical: { score: technicalScore },
    communication: { score: comm.score },
    portfolio: { score: portfolioScore },
    role,
  })

  const mockInterview = mockInterviewQuestions(role, input.resumeText || '')

  let usedOpenAI = false
  let aiNarrative = null
  if (process.env.OPENAI_API_KEY) {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      const snippet = (input.resumeText || '').slice(0, 3500)
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.35,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You are a senior technical recruiter. Return ONLY valid JSON with keys: recruiterInsight (string), recruiterReasoning (string), roadmapBullets (array of 6-10 short strings). Be specific and actionable. No scores.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              name: input.name,
              role,
              skillLevel: input.skillLevel,
              heuristicInsight: insight,
              resumeSnippet: snippet,
              intro: (input.introText || '').slice(0, 1200),
              links: {
                github: input.githubUrl,
                portfolio: input.portfolioUrl,
                linkedin: input.linkedinUrl,
              },
              scores: {
                overall: overallScore,
                resume: resume.score,
                technical: technicalScore,
                communication: comm.score,
                portfolio: portfolioScore,
              },
            }),
          },
        ],
      })
      const raw = completion.choices[0]?.message?.content || '{}'
      aiNarrative = JSON.parse(raw)
      usedOpenAI = true
    } catch {
      usedOpenAI = false
    }
  }

  const finalInsight = aiNarrative?.recruiterInsight || insight
  const finalRecruiterReasoning = aiNarrative?.recruiterReasoning || recruiterReasoning
  const extraRoadmap = Array.isArray(aiNarrative?.roadmapBullets) ? aiNarrative.roadmapBullets.slice(0, 6) : []
  if (extraRoadmap.length) {
    roadmap[0].items.push(...extraRoadmap.slice(0, 2))
    roadmap[1].items.push(...extraRoadmap.slice(2, 4))
    roadmap[2].items.push(...extraRoadmap.slice(4, 6))
    for (const w of roadmap) w.items = [...new Set(w.items)].slice(0, 4)
  }

  return {
    overall: {
      score: overallScore,
      level,
      insight: finalInsight,
    },
    weights,
    resume: {
      score: resume.score,
      atsScore: resume.atsScore,
      missingKeywords: resume.missingKeywords,
      strengths: resume.strengths,
      weaknesses: resume.weaknesses,
    },
    technical: {
      score: technicalScore,
      correct: tech.correct,
      total: tech.total,
      strengths: [
        tech.correct >= tech.total - 1 ? 'Strong accuracy on the rapid technical screen.' : 'Shows partial mastery — review missed topics below.',
      ],
      weaknesses:
        tech.correct < tech.total
          ? [`Missed ${tech.total - tech.correct} question(s) — revisit fundamentals highlighted in the breakdown.`]
          : [],
      breakdown: tech.breakdown,
    },
    communication: {
      score: comm.score,
      strengths: comm.strengths,
      weaknesses: comm.weaknesses,
      metrics: comm.metrics,
    },
    portfolio: {
      score: portfolioScore,
      strengths: portfolioStrengths,
      weaknesses: portfolioWeaknesses,
    },
    recruiter: {
      shortlist: short,
      reasoning: finalRecruiterReasoning,
    },
    radar: {
      resume: resume.score,
      technical: technicalScore,
      communication: comm.score,
      portfolio: portfolioScore,
      fullMark: 100,
    },
    roadmap,
    mockInterview,
    meta: {
      usedOpenAI,
      processingMs: Date.now() - started,
    },
  }
}
