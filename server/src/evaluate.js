import OpenAI from 'openai'
import { scoreTechnical } from './questionsBank.js'

const FILLERS = /\b(um|uh|like|you know|basically|actually|literally|sort of|kind of)\b/gi

const ROLE_KEYWORDS = {
  'Full Stack Developer': {
    primary: ['react', 'node', 'api', 'sql', 'typescript', 'javascript', 'html', 'css'],
    secondary: ['docker', 'ci/cd', 'authentication', 'rest', 'mongodb', 'postgres', 'aws', 'git', 'next.js', 'express'],
    soft: ['collaboration', 'agile', 'scrum', 'problem-solving', 'communication']
  },
  'Data Analyst': {
    primary: ['sql', 'python', 'excel', 'tableau', 'power bi'],
    secondary: ['statistics', 'pandas', 'visualization', 'etl', 'metrics', 'r', 'data modeling', 'looker', 'bi'],
    soft: ['analytical', 'insights', 'presentation', 'attention to detail']
  },
  'AI Engineer': {
    primary: ['pytorch', 'tensorflow', 'llm', 'nlp', 'machine learning', 'python'],
    secondary: ['transformer', 'vector', 'embedding', 'ml', 'model', 'evaluation', 'langchain', 'scikit-learn', 'deep learning'],
    soft: ['research', 'optimization', 'critical thinking']
  },
  'UI/UX Designer': {
    primary: ['figma', 'prototype', 'user experience', 'user interface', 'design'],
    secondary: ['usability', 'accessibility', 'wcag', 'wireframe', 'research', 'design system', 'adobe xd', 'sketch', 'user flows'],
    soft: ['empathy', 'creativity', 'communication', 'user-centric']
  },
  'Backend Engineer': {
    primary: ['api', 'sql', 'postgres', 'redis', 'docker', 'kubernetes', 'microservices', 'node', 'python'],
    secondary: ['kafka', 'grpc', 'rest', 'mongodb', 'aws', 'ci/cd', 'authentication', 'caching', 'queues', 'git'],
    soft: ['reliability', 'ownership', 'debugging', 'on-call', 'scalability']
  },
}

const ROLE_WEIGHT_PRESETS = {
  default: { resume: 0.25, technical: 0.35, communication: 0.2, portfolio: 0.2 },
  ai: { resume: 0.18, technical: 0.42, communication: 0.15, portfolio: 0.25 },
  designer: { resume: 0.22, technical: 0.2, communication: 0.22, portfolio: 0.36 },
  analyst: { resume: 0.28, technical: 0.32, communication: 0.2, portfolio: 0.2 },
  backend: { resume: 0.22, technical: 0.4, communication: 0.18, portfolio: 0.2 },
}

/** @returns {{ resume: number; technical: number; communication: number; portfolio: number }} */
function getRoleWeights(role) {
  const r = (role || '').toLowerCase()
  if (r.includes('ui/ux') || r.includes('ux designer') || (r.includes('designer') && !r.includes('engineer'))) {
    return { ...ROLE_WEIGHT_PRESETS.designer }
  }
  if (r.includes('ai engineer') || r.includes('ml engineer') || (r.includes('machine learning') && r.includes('engineer'))) {
    return { ...ROLE_WEIGHT_PRESETS.ai }
  }
  if (r.includes('data analyst') || r === 'analyst') {
    return { ...ROLE_WEIGHT_PRESETS.analyst }
  }
  if (r.includes('backend')) {
    return { ...ROLE_WEIGHT_PRESETS.backend }
  }
  return { ...ROLE_WEIGHT_PRESETS.default }
}

function hashToUnit(str) {
  let h = 2166136261
  const s = str || ''
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 1001) / 1000
}

const SECTION_PATTERNS = {
  experience: /experience|employment|work history|career/i,
  education: /education|university|degree|college|academic/i,
  projects: /projects|portfolio|personal work/i,
  skills: /skills|technical|technologies|tools/i,
  summary: /summary|profile|objective|about me/i,
  contact: /contact|email|phone|linkedin|github/i
}

const ACTION_VERBS =
  /\b(achieved|accelerated|built|delivered|designed|developed|engineered|improved|increased|led|optimized|owned|reduced|scaled|shipped|automated|implemented|mentored|coordinated|managed|researched)\b/i

