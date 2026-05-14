import mammoth from 'mammoth'
import pdfParse from 'pdf-parse'

/**
 * @param {Buffer} buffer
 * @param {string} originalName
 */
export async function extractResumeText(buffer, originalName = '') {
  const lower = originalName.toLowerCase()
  if (lower.endsWith('.pdf')) {
    const data = await pdfParse(buffer)
    return (data.text || '').replace(/\s+/g, ' ').trim()
  }
  if (lower.endsWith('.docx')) {
    const { value } = await mammoth.extractRawText({ buffer })
    return (value || '').replace(/\s+/g, ' ').trim()
  }
  if (lower.endsWith('.txt') || lower.endsWith('.md')) {
    return buffer.toString('utf8').replace(/\s+/g, ' ').trim()
  }
  try {
    const data = await pdfParse(buffer)
    if (data.text && data.text.trim().length > 50) return data.text.replace(/\s+/g, ' ').trim()
  } catch {
    /* fall through */
  }
  try {
    const { value } = await mammoth.extractRawText({ buffer })
    if (value && value.trim().length > 20) return value.replace(/\s+/g, ' ').trim()
  } catch {
    /* ignore */
  }
  return buffer.toString('utf8').replace(/\s+/g, ' ').trim()
}
