/** @typedef {{ id: string; question: string; options: string[]; correctIndex: number }} TechQ */

const COMMON = [
  {
    id: 'http-rest',
    question: 'Which HTTP method is idempotent and commonly used to fetch a resource?',
    options: ['POST', 'GET', 'PATCH', 'CONNECT'],
    correctIndex: 1,
  },
  {
    id: 'big-o',
    question: 'Binary search on a sorted array of n elements runs in:',
    options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'],
    correctIndex: 1,
  },
]

/** @type {Record<string, TechQ[]>} */
export const QUESTIONS_BY_ROLE = {
  'Full Stack Developer': [
    ...COMMON,
    {
      id: 'fs-auth',
      question: 'Which pair best describes a common secure session approach for SPAs?',
      options: [
        'Long-lived JWT in localStorage only',
        'HttpOnly cookies + short-lived access tokens + refresh rotation',
        'Password in query string for caching',
        'Symmetric keys shared in frontend bundle',
      ],
      correctIndex: 1,
    },
    {
      id: 'fs-db',
      question: 'A normalized schema primarily helps with:',
      options: [
        'Faster writes at all costs',
        'Reducing redundancy and update anomalies',
        'Storing images inline in rows',
        'Eliminating indexes',
      ],
      correctIndex: 1,
    },
    {
      id: 'fs-api',
      question: 'REST constraints include statelessness. What does that imply?',
      options: [
        'Server stores UI state in memory per tab',
        'Each request contains enough context; server does not rely on prior session memory',
        'Clients cannot cache responses',
        'GraphQL is required',
      ],
      correctIndex: 1,
    },
  ],
  'Data Analyst': [
    {
      id: 'da-null',
      question: 'When aggregating with SQL, NULL values are typically:',
      options: ['Treated as zero automatically', 'Ignored by AVG/SUM unless coalesced', 'Always errors', 'Converted to 1'],
      correctIndex: 1,
    },
    {
      id: 'da-join',
      question: 'An INNER JOIN returns rows where:',
      options: [
        'Keys match in both tables',
        'All rows from the left table appear',
        'No keys are required',
        'Duplicates are forbidden',
      ],
      correctIndex: 0,
    },
    {
      id: 'da-bias',
      question: 'Sampling bias most directly threatens:',
      options: ['Compiler speed', 'Generalization of conclusions', 'CSS layout', 'TCP handshake'],
      correctIndex: 1,
    },
    {
      id: 'da-viz',
      question: 'A line chart is usually best for:',
      options: ['Parts-of-whole composition', 'Trend over time', 'Hierarchical categories', 'Correlation matrix heat'],
      correctIndex: 1,
    },
    {
      id: 'da-metric',
      question: 'Precision answers: of predicted positives, how many were actually positive?',
      options: ['True positives / all actual positives', 'True positives / predicted positives', 'Accuracy only', 'Recall inverted'],
      correctIndex: 1,
    },
  ],
  'AI Engineer': [
    {
      id: 'ai-overfit',
      question: 'Overfitting typically means the model:',
      options: [
        'Fails on training data',
        'Memorizes training noise and weakens on unseen data',
        'Always has lower train than test error',
        'Cannot use GPUs',
      ],
      correctIndex: 1,
    },
    {
      id: 'ai-grad',
      question: 'Gradient descent updates parameters using:',
      options: ['Random search only', 'The gradient of a loss function', 'TCP retransmissions', 'One-hot labels only'],
      correctIndex: 1,
    },
    {
      id: 'ai-emb',
      question: 'Embeddings map discrete items into:',
      options: ['JPEG compression', 'Dense vector spaces for similarity', 'SQL indexes only', 'DNS records'],
      correctIndex: 1,
    },
    {
      id: 'ai-rag',
      question: 'RAG commonly combines retrieval with:',
      options: ['DNS caching', 'Generative models conditioned on retrieved context', 'Spreadsheets only', 'SMTP'],
      correctIndex: 1,
    },
    {
      id: 'ai-ethics',
      question: 'A key fairness risk in hiring ML is:',
      options: [
        'Using HTTPS',
        'Propagating historical bias present in training labels',
        'Using GPUs',
        'Logging requests',
      ],
      correctIndex: 1,
    },
  ],
  'Backend Engineer': [
    ...COMMON,
    {
      id: 'be-auth',
      question: 'For backend services, a common secure session approach is:',
      options: [
        'Long-lived JWT in localStorage only',
        'HttpOnly cookies + short-lived access tokens + refresh rotation',
        'Password in query string for caching',
        'Symmetric keys shared in frontend bundle',
      ],
      correctIndex: 1,
    },
    {
      id: 'be-db',
      question: 'A database index primarily helps with:',
      options: [
        'Eliminating migrations',
        'Speeding certain lookups and supporting selective uniqueness',
        'Storing images inline',
        'Removing foreign keys',
      ],
      correctIndex: 1,
    },
    {
      id: 'be-api',
      question: 'REST statelessness implies:',
      options: [
        'Server stores UI state in memory per tab',
        'Each request contains enough context; server does not rely on prior session memory',
        'Clients cannot cache responses',
        'GraphQL is required',
      ],
      correctIndex: 1,
    },
  ],
  'UI/UX Designer': [
    {
      id: 'ux-fitts',
      question: "Fitts' Law implies targets should be:",
      options: ['Tiny and scattered', 'Larger and closer for faster pointing', 'Hidden', 'Only icons without labels'],
      correctIndex: 1,
    },
    {
      id: 'ux-wcag',
      question: 'WCAG contrast guidance primarily supports:',
      options: ['Database normalization', 'Perceivable content for users with low vision', 'GPU batching', 'REST caching'],
      correctIndex: 1,
    },
    {
      id: 'ux-research',
      question: 'A usability test with 5-8 participants is often used to:',
      options: [
        'Replace analytics entirely',
        'Find many major usability issues quickly (not prove statistical prevalence)',
        'Guarantee scientific census',
        'Measure compile times',
      ],
      correctIndex: 1,
    },
    {
      id: 'ux-hierarchy',
      question: 'Visual hierarchy helps users:',
      options: ['Compress PDFs', 'Prioritize attention on primary actions', 'Encrypt TCP', 'Normalize SQL'],
      correctIndex: 1,
    },
    {
      id: 'ux-journey',
      question: 'A user journey map typically includes:',
      options: [
        'Only hex color codes',
        'Stages, touchpoints, pain points, and opportunities',
        'Only database ER diagrams',
        'GPU kernel launches',
      ],
      correctIndex: 1,
    },
  ],
}

