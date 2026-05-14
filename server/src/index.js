import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import multer from 'multer'
import { evaluateCandidate } from './evaluate.js'
import { extractResumeText } from './resume.js'
import { getQuestionSet, listRoles } from './questionsBank.js'

function clipText(s, max) {
  if (typeof s !== 'string') return ''
  return s.length <= max ? s : s.slice(0, max)
}

function clipUrl(s, max) {
  const t = typeof s === 'string' ? s.trim() : ''
  return t.length <= max ? t : t.slice(0, max)
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
})

const app = express()
const port = Number(process.env.PORT || 4000)

app.use(cors({ origin: true }))
app.use(express.json({ limit: '2mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, hasOpenAI: Boolean(process.env.OPENAI_API_KEY) })
})

app.get('/api/roles', (_req, res) => {
  res.json({ roles: listRoles() })
})

app.post('/api/questions', upload.single('resume'), async (req, res) => {
  const role = req.body.role || 'Full Stack Developer'
  let resumeText = ''
  if (req.file?.buffer) {
    try {
      resumeText = await extractResumeText(req.file.buffer, req.file.originalname || '')
    } catch (err) {
      console.error('Failed to parse resume for questions:', err)
    }
  } else if (req.body.resumeText) {
    resumeText = req.body.resumeText
  }
  
  const questions = await getQuestionSet(role, resumeText)
  res.json({ role, questions })
})

app.get('/api/questions', async (req, res) => {
  const role = typeof req.query.role === 'string' ? req.query.role : 'Full Stack Developer'
  const questions = await getQuestionSet(role)
  res.json({ role, questions })
})

app.post('/api/evaluate', upload.single('resume'), async (req, res) => {
  try {
    const body = req.body || {}
    let resumeText = typeof body.resumeText === 'string' ? body.resumeText : ''

    if (req.file?.buffer) {
      try {
        const parsed = await extractResumeText(req.file.buffer, req.file.originalname || '')
        if (parsed && parsed.length > 40) resumeText = parsed
      } catch {
        /* keep body resumeText */
      }
    }

    let techAnswers = {}
    try {
      techAnswers = JSON.parse(body.techAnswersJson || '{}')
    } catch {
      techAnswers = {}
    }

    const payload = {
      name: clipText(body.name || 'Candidate', 120),
      role: clipText(body.role || 'Full Stack Developer', 80),
      skillLevel: clipText(body.skillLevel || 'Mid', 40),
      resumeText,
      githubUrl: clipUrl(body.githubUrl || '', 512),
      portfolioUrl: clipUrl(body.portfolioUrl || '', 512),
      linkedinUrl: clipUrl(body.linkedinUrl || '', 512),
      introText: clipText(body.introText || '', 20000),
      mockInterviewAnswer: clipText(body.mockInterviewAnswer || '', 20000),
      techAnswers,
    }

    const result = await evaluateCandidate(payload)
    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Evaluation failed', detail: String(err?.message || err) })
  }
})

app.listen(port, () => {
  console.log(`Interview readiness API listening on http://localhost:${port}`)
})
