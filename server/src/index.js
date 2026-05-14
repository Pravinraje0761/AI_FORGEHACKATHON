import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import multer from 'multer'
import { evaluateCandidate } from './evaluate.js'
import { extractResumeText } from './resume.js'
import { getQuestionSet, listRoles } from './questionsBank.js'

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

app.get('/api/questions', (req, res) => {
  const role = typeof req.query.role === 'string' ? req.query.role : 'Full Stack Developer'
  res.json({ role, questions: getQuestionSet(role) })
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
      name: body.name || 'Candidate',
      role: body.role || 'Full Stack Developer',
      skillLevel: body.skillLevel || 'Mid',
      resumeText,
      githubUrl: body.githubUrl || '',
      portfolioUrl: body.portfolioUrl || '',
      linkedinUrl: body.linkedinUrl || '',
      introText: body.introText || '',
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