import OpenAI from 'openai'

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null

const DEFAULT_ROLE = 'Full Stack Developer'

export function listRoles() {
  return Object.keys(QUESTIONS_BY_ROLE)
}

/** 
 * @param {string} role 
 * @param {string} [resumeText]
 */
export async function getQuestionSet(role, resumeText) {
  const key = QUESTIONS_BY_ROLE[role] ? role : DEFAULT_ROLE
  const staticQuestions = QUESTIONS_BY_ROLE[key].map((q) => ({
    id: q.id,
    question: q.question,
    options: q.options,
  }))

  if (!openai) {
    return staticQuestions
  }

  try {
    const contextPrompt = resumeText && resumeText.length > 100 
      ? `Based on this candidate's resume: "${resumeText.slice(0, 2500)}", generate 5 role-specific and resume-aligned technical MCQs.`
      : `Generate 5 standard but high-quality technical MCQs for a ${role} position.`

    const prompt = `
      You are an expert technical interviewer for the role of ${role}.
      ${contextPrompt}
      
      Requirements:
      1. Each question MUST be highly professional and test deep technical knowledge or practical scenario-based problem solving.
      2. If a resume was provided, prioritize questions about the specific technologies, projects, or methodologies mentioned in the resume, but ensure they remain relevant to the ${role} role.
      3. If no resume is provided, generate the best possible industry-standard questions for a ${role}.
      4. Each question must have exactly 4 options and 1 correct index (0-3).
      5. Format: JSON object with "questions" key containing array of objects { id, question, options, correctIndex }.
      
      Respond ONLY with the JSON object.
    `

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: "You are a professional technical assessment engine." }, { role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })

    const raw = response.choices[0].message.content
    const data = JSON.parse(raw)
    const aiQuestions = Array.isArray(data.questions) ? data.questions : []
    
    if (aiQuestions.length < 3) {
      return staticQuestions
    }

    // Map AI questions and store them in the global bank for this session
    const mapped = aiQuestions.map((q, idx) => {
      const id = q.id || `ai-q-${Date.now()}-${idx}`
      const cleanQ = {
        id,
        question: q.question,
        options: q.options,
        correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0
      }
      
      // Store in a session-based or global cache so scoreTechnical can find them
      // For this demo, we add them to the QUESTIONS_BY_ROLE list if not present
      if (!QUESTIONS_BY_ROLE[key].find(sq => sq.id === id)) {
        QUESTIONS_BY_ROLE[key].push(cleanQ)
      }
      return { id: cleanQ.id, question: cleanQ.question, options: cleanQ.options }
    })

    return mapped
  } catch (err) {
    console.error('AI Question Generation failed:', err)
    return staticQuestions
  }
}

/** @param {string} role */
export function scoreTechnical(role, answers) {
  const key = QUESTIONS_BY_ROLE[role] ? role : DEFAULT_ROLE
  const bank = QUESTIONS_BY_ROLE[key]
  let correct = 0
  const breakdown = []
  
  // Only score questions that were actually asked (sent in answers keys)
  const answerIds = Object.keys(answers)
  const relevantQuestions = bank.filter(q => answerIds.includes(q.id))
  
  if (relevantQuestions.length === 0) {
     return { score: 0, correct: 0, total: 0, breakdown: [] }
  }

  for (const q of relevantQuestions) {
    const selected = typeof answers[q.id] === 'number' ? answers[q.id] : -1
    const ok = selected === q.correctIndex
    if (ok) correct += 1
    breakdown.push(`${ok ? '✓' : '✗'} ${q.question.slice(0, 52)}…`)
  }

  const base = Math.round((correct / relevantQuestions.length) * 100)
  return { score: Math.min(100, Math.max(0, base)), correct, total: relevantQuestions.length, breakdown }
}
