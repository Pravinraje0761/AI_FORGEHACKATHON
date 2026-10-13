// Run with: npm test   (Node's built-in test runner; no network, no API keys)
import { test } from 'node:test'
import assert from 'node:assert/strict'

delete process.env.OPENAI_API_KEY
const { evaluateCandidate, _internals } = await import('../src/evaluate.js')
const { overallLevel, shortlist, computeHiringProbabilities, buildBenchmarking, getRoleWeights } = _internals

const STRONG_RESUME = `Summary: Backend engineer.
Experience: Built and shipped a payments API serving 2M requests/day; reduced latency by 40%.
Led a team of 4; automated deployments with GitHub Actions. Designed PostgreSQL schemas.
Projects: Implemented a rate limiter in Go. Education: B.Tech Computer Science.
Skills: Python, Go, PostgreSQL, Docker, Kubernetes, AWS. Contact: me@example.com`

test('level and shortlist thresholds', () => {
  assert.equal(overallLevel(90), 'Industry Ready')
  assert.equal(overallLevel(70), 'Interview Ready')
  assert.equal(overallLevel(10), 'Early Stage')
  assert.equal(shortlist(80), 'yes')
  assert.equal(shortlist(64), 'maybe')
  assert.equal(shortlist(10), 'no')
})

test('role weights sum to 1', () => {
  for (const role of ['Backend Developer', 'Full Stack Developer', 'ML Engineer', 'Designer']) {
    const w = getRoleWeights(role)
    const sum = Object.values(w).reduce((a, b) => a + b, 0)
    assert.ok(Math.abs(sum - 1) < 1e-9, `${role}: ${sum}`)
  }
})

test('indicative band depends on scores only, not on the candidate name', () => {
  const dims = { resume: 70, technical: 60, communication: 65, portfolio: 50 }
  const a = buildBenchmarking(64, dims, 'Backend Developer', 'Asha')
  const b = buildBenchmarking(64, dims, 'Backend Developer', 'Vikram')
  assert.equal(a.percentile, b.percentile)
})

test('fit scores stay within their bounds', () => {
  for (const overall of [0, 50, 100]) {
    const p = computeHiringProbabilities(overall, overall, overall, 'Full Stack Developer')
    for (const v of Object.values(p)) assert.ok(v >= 6 && v <= 96)
  }
})

test('a stronger resume scores higher end to end', async () => {
  const base = { role: 'Backend Developer', introText: 'I am a backend developer.', mockInterviewAnswer: 'I would use a queue.' }
  const strong = await evaluateCandidate({ ...base, resumeText: STRONG_RESUME })
  const weak = await evaluateCandidate({ ...base, resumeText: 'hello' })
  assert.ok(strong.resume.score > weak.resume.score)
  assert.ok(strong.overall >= weak.overall)
})
