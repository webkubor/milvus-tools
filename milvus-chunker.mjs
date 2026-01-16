import { createHash } from 'node:crypto'
import path from 'node:path'

function sha1(input) {
  return createHash('sha1').update(input).digest('hex')
}

function normalizeHeading(text) {
  return text.trim().replace(/\s+/g, ' ')
}

function splitByHeadings(markdown) {
  const lines = markdown.split(/\r?\n/)
  const blocks = []

  let currentHeadingPath = []
  let currentHeading = ''
  let buffer = []

  function flush() {
    const content = buffer.join('\n').trim()
    if (content) {
      blocks.push({
        headingPath: currentHeadingPath.join(' > '),
        section: currentHeading,
        content
      })
    }
    buffer = []
  }

  for (const line of lines) {
    const m = /^(#{1,3})\s+(.*)$/.exec(line)
    if (m) {
      flush()
      const level = m[1].length
      const heading = normalizeHeading(m[2])
      currentHeading = heading
      currentHeadingPath = currentHeadingPath.slice(0, level - 1)
      currentHeadingPath[level - 1] = heading
      continue
    }
    buffer.push(line)
  }

  flush()
  return blocks
}

function splitLongText(text, maxChars) {
  if (text.length <= maxChars) return [text]

  // 优先按空行切
  const paragraphs = text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
  const out = []
  let buf = ''

  for (const p of paragraphs) {
    if (!buf) {
      buf = p
      continue
    }
    if ((buf + '\n\n' + p).length <= maxChars) {
      buf += '\n\n' + p
    } else {
      out.push(buf)
      buf = p
    }
  }
  if (buf) out.push(buf)

  // 如果仍有超长段落，退化为硬切
  const final = []
  for (const part of out) {
    if (part.length <= maxChars) {
      final.push(part)
    } else {
      for (let i = 0; i < part.length; i += maxChars) {
        final.push(part.slice(i, i + maxChars))
      }
    }
  }

  return final
}

function mergeShort(chunks, minChars) {
  const out = []
  let buf = null

  for (const c of chunks) {
    if (!buf) {
      buf = { ...c }
      continue
    }

    if (buf.content.length < minChars) {
      buf.content = `${buf.content}\n\n${c.content}`.trim()
      continue
    }

    out.push(buf)
    buf = { ...c }
  }

  if (buf) out.push(buf)
  return out
}

export function chunkMarkdown({
  filePath,
  markdown,
  minChars = 200,
  maxChars = 1200
}) {
  const relPath = filePath
  const title = path.basename(filePath)

  const blocks = splitByHeadings(markdown)
  const expanded = []

  for (const b of blocks) {
    const parts = splitLongText(b.content, maxChars)
    parts.forEach((content, idx) => {
      expanded.push({
        title,
        section: b.section || title,
        headingPath: b.headingPath || title,
        content,
        chunkIndexInSection: idx
      })
    })
  }

  const merged = mergeShort(expanded, minChars)

  const chunks = merged.map((c, i) => {
    const chunkIdRaw = `${relPath}::${c.headingPath}::${i}`
    return {
      chunk_id: sha1(chunkIdRaw),
      path: relPath,
      title: c.title,
      section: c.section,
      content: c.content
    }
  })

  return chunks
}
