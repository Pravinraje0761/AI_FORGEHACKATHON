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

const DEFAULT_ROLE = 'Full Stack Developer'

export function listRoles() {
  return Object.keys(QUESTIONS_BY_ROLE)
}

/** @param {string} role */
export function getQuestionSet(role) {
  const key = QUESTIONS_BY_ROLE[role] ? role : DEFAULT_ROLE
  return QUESTIONS_BY_ROLE[key].map((q) => ({
    id: q.id,
    question: q.question,
    options: q.options,
  }))
}

/** @param {string} role */
export function scoreTechnical(role, answers) {
  const key = QUESTIONS_BY_ROLE[role] ? role : DEFAULT_ROLE
  const bank = QUESTIONS_BY_ROLE[key]
  let correct = 0
  const breakdown = []
  for (let i = 0; i < bank.length; i++) {
    const q = bank[i]
    const selected = typeof answers[q.id] === 'number' ? answers[q.id] : -1
    const ok = selected === q.correctIndex
    if (ok) correct += 1
    breakdown.push(`${ok ? '✓' : '✗'} ${q.question.slice(0, 52)}…`)
  }
  const base = Math.round((correct / bank.length) * 100)
  const adjusted = Math.min(100, Math.max(35, base + (correct === bank.length ? 5 : 0)))
  return { score: adjusted, correct, total: bank.length, breakdown }
}