function wordCount(text) {
  return (text.trim().match(/\b[\w'-]+\b/g) || []).length
}

function resumeHeuristic(text, role) {
  const t = text || ''
  const lower = t.toLowerCase()
  const wc = wordCount(t)
  let score = 30
  const strengths = []
  const weaknesses = []
  const missingKeywords = []
  const sectionScores = {}

  // 1. Length & Density Analysis
  if (wc > 150 && wc < 800) {
    score += 15
    strengths.push('Optimal content density for a professional resume.')
  } else if (wc < 100) {
    score += 5
    weaknesses.push('Content is too brief — expand on your achievements and responsibilities.')
  } else {
    score += 10
    weaknesses.push('Resume may be too long — aim for impact over volume.')
  }

  // 2. Section Analysis
  let sectionsFound = 0
  for (const [key, pattern] of Object.entries(SECTION_PATTERNS)) {
    if (pattern.test(t)) {
      sectionsFound++
      sectionScores[key] = 100
      if (key !== 'summary') strengths.push(`Well-defined ${key} section.`)
    } else {
      sectionScores[key] = 0
      if (['experience', 'education', 'skills'].includes(key)) {
        weaknesses.push(`Missing or unclear ${key} section.`)
      }
    }
  }
  score += (sectionsFound / Object.keys(SECTION_PATTERNS).length) * 20

  // 3. Impact & Quantification
  const numberMatches = (t.match(/\d+%|\$\d|[\d,]+\s*(usd|inr|users|requests|ms|seconds|minutes|employees|customers)/gi) || []).length
  if (numberMatches >= 3) {
    score += 15
    strengths.push('Excellent use of data to quantify achievements.')
  } else if (numberMatches > 0) {
    score += 8
    strengths.push('Includes some quantified impact signals.')
    weaknesses.push('Add more metrics (%, revenue, scale) to prove your impact.')
  } else {
    weaknesses.push('Lacks quantified results — use numbers to show what you achieved.')
  }

  // 3b. Readability / repetition (lightweight, deterministic)
  const sentences = t.split(/[.!?\n]+/).map((s) => s.trim()).filter(Boolean)
  const avgLen =
    sentences.length > 0 ? sentences.reduce((a, s) => a + wordCount(s), 0) / sentences.length : 0
  const longFrag = sentences.filter((s) => wordCount(s) > 45).length
  const words = lower.match(/\b[a-z]{5,}\b/g) || []
  const freq = new Map()
  for (const w of words) freq.set(w, (freq.get(w) || 0) + 1)
  const heavyRepeat = [...freq.values()].filter((c) => c > 4).length
  if (longFrag >= 3 || avgLen > 34) {
    score -= 6
    weaknesses.push('Several very long sentences — shorten for recruiter skim-reading.')
  }
  if (heavyRepeat >= 2) {
    score -= 4
    weaknesses.push('Repeated wording detected — diversify verbs and nouns.')
  }
  if (wc > 120 && longFrag === 0 && avgLen >= 10 && avgLen <= 24) {
    score += 4
    strengths.push('Readable sentence lengths for quick scanning.')
  }

  // 4. Action Verbs
  const verbMatches = (t.match(ACTION_VERBS) || []).length
  if (verbMatches > 8) {
    score += 10
    strengths.push('Strong use of action-oriented professional language.')
  } else if (verbMatches > 3) {
    score += 5
    strengths.push('Uses professional action verbs.')
  } else {
    weaknesses.push('Use more powerful action verbs (e.g., "Engineered", "Optimized", "Spearheaded").')
  }

  // 5. Keyword & ATS Optimization
  const roleData = ROLE_KEYWORDS[role] || ROLE_KEYWORDS['Full Stack Developer']
  let primaryHits = 0
  let secondaryHits = 0
  
  roleData.primary.forEach(kw => { if (lower.includes(kw.toLowerCase())) primaryHits++; else missingKeywords.push(kw) })
  roleData.secondary.forEach(kw => { if (lower.includes(kw.toLowerCase())) secondaryHits++ })

  const primaryRatio = primaryHits / roleData.primary.length
  const secondaryRatio = secondaryHits / roleData.secondary.length
  
  score += Math.round(primaryRatio * 15)
  score += Math.round(secondaryRatio * 5)

  if (primaryRatio > 0.7) strengths.push('Strong alignment with core role requirements.')
  if (primaryRatio < 0.4) weaknesses.push('Missing several core technical keywords for this role.')

  const atsScore = Math.round((primaryRatio * 60) + (secondaryRatio * 30) + (sectionsFound / 6 * 10))

  // 6. Contact Info & Links
  if (/github\.com|linkedin\.com|portfolio|http(s)?:\/\//i.test(t)) {
    score += 5
    strengths.push('Professional links (GitHub/LinkedIn) are present.')
  } else {
    weaknesses.push('Add professional social links (LinkedIn, GitHub) for credibility.')
  }

  score = Math.min(100, Math.max(20, score))

  return {
    score: Math.round(score),
    atsScore: Math.min(100, atsScore),
    missingKeywords: missingKeywords.slice(0, 8),
    strengths: [...new Set(strengths)].slice(0, 6),
    weaknesses: [...new Set(weaknesses)].slice(0, 6),
    sectionAnalysis: sectionScores
  }
}

function communicationHeuristic(introText, mockAnswer) {
  const intro = (introText || '').trim()
  const mock = (mockAnswer || '').trim()
  const combined = [intro, mock].filter(Boolean).join('\n\n')
  const text = combined || intro || mock
  const wcIntro = wordCount(intro)
  const wcMock = wordCount(mock)
  const wc = wordCount(text)

  const fillers = (text.match(FILLERS) || []).length
  const fillerRatio = wc > 0 ? fillers / wc : 0

  let score = 52
  const strengths = []
  const weaknesses = []

  if (wc < 25) {
    score -= 25
    weaknesses.push('Combined introduction and mock answer are very thin — add specifics recruiters can verify.')
  } else if (wc < 55) {
    score -= 12
    weaknesses.push('Limited detail across introduction + mock answer — deepen with one concrete example each.')
  } else if (wc > 420) {
    score -= 10
    weaknesses.push('Very long combined narrative — tighten so each answer stays interview-length.')
  } else {
    score += 8
    strengths.push('Enough substance across introduction and mock response for recruiters to evaluate.')
  }

  if (mock.length > 0 && wcMock < 30) {
    score -= 14
    weaknesses.push('Mock interview answer is short — expand with situation, actions, and measurable outcome.')
  }

  if (intro.length > 0 && mock.length > 0 && wcMock > 15 && wcIntro < 20) {
    weaknesses.push('Tell-me-about-yourself is lighter than your mock answer — balance both for pipeline consistency.')
  }

  if (fillerRatio > 0.08) {
    score -= 16
    weaknesses.push('Elevated filler-word density — practice pausing instead of filler.')
  } else if (fillerRatio > 0.04) {
    score -= 7
    weaknesses.push('Some filler words detected — aim for cleaner pacing.')
  } else {
    score += 9
    strengths.push('Low filler-word density relative to combined length.')
  }

  const starLike =
    /\b(situation|task|action|result|challenge)\b/i.test(text) ||
    (/\b(then|finally|as a result)\b/i.test(text) && /\b(improved|reduced|increased|\d+%)\b/i.test(text))
  if (starLike) {
    score += 10
    strengths.push('STAR-style structure or explicit outcome language detected.')
  } else {
    weaknesses.push('Add a stronger outcome beat (what changed, how you measured it).')
  }

  if (/\b(i|my)\b.*\b(built|led|shipped|improved|designed|implemented)\b/i.test(text)) {
    score += 10
    strengths.push('Shows ownership language (I built/led/shipped).')
  } else {
    weaknesses.push('Add a clear ownership line: what you did, with observable outcome.')
  }

  if (/first|then|finally|as a result|outcome|impact|because/i.test(text)) {
    score += 7
    strengths.push('Uses sequencing or causal language that supports clarity.')
  } else {
    weaknesses.push('Structure with a simple arc: context → action → outcome.')
  }

  const sentiment = score >= 74 ? 'positive' : score >= 58 ? 'neutral' : 'needs work'

  score = Math.min(96, Math.max(12, Math.round(score)))

  const wpmEstimate = wc > 0 ? Math.min(190, 85 + Math.round(wc / 2.4)) : 0

  const fatigueDetected =
    ((text.match(/\b(i think|basically|honestly)\b/gi) || []).length > 6 && wc > 100) ||
    fillerRatio > 0.1

  const confidenceRecovery =
    fillerRatio > 0.06
      ? 'Recovery is uneven — fillers cluster in denser explanation segments.'
      : 'Pacing looks steady; confidence should hold through follow-up probes.'

  return {
    score,
    strengths: strengths.slice(0, 5),
    weaknesses: weaknesses.slice(0, 6),
    metrics: {
      wpmEstimate,
      fillerRatio: Math.round(fillerRatio * 1000) / 1000,
      sentiment,
      confidenceRecovery,
      fatigueDetected,
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
  if (!username) return { ok: false, publicRepos: 0, bio: '', stars: 0, languages: [] }
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 6000)
  try {
    // 1. Fetch User Profile
    const userRes = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
      headers: { 'User-Agent': 'InterviewReadinessAPI/1.0' },
      signal: controller.signal,
    })
    if (!userRes.ok) return { ok: false, publicRepos: 0, bio: '', stars: 0, languages: [] }
    const userData = await userRes.json()

    // 2. Fetch Repos for deeper analysis
    const reposRes = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=10`, {
      headers: { 'User-Agent': 'InterviewReadinessAPI/1.0' },
      signal: controller.signal,
    })
    
    let stars = 0
    let languages = new Set()
    if (reposRes.ok) {
      const reposData = await reposRes.json()
      reposData.forEach(repo => {
        stars += repo.stargazers_count || 0
        if (repo.language) languages.add(repo.language)
      })
    }

    return { 
      ok: true, 
      publicRepos: userData.public_repos ?? 0, 
      bio: userData.bio || '',
      stars,
      languages: Array.from(languages),
      followers: userData.followers || 0
    }
  } catch {
    return { ok: false, publicRepos: 0, bio: '', stars: 0, languages: [] }
  } finally {
    clearTimeout(timeout)
  }
}

async function portfolioUrlReachability(url) {
  if (!url || !/^https?:\/\//i.test(url)) return { ok: null }
  const c = new AbortController()
  const t = setTimeout(() => c.abort(), 4500)
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      signal: c.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'InterviewReadinessAPI/1.0' },
    })
    clearTimeout(t)
    return { ok: res.ok, status: res.status }
  } catch {
    clearTimeout(t)
    return { ok: false, status: 0 }
  }
}

async function portfolioHeuristic({ githubUrl, portfolioUrl, linkedinUrl, resumeText, role }) {
  let score = 30
  const strengths = []
  const weaknesses = []
  const signals = { github: null }

  const hasGh = !!githubUrl && githubUrl.includes('github.com')
  const hasPf = !!portfolioUrl && /^https?:\/\//i.test(portfolioUrl)
  const hasLi = !!linkedinUrl && linkedinUrl.includes('linkedin.com')

  // 1. Basic Link Presence
  if (hasGh) {
    score += 15
    strengths.push('GitHub profile link provided.')
    const user = githubUsername(githubUrl)
    if (user) {
      signals.github = await githubSignals(user)
      if (signals.github.ok) {
        // Deep GitHub Analysis
        if (signals.github.publicRepos > 10) {
          score += 10
          strengths.push(`Active GitHub profile with ${signals.github.publicRepos} public repositories.`)
        } else if (signals.github.publicRepos > 0) {
          score += 5
          strengths.push('Verified GitHub account with public work.')
        } else {
          weaknesses.push('GitHub profile is empty — consider pinning your best projects.')
        }

        if (signals.github.stars > 5) {
          score += 10
          strengths.push(`Your work has earned ${signals.github.stars} stars — shows community validation.`)
        }

        if (signals.github.languages.length > 2) {
          strengths.push(`Multi-stack experience detected: ${signals.github.languages.slice(0, 3).join(', ')}.`)
        }
      }
    }
  } else weaknesses.push('Add a GitHub link to validate code and collaboration.')

  if (hasPf) {
    score += 20
    strengths.push('Personal portfolio/showcase site provided.')
    const reach = await portfolioUrlReachability(portfolioUrl)
    if (reach.ok === false) {
      score -= 18
      weaknesses.push('Portfolio URL did not respond successfully — verify the link is live and public.')
    } else if (reach.ok === true) {
      strengths.push('Portfolio host responded — link appears reachable.')
    }
    if (portfolioUrl.includes('vercel.app') || portfolioUrl.includes('github.io') || portfolioUrl.includes('netlify.app')) {
      strengths.push('Using common deployment surfaces (Vercel/Netlify/GitHub Pages) for quick review.')
    }
  } else weaknesses.push('Missing a live portfolio — recruiters prefer seeing deployed work.')

  if (hasLi) {
    score += 10
    strengths.push('LinkedIn profile linked.')
  } else weaknesses.push('Add LinkedIn for professional networking and verification.')

  // 2. Cross-Verification
  if (resumeText && (hasGh || hasPf)) {
    const ghInResume = /github\.com/i.test(resumeText)
    const pfInResume = /portfolio|deployed|live demo/i.test(resumeText)
    if (ghInResume && pfInResume) {
      score += 10
      strengths.push('Strong consistency between resume and portfolio signals.')
    }
  }

  return { 
    score: Math.min(100, Math.max(20, score)), 
    strengths: [...new Set(strengths)], 
    weaknesses: [...new Set(weaknesses)], 
    hasGh, 
    hasPf, 
    hasLi,
    githubData: signals.github
  }
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

function buildRoadmap({ resume, technical, communication, portfolio, role, tech }) {
  const r = (role || '').toLowerCase()
  const L = {
    star: 'https://www.themuse.com/advice/star-interview-method',
    systemdesign: 'https://github.com/donnemartin/system-design-primer',
    sql: 'https://sqlbolt.com/lesson/introducing-sql',
    react: 'https://react.dev/learn',
    pytorch: 'https://pytorch.org/tutorials/',
    wcag: 'https://www.w3.org/WAI/WCAG21/quickref/',
    pandas: 'https://pandas.pydata.org/docs/getting_started/index.html',
    figma: 'https://help.figma.com/hc/en-us/categories/360002051613-Get-started',
  }

  const w1 =
    r.includes('ui') || r.includes('ux') || r.includes('designer')
      ? 'Portfolio & craft foundations'
      : r.includes('data analyst') || r.includes('analyst')
        ? 'Data storytelling & SQL foundations'
        : r.includes('ai') || r.includes('ml')
          ? 'ML fundamentals & evaluation rigor'
          : r.includes('backend')
            ? 'Reliability, APIs & data stores'
            : 'Packaging & proof foundations'

  const w2 =
    r.includes('ui') || r.includes('ux')
      ? 'Interaction, accessibility & critique'
      : r.includes('data analyst')
        ? 'Metrics, experiments & stakeholder comms'
        : r.includes('ai')
          ? 'Model lifecycle, RAG & safety'
          : 'Depth on architecture & trade-offs'

  const roadmap = [
    { week: 1, title: w1, items: [] },
    { week: 2, title: w2, items: [] },
    { week: 3, title: 'Interview performance & narrative', items: [] },
  ]

  const push = (idx, text, link) => {
    roadmap[idx].items.push(link ? { text, link } : { text })
  }

  const miss = (resume.missingKeywords || []).slice(0, 5)
  if (resume.score < 72) {
    push(0, 'Rewrite 3 impact bullets using metrics + scope + outcome (numbers first).')
    if (miss.length) {
      push(0, `Weave these missing role keywords into real project bullets: ${miss.join(', ')}.`)
    } else {
      push(0, 'Tighten section headers so ATS parsers map cleanly to Experience / Skills / Education.')
    }
  } else {
    push(0, 'Polish above-the-fold summary: one line on domain, one on scale, one on next target.')
  }

  if (portfolio.score < 72) {
    push(0, 'Pin 2–3 repos with README: problem → approach → results → how to run locally.', L.systemdesign)
    if (r.includes('designer') || r.includes('ux')) {
      push(0, 'Add a case study with constraints, sketches, and accessibility notes.', L.figma)
    }
  } else {
    push(0, 'Add a “decision log” snippet for one flagship project (trade-offs you rejected).')
  }

  if (technical.score < 78 && tech?.total > 0) {
    const missed = (tech.breakdown || []).filter((line) => line.startsWith('✗')).slice(0, 2)
    push(1, `Re-drill the missed quiz themes: ${missed.join(' | ') || 'review fundamentals from your breakdown.'}`)
    if (r.includes('analyst')) push(1, 'Refresh SQL joins + window patterns with deliberate reps.', L.sql)
    else if (r.includes('ai')) push(1, 'Walk one end-to-end training + eval notebook slowly, logging failure modes.', L.pytorch)
    else if (r.includes('designer')) push(1, 'Run a WCAG-focused pass on one shipped flow with concrete fixes.', L.wcag)
    else if (r.includes('backend')) push(1, 'Sketch data + API contracts for a latency-sensitive endpoint you own.')
    else push(1, 'Ship a small full-stack slice with tests + CI to prove integration skill.', L.react)
  } else {
    push(1, 'Pick one ambitious stretch (perf, reliability, or cost) and document before/after evidence.')
  }

  if (r.includes('analyst')) push(1, 'Publish one notebook or dashboard narrative that explains a metric shift.', L.pandas)

  if (communication.score < 74) {
    push(2, 'Record STAR answers (90s cap) and cut filler words on second pass.', L.star)
    push(2, 'Do one timed mock on “failure / conflict / ambiguity” with a peer scorecard.')
  } else {
    push(2, 'Add a system-design style mock for your strongest project (diagram + bottlenecks).', L.systemdesign)
  }

  for (const w of roadmap) {
    if (!w.items.length) {
      push(w.week - 1, `Role-specific maintenance week for ${role}: keep shipping evidence weekly.`)
    }
  }

  return roadmap
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

function normalizeRoadmap(weeks) {
  if (!Array.isArray(weeks)) return []
  return weeks.map((w) => ({
    week: w.week,
    title: w.title || `Week ${w.week}`,
    items: (w.items || []).map((it) =>
      typeof it === 'string' ? { text: it } : { text: it?.text || String(it), link: it?.link },
    ),
  }))
}

function buildScoreContributors({ resumeScore, technicalScore, commScore, portfolioScore }) {
  const impact = (s) => (s >= 78 ? 'positive' : s >= 60 ? 'neutral' : 'negative')
  return [
    { label: 'Resume & positioning', score: resumeScore, impact: impact(resumeScore) },
    { label: 'Technical screen', score: technicalScore, impact: impact(technicalScore) },
    { label: 'Communication & narrative', score: commScore, impact: impact(commScore) },
    { label: 'Portfolio & public proof', score: portfolioScore, impact: impact(portfolioScore) },
  ]
}

function buildExplainableReasoning(weights, dims, level) {
  return `Overall label "${level}" is a weighted blend for this role: resume ${Math.round(weights.resume * 100)}%, technical ${Math.round(weights.technical * 100)}%, communication ${Math.round(weights.communication * 100)}%, portfolio ${Math.round(weights.portfolio * 100)}%. Observed dimensional scores: resume ${dims.resume}, technical ${dims.technical}, communication ${dims.communication}, portfolio ${dims.portfolio}. Each bucket is computed from your uploaded text, links, quiz answers, and mock response — not from static templates.`
}

function computeAuthenticityScore(resumeScore, techRatio, commScore, portfolioScore, githubOk) {
  const techAlign = techRatio >= 0.85 ? 10 : techRatio >= 0.55 ? 4 : -8
  const linkCred = githubOk ? 6 : -5
  const base = Math.round((resumeScore + commScore + portfolioScore) / 3) + techAlign + linkCred
  return Math.min(100, Math.max(14, base))
}

function computePressureHandling(commScore, mockWc, fillerRatio) {
  let s = Math.round(commScore * 0.62 + (mockWc > 90 ? 20 : mockWc > 45 ? 26 : 12))
  s -= Math.round(fillerRatio * 110)
  return Math.min(96, Math.max(18, s))
}

function computeLikelihoodScreening(overall, shortlist) {
  if (shortlist === 'yes') return Math.min(94, Math.max(55, overall + 5))
  if (shortlist === 'maybe') return Math.min(84, Math.max(32, overall - 1))
  return Math.min(74, Math.max(15, overall - 12))
}

function computeHiringProbabilities(overall, technical, portfolio, role) {
  const r = (role || '').toLowerCase()
  let startup = Math.round(overall * 0.9 + technical * 0.06)
  let mid = Math.round(overall * 0.86 - 2)
  let faang = Math.round(overall * 0.68 - portfolio * 0.04 + technical * 0.05)
  if (r.includes('ai') || r.includes('ml')) faang -= 5
  if (r.includes('full stack') || r.includes('startup')) startup += 4
  if (r.includes('designer')) {
    mid += Math.round(portfolio * 0.08)
    faang += Math.round(portfolio * 0.05)
  }
  return {
    startup: Math.min(96, Math.max(10, startup)),
    midSize: Math.min(92, Math.max(8, mid)),
    faang: Math.min(88, Math.max(6, faang)),
  }
}

function buildBenchmarking(overall, dims, role, name) {
  const seed = hashToUnit(`${name}|${role}|${dims.resume}|${dims.technical}|${dims.communication}`)
  const blended = overall * 0.78 + seed * 14
  const percentile = Math.min(97, Math.max(4, Math.round(blended)))
  const order = ['resume', 'technical', 'communication', 'portfolio']
  const strongest = order.slice().sort((a, b) => dims[b] - dims[a])[0]
  const weakest = order.slice().sort((a, b) => dims[a] - dims[b])[0]
  return {
    percentile,
    vsOthers: `Estimated standing for ${role} intake with similar forms: ~${percentile}th percentile (seeded variance from your text fingerprint, anchored to your dimensional scores).`,
    skillHeatmap: [
      { skill: 'Resume signal', score: dims.resume },
      { skill: 'Technical depth', score: dims.technical },
      { skill: 'Communication', score: dims.communication },
      { skill: 'Portfolio proof', score: dims.portfolio },
    ],
    realRecruiterComparison: `Strongest axis: ${strongest} (${dims[strongest]}). Weakest: ${weakest} (${dims[weakest]}).`,
  }
}

function buildCareerRecommendations(role, resumeLower, scores) {
  const pool = {
    'Full Stack Developer': ['Backend Engineer', 'Frontend Engineer', 'Platform Engineer'],
    'Backend Engineer': ['Full Stack Developer', 'Site Reliability Engineer', 'Infrastructure Engineer'],
    'Data Analyst': ['Data Scientist', 'Analytics Engineer', 'BI Developer'],
    'AI Engineer': ['ML Engineer', 'Applied Scientist', 'Data Engineer'],
    'UI/UX Designer': ['Product Designer', 'UX Researcher', 'Design Systems Designer'],
  }
  const primary = pool[role] || pool['Full Stack Developer']
  const mainMatch = Math.min(97, Math.max(38, Math.round((scores.technical + scores.portfolio + scores.resume) / 3)))
  const rows = [
    { role, match: Math.min(99, Math.round(mainMatch + 4)) },
    ...primary.map((rr, i) => {
      const rk = ROLE_KEYWORDS[role] || ROLE_KEYWORDS['Full Stack Developer']
      const alt = ROLE_KEYWORDS[rr]
      let overlap = 0
      if (alt && resumeLower) {
        const altK = [...(alt.primary || []), ...(alt.secondary || [])].map((x) => String(x).toLowerCase())
        for (const k of [...(rk.primary || []), ...(rk.secondary || [])].slice(0, 14)) {
          if (resumeLower.includes(String(k).toLowerCase()) && altK.some((x) => resumeLower.includes(x))) overlap++
        }
      }
      const match = Math.min(91, Math.max(30, Math.round(mainMatch - 10 - i * 9 + overlap * 4)))
      return { role: rr, match }
    }),
  ]
  return rows.slice(0, 4)
}

function buildBehavioralHeuristic(intro, mock, commScore) {
  const t = `${intro}\n${mock}`.toLowerCase()
  const traits = []
  if (/\b(disagree|conflict|push\s*back|negotiat)\b/i.test(t)) {
    traits.push({
      trait: 'Stakeholder friction navigation',
      score: Math.min(95, commScore + 6),
      feedback: 'You referenced disagreement or negotiation — strong signal for senior collaboration prompts.',
    })
  }
  if (/\b(mistake|failed|postmortem|learned)\b/i.test(t)) {
    traits.push({
      trait: 'Learning orientation',
      score: Math.min(95, commScore + 4),
      feedback: 'Mistake/learning language maps well to growth and postmortem behavioral questions.',
    })
  }
  if (/\b(team|we|collaborat)\b/i.test(t) && /\b(i|my)\b/i.test(t)) {
    traits.push({
      trait: 'Balanced ownership',
      score: Math.round((commScore + 70) / 2),
      feedback: 'Mix of “I” and “we” — tune emphasis per company (startup vs enterprise) expectations.',
    })
  }
  if (!traits.length) {
    traits.push({
      trait: 'Narrative control',
      score: commScore,
      feedback: 'Add one conflict beat and one quantified outcome to deepen behavioral answers.',
    })
  }
  return traits.slice(0, 4)
}

function inferPersona(technical, communication, portfolio) {
  if (technical >= communication + 12 && technical >= portfolio) {
    return { name: 'Depth-first builder', icon: '⚙️', description: 'Signals skew toward execution depth over packaging polish.' }
  }
  if (portfolio >= technical && portfolio >= communication) {
    return { name: 'Show-don’t-tell maker', icon: '🎨', description: 'Public artifacts and links carry above-average weight in your profile.' }
  }
  if (communication >= technical && communication >= portfolio) {
    return { name: 'Narrative-led operator', icon: '💬', description: 'Storytelling clarity leads other levers — add more verifiable proof to match.' }
  }
  return { name: 'Balanced generalist', icon: '🧭', description: 'Dimensions are relatively even — small lifts across proof and depth move outcomes quickly.' }
}

function buildAttentionHeatmap(sectionScores, resumeScore) {
  const entries = Object.entries(sectionScores || {})
  const ranked = entries.sort((a, b) => b[1] - a[1])
  const out = []
  for (const [section, sc] of ranked.slice(0, 6)) {
    const focus = sc >= 80 ? 'high' : sc >= 40 ? 'medium' : 'low'
    const reason =
      sc === 0
        ? 'Section signal missing — humans and parsers spend extra time hunting here.'
        : focus === 'high'
          ? 'Dense relevant signal — likely anchor for recruiter skim.'
          : 'Present but improvable — tighten outcomes and keywords.'
    out.push({ section: section.charAt(0).toUpperCase() + section.slice(1), focus, reason })
  }
  if (!out.length) {
    return [
      { section: 'Experience', focus: resumeScore >= 70 ? 'high' : 'medium', reason: 'Default scan priority for tenure and outcomes.' },
      { section: 'Skills', focus: 'medium', reason: 'Keyword alignment for ATS routing.' },
    ]
  }
  return out
}

function segmentAnswer(text) {
  const parts = text.split(/(?<=[.!?])\s+/).filter(Boolean)
  if (parts.length >= 5) {
    const n = parts.length
    return [0, 1, 2, 3, 4].map((k) => parts[Math.floor((k * n) / 5)] || '')
  }
  const len = text.length
  if (len < 5) return [text, text, text, text, text]
  return [0, 1, 2, 3, 4].map((k) => text.slice(Math.floor((k * len) / 5), Math.floor(((k + 1) * len) / 5)))
}

function buildPerformanceTimeline(comm, mockText, introText) {
  const chunks = segmentAnswer((mockText || '').trim() || (introText || '').trim())
  const base = comm.score
  return ['Start', '25%', '50%', '75%', 'End'].map((label, i) => {
    const chunk = chunks[i] || ''
    const wc = wordCount(chunk)
    const fillers = (chunk.match(FILLERS) || []).length
    const r = wc > 0 ? fillers / wc : 0
    const stress = Math.min(100, Math.round(20 + r * 260 + (wc < 10 && i > 1 ? 22 : 0)))
    const confidence = Math.max(8, Math.min(100, Math.round(base - r * 130 + (i === 0 ? 5 : i === 4 ? 6 : -i * 2))))
    return {
      time: label,
      confidence,
      fillerWords: Math.min(100, Math.round(r * 620)),
      stress,
    }
  })
}

function buildReplayAnalysis(mockText, fillerRatio) {
  const lines = []
  const sents = (mockText || '').split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 8)
  let t = 0
  sents.slice(0, 6).forEach((s, i) => {
    t += 18 + i * 7
    const fillers = (s.match(FILLERS) || []).length
    if (fillers >= 2) lines.push({ time: `~${t}s`, event: `Filler cluster: "${s.trim().slice(0, 48)}…"`, type: 'filler' })
    else if (/\d+%|\$\d|[\d,]+\s*(users|ms|requests)/i.test(s)) {
      lines.push({ time: `~${t}s`, event: 'Quantified outcome beat', type: 'strength' })
    } else if (s.length > 220) {
      lines.push({ time: `~${t}s`, event: 'Long sentence — split for clarity under pressure', type: 'mistake' })
    }
  })
  if (!lines.length) {
    return [
      {
        time: '~0:20',
        event: fillerRatio > 0.07 ? 'Early filler density in mock answer' : 'Opening clarity is acceptable',
        type: fillerRatio > 0.07 ? 'filler' : 'strength',
      },
      {
        time: '~1:00',
        event: (mockText || '').length < 45 ? 'Answer ends before strong evidence' : 'Mid-section pacing',
        type: (mockText || '').length < 45 ? 'mistake' : 'strength',
      },
    ]
  }
  return lines.slice(0, 8)
}

function buildTopConcerns(dims, resume, tech, pf) {
  const c = []
  if (dims.resume < 62) c.push(`Resume completeness / ATS fit (${dims.resume}) lags typical pass bands.`)
  if (dims.technical < 62) c.push(`Technical screen (${dims.technical}) is a filter risk in competitive funnels.`)
  if (dims.communication < 62) c.push(`Narrative clarity (${dims.communication}) may cap phone-screen outcomes.`)
  if (dims.portfolio < 58) c.push(`Public proof (${dims.portfolio}) is thinner than top-quartile peers.`)
  if ((resume.missingKeywords || []).length >= 4) {
    c.push(`Keyword gaps vs role: ${resume.missingKeywords.slice(0, 4).join(', ')}.`)
  }
  if (tech.total > 0 && tech.correct < tech.total - 2) {
    c.push('Multiple technical quiz misses — fundamentals need targeted reinforcement.')
  }
  if (pf.githubData && pf.githubData.ok && pf.githubData.publicRepos < 3) {
    c.push('GitHub shows limited public surface area for reviewers to validate depth.')
  }
  if (!c.length) c.push('No single-axis disaster — compound marginal gains across dimensions.')
  return c.slice(0, 5)
}

function buildWhyYouMightFail(dims, shortlist) {
  const out = []
  if (dims.communication < dims.technical - 10) {
    out.push('Interview narrative may undersell technical depth you demonstrate elsewhere.')
  }
  if (dims.portfolio < 55) {
    out.push('Reviewers may infer limited production complexity from shallow or missing artifacts.')
  }
  if (dims.technical < 60) {
    out.push('Automated or rubric technical screens could filter you before human calibration.')
  }
  if (shortlist === 'no') {
    out.push('Composite readiness sits below common screening thresholds without stronger proof.')
  }
  if (!out.length) {
    out.push('Risk is stacked small gaps rather than one dominant blocker — still shore up proof and story.')
  }
  return out.slice(0, 4)
}

function recruiterVerdictBand(shortlist, overall, dims) {
  if (shortlist === 'yes' && overall >= 86) return 'Strong hire signal'
  if (shortlist === 'yes') return 'Advance to panel'
  if (shortlist === 'maybe' && dims.technical >= 78 && dims.portfolio < 60) return 'High technical potential / packaging gap'
  if (shortlist === 'maybe' && dims.communication < 62) return 'Communication risk — verify live'
  if (shortlist === 'maybe') return 'Potential candidate'
  if (dims.technical >= 72 && overall < 64) return 'Depth present; packaging and narrative need work'
  return 'Needs improvement before screen'
}

function hiddenSkillsFromResume(resumeText, githubLanguages, role) {
  const lower = (resumeText || '').toLowerCase()
  const rk = ROLE_KEYWORDS[role] || ROLE_KEYWORDS['Full Stack Developer']
  const known = new Set([...(rk.primary || []), ...(rk.secondary || [])].map((k) => String(k).toLowerCase()))
  const extras = new Set()
  const candidates =
    lower.match(
      /\b(?:kubernetes|kafka|graphql|terraform|redis|snowflake|dbt|numpy|opencv|webpack|tailwind|cypress|jest|grpc|nginx|elasticsearch)\b/g,
    ) || []
  for (const x of candidates) {
    const xl = x.toLowerCase()
    if (!known.has(xl)) extras.add(x.charAt(0).toUpperCase() + x.slice(1))
  }
  for (const lang of githubLanguages || []) {
    if (!known.has(String(lang).toLowerCase())) extras.add(lang)
  }
  return [...extras].slice(0, 8)
}

function buildTimeline(readiness, weights) {
  const w = Math.max(3, Math.min(14, Math.round(13 - readiness / 9 + weights.technical * 2)))
  return {
    readinessWeeks: w,
    breakdown: [
      { area: 'Role-aligned technical depth', time: `${Math.max(1, Math.round(w * 0.45))} weeks` },
      { area: 'Narrative + mock interview polish', time: `${Math.max(1, Math.round(w * 0.35))} weeks` },
      { area: 'Artifact & link credibility', time: `${Math.max(1, Math.round(w * 0.32))} weeks` },
    ],
  }
}

function screeningComposite(overall, commScore, tech) {
  let x = overall
  if (commScore < 48) x -= 8
  else if (commScore < 58) x -= 3
  if (tech.total > 0) {
    const ratio = tech.correct / tech.total
    if (ratio < 0.35) x -= 10
    else if (ratio < 0.55) x -= 4
  } else {
    x -= 6
  }
  return Math.max(0, Math.min(100, Math.round(x)))
}

function dynamicRecruiterReasoning(short, dims, tech, resume, role) {
  const parts = []
  parts.push(
    `Role: ${role}. Weighted read on dimensions — resume ${dims.resume}, technical ${dims.technical}, communication ${dims.communication}, portfolio ${dims.portfolio}.`,
  )
  if (tech.total > 0) {
    parts.push(`Technical quiz evidence: ${tech.correct}/${tech.total} aligned items.`)
  } else {
    parts.push('Technical quiz not completed — screening confidence is reduced.')
  }
  if (resume.missingKeywords?.length) {
    parts.push(`ATS keyword gaps still open: ${resume.missingKeywords.slice(0, 5).join(', ')}.`)
  }
  if (short === 'yes') {
    parts.push('Composite posture supports advancing to structured interviews with standard calibration.')
  } else if (short === 'maybe') {
    parts.push('Mixed evidence: one or more dimensions need proof or polish before a confident shortlist.')
  } else {
    parts.push('Material readiness gaps — strengthen proof points and narrative before high-stakes screens.')
  }
  return parts.join(' ')
}

function evidenceFromResumeTokens(resumeText, role) {
  const lower = (resumeText || '').toLowerCase()
  const hits = []
  const checks = [
    [/docker|kubernetes|k8s/i, 'Container / orchestration signals in resume text'],
    [/postgres|mysql|mongodb|redis|sql/i, 'Data store exposure in resume text'],
    [/ci\s*\/\s*cd|github actions|jenkins/i, 'Delivery automation language present'],
    [/oauth|jwt|sso|auth0/i, 'Identity / auth domain language present'],
    [/graphql|rest|grpc/i, 'Interface style vocabulary present'],
  ]
  for (const [re, label] of checks) {
    if (re.test(lower)) hits.push(label)
  }
  if (!hits.length) {
    hits.push('Limited explicit infra/auth vocabulary — consider adding concrete stack terms tied to outcomes.')
  }
  return hits.slice(0, 4)
}

function buildRiskFactors(dims, tech) {
  const out = []
  if (dims.communication < 56) out.push({ factor: 'Narrative clarity under time pressure', severity: 'high' })
  if (dims.technical < 58 && tech.total > 0) out.push({ factor: 'Technical screen variance', severity: 'high' })
  if (dims.portfolio < 52) out.push({ factor: 'Thin public artifact trail', severity: 'medium' })
  if (dims.resume < 58) out.push({ factor: 'Resume-to-role keyword drift', severity: 'medium' })
  if (!out.length) out.push({ factor: 'No dominant red flag — execution risk is cumulative', severity: 'low' })
  return out.slice(0, 4)
}

function salaryHeuristic(overall, skillLevel) {
  const mult = skillLevel === 'Senior' ? 1.22 : skillLevel === 'Junior' ? 0.88 : 1
  const lo = Math.max(4, Math.round((5 + overall / 16) * mult))
  const hi = Math.min(45, lo + Math.max(2, Math.round(overall / 22)))
  return { range: `${lo}-${hi}`, currency: 'LPA' }
}

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
 * @param {string} input.mockInterviewAnswer
 * @param {Record<string, number>} input.techAnswers
 */
export async function evaluateCandidate(input) {
  const started = Date.now()
  const role = input.role || 'Full Stack Developer'

  const resume = resumeHeuristic(input.resumeText || '', role)
  const tech = scoreTechnical(role, input.techAnswers || {})
  const comm = communicationHeuristic(input.introText || '', input.mockInterviewAnswer || '')

  const pf = await portfolioHeuristic({
    githubUrl: input.githubUrl,
    portfolioUrl: input.portfolioUrl,
    linkedinUrl: input.linkedinUrl,
    resumeText: input.resumeText || '',
    role,
  })

  const portfolioScore = pf.score
  const portfolioStrengths = pf.strengths
  const portfolioWeaknesses = pf.weaknesses

  const skillBoost = input.skillLevel === 'Senior' ? 4 : input.skillLevel === 'Junior' ? -2 : 0
  const technicalScore =
    tech.total === 0 ? 0 : Math.min(100, Math.max(0, Math.round(tech.score + skillBoost)))

  const weights = getRoleWeights(role)
  const overallScore = Math.round(
    resume.score * weights.resume +
      technicalScore * weights.technical +
      comm.score * weights.communication +
      portfolioScore * weights.portfolio,
  )

  const level = overallLevel(overallScore)
  const screening = screeningComposite(overallScore, comm.score, tech)
  const short = shortlist(screening)

  const dims = {
    resume: resume.score,
    technical: technicalScore,
    communication: comm.score,
    portfolio: portfolioScore,
  }

  const recruiterReasoning = dynamicRecruiterReasoning(short, dims, tech, resume, role)
  const verdictBand = recruiterVerdictBand(short, overallScore, dims)

  const insight = `Score synthesis for ${input.name || 'Candidate'}: technical ${tech.correct}/${tech.total} → ${technicalScore}, resume ${resume.score} (ATS ${resume.atsScore}), communication ${comm.score} (filler ${(comm.metrics.fillerRatio * 100).toFixed(1)}%), portfolio ${portfolioScore}. Weighted overall ${overallScore} (${level}). Screening composite ${screening} → ${short}.`

  const roadmap = buildRoadmap({
    resume,
    technical: { score: technicalScore },
    communication: comm,
    portfolio: { score: portfolioScore },
    role,
    tech,
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
        temperature: 0.45,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              `You are a senior technical recruiter and career coach. Return ONLY valid JSON.
              OMIT these fields entirely (the server computes them deterministically): explainableAI.scoreContributors, performanceTimeline, likelihoodOfPassing, topConcerns, whyYouMightFail, pressureHandlingScore, hiringProbability, benchmarking, career.recommendedRoles, authenticityScore, attentionHeatmap, roadmap, replayAnalysis, persona, behavioralAnalysis, hiddenSkills, timeline, riskFactors, salaryPrediction.
              Focus on narrative quality: recruiterInsight, recruiterReasoning (2–4 sentences citing specific evidence from the payload), personalizedMockQuestion, explainableAI.reasoning (text only — no fabricated numbers), evidencePanels (titles + bullet evidence tied to provided scores), resumeRewrites (0–2 pairs from resumeSnippet), strengths/weaknesses for resume prose (max 3 each), career.fitReasoning, nextStepsForGrowth (4–6 concrete actions).
              Ground every claim in the provided scores, techResults.breakdown, intro, mockInterviewAnswer, links, and githubData. Ban generic platitudes. Ban invented metrics or percentages not present in the payload.`,
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
              mockInterviewAnswer: (input.mockInterviewAnswer || '').slice(0, 1500),
              techResults: {
                correct: tech.correct,
                total: tech.total,
                breakdown: tech.breakdown
              },
              links: {
                github: input.githubUrl,
                portfolio: input.portfolioUrl,
                linkedin: input.linkedinUrl,
              },
              githubData: pf.githubData,
              weights,
              screeningComposite: screening,
              verdictBand,
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
    } catch (err) {
      console.error('AI Analysis failed:', err)
      usedOpenAI = false
    }
  }

  const resumeLower = (input.resumeText || '').toLowerCase()
  const ghLang = pf.githubData?.languages || []
  const techRatio = tech.total > 0 ? tech.correct / tech.total : 0
  const mockWc = wordCount(input.mockInterviewAnswer || '')

  const scoreContributors = buildScoreContributors({
    resumeScore: resume.score,
    technicalScore,
    commScore: comm.score,
    portfolioScore,
  })
  const explainReasonBase = buildExplainableReasoning(weights, dims, level)
  const aiReason = (aiNarrative?.explainableAI?.reasoning || '').trim()
  const explainReasoning = [aiReason, explainReasonBase].filter(Boolean).join(' ')

  const authenticityScore = computeAuthenticityScore(
    resume.score,
    techRatio,
    comm.score,
    portfolioScore,
    Boolean(pf.githubData?.ok),
  )
  const pressureHandlingScore = computePressureHandling(comm.score, mockWc, comm.metrics.fillerRatio)
  const likelihoodOfPassing = computeLikelihoodScreening(overallScore, short)
  const hiringProbability = computeHiringProbabilities(overallScore, technicalScore, portfolioScore, role)
  const benchmarking = buildBenchmarking(overallScore, dims, role, input.name || '')
  const recommendedRoles = buildCareerRecommendations(role, resumeLower, {
    technical: technicalScore,
    portfolio: portfolioScore,
    resume: resume.score,
  })
  const behavioralAnalysis =
    Array.isArray(aiNarrative?.behavioralAnalysis) && aiNarrative.behavioralAnalysis.length >= 2
      ? aiNarrative.behavioralAnalysis.slice(0, 4)
      : buildBehavioralHeuristic(input.introText || '', input.mockInterviewAnswer || '', comm.score)
  const persona =
    aiNarrative?.persona?.name && aiNarrative?.persona?.description
      ? aiNarrative.persona
      : inferPersona(technicalScore, comm.score, portfolioScore)
  const hiddenSkills =
    Array.isArray(aiNarrative?.hiddenSkills) && aiNarrative.hiddenSkills.length > 0
      ? aiNarrative.hiddenSkills.slice(0, 8)
      : hiddenSkillsFromResume(input.resumeText || '', ghLang, role)
  const attentionHeatmap = buildAttentionHeatmap(resume.sectionAnalysis || {}, resume.score)
  const performanceTimeline = buildPerformanceTimeline(comm, input.mockInterviewAnswer || '', input.introText || '')
  const replayAnalysis = buildReplayAnalysis(input.mockInterviewAnswer || '', comm.metrics.fillerRatio)
  const topConcerns = buildTopConcerns(dims, resume, tech, pf)
  const whyYouMightFail = buildWhyYouMightFail(dims, short)
  const timeline = buildTimeline(overallScore, weights)
  const riskFactors = buildRiskFactors(dims, tech)
  const salaryPrediction = salaryHeuristic(overallScore, input.skillLevel || 'Mid')

  const tokenEvidence = evidenceFromResumeTokens(input.resumeText || '', role)
  const breakdownLines = (tech.breakdown || []).slice(0, 2).map((b) => `Quiz trace: ${b}`)
  const roleSpecificEvidence = [...tokenEvidence, ...breakdownLines].slice(0, 5)

  const defaultEvidencePanels = [
    {
      title: 'Communication signals',
      type: 'communication',
      evidence: [
        `Filler ratio ${(comm.metrics.fillerRatio * 100).toFixed(1)}% across intro + mock answer`,
        `Estimated pacing ${comm.metrics.wpmEstimate} WPM (heuristic from length)`,
        comm.metrics.confidenceRecovery,
      ],
    },
    {
      title: `${role} technical evidence`,
      type: 'technical',
      evidence: roleSpecificEvidence,
    },
    {
      title: 'Resume & ATS evidence',
      type: 'resume',
      evidence: [
        `ATS-style keyword coverage score ${resume.atsScore}`,
        resume.missingKeywords.length
          ? `Gaps vs role lexicon: ${resume.missingKeywords.slice(0, 5).join(', ')}`
          : 'Core keyword coverage looks adequate for routing parsers.',
        pf.githubData?.ok ? 'GitHub account reachable with public metadata.' : 'No verified GitHub metadata.',
      ],
    },
  ]

  const evidencePanels =
    Array.isArray(aiNarrative?.evidencePanels) && aiNarrative.evidencePanels.length >= 2
      ? aiNarrative.evidencePanels
      : defaultEvidencePanels

  const techStrengths =
    tech.total === 0
      ? ['Technical quiz not submitted — add answers to unlock a calibrated technical signal.']
      : [
          tech.correct >= tech.total - 1
            ? 'Strong accuracy on the rapid technical screen.'
            : 'Partial mastery — revisit missed topics in the breakdown.',
        ]
  const techWeaknesses =
    tech.total === 0
      ? ['Complete all role questions so recruiters see a defensible technical signal.']
      : tech.correct < tech.total
        ? [`Missed ${tech.total - tech.correct} question(s) — drill the ✗ rows in your breakdown.`]
        : []

  const response = {
    overall: {
      score: overallScore,
      level,
      insight: aiNarrative?.recruiterInsight || insight,
    },
    personalizedMockQuestion: aiNarrative?.personalizedMockQuestion || null,
    nextStepsForGrowth: Array.isArray(aiNarrative?.nextStepsForGrowth) ? aiNarrative.nextStepsForGrowth : [],
    weights,
    explainableAI: {
      scoreContributors,
      reasoning: explainReasoning,
    },
    evidencePanels,
    performanceTimeline,
    resume: {
      score: resume.score,
      atsScore: resume.atsScore,
      missingKeywords: resume.missingKeywords || [],
      strengths: Array.isArray(aiNarrative?.strengths) ? aiNarrative.strengths.slice(0, 3) : resume.strengths.slice(0, 3),
      weaknesses: Array.isArray(aiNarrative?.weaknesses) ? aiNarrative.weaknesses.slice(0, 3) : resume.weaknesses.slice(0, 3),
      sectionAnalysis: resume.sectionAnalysis || {},
      rewrites: Array.isArray(aiNarrative?.resumeRewrites) ? aiNarrative.resumeRewrites.slice(0, 4) : [],
      attentionHeatmap,
    },
    technical: {
      score: technicalScore,
      correct: tech.correct,
      total: tech.total,
      strengths: techStrengths,
      weaknesses: techWeaknesses,
      breakdown: tech.breakdown || [],
      authenticityScore,
    },
    communication: {
      score: comm.score,
      strengths: comm.strengths || [],
      weaknesses: comm.weaknesses || [],
      metrics: {
        ...comm.metrics,
        confidenceRecovery: aiNarrative?.confidenceRecovery || comm.metrics.confidenceRecovery,
        fatigueDetected: Boolean(comm.metrics.fatigueDetected || aiNarrative?.fatigueDetected),
      },
      behavioralAnalysis,
      persona,
    },
    portfolio: {
      score: portfolioScore,
      strengths: portfolioStrengths || [],
      weaknesses: portfolioWeaknesses || [],
      hiddenSkills,
      github: pf.githubData,
    },
    recruiter: {
      shortlist: short,
      verdictBand,
      reasoning: aiNarrative?.recruiterReasoning || recruiterReasoning,
      likelihoodOfPassing,
      topConcerns,
      whyYouMightFail,
      pressureHandlingScore,
    },
    hiringProbability,
    radar: {
      resume: resume.score,
      technical: technicalScore,
      communication: comm.score,
      portfolio: portfolioScore,
      fullMark: 100,
    },
    roadmap: normalizeRoadmap(roadmap),
    mockInterview: {
      ...mockInterview,
      replayAnalysis,
    },
    benchmarking,
    career: {
      recommendedRoles,
      fitReasoning:
        aiNarrative?.career?.fitReasoning ||
        `Fit spreads across adjacent roles based on keyword overlap with your resume vs target ${role} lexicon and your dimensional scores.`,
      salaryPrediction,
      riskFactors,
    },
    timeline,
    meta: {
      usedOpenAI,
      processingMs: Date.now() - started,
    },
    role,
  }

  // FORCE DETERMINISTIC OVERRIDE: 
  // We ensure the AI cannot override the core factual metrics derived from your actual input.
  response.overall.score = overallScore;
  response.resume.score = resume.score;
  response.resume.atsScore = resume.atsScore;
  response.technical.score = technicalScore;
  response.technical.correct = tech.correct;
  response.technical.total = tech.total;
  response.communication.score = comm.score;
  response.portfolio.score = portfolioScore;
  response.radar = {
    resume: resume.score,
    technical: technicalScore,
    communication: comm.score,
    portfolio: portfolioScore,
    fullMark: 100,
  };

  return response
}
