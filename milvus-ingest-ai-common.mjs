import fs from 'node:fs/promises'
import path from 'node:path'
import { MilvusClient } from '@zilliz/milvus2-sdk-node'
import { chunkMarkdown } from './milvus-chunker.mjs'
import { embedMock } from './milvus-embed-mock.mjs'
import { embedOllama } from './milvus-embed-ollama.mjs'

const AI_COMMON_ROOT = process.env.AI_COMMON_ROOT || '/Users/webkubor/Documents/AI_Common'
const address = process.env.MILVUS_ADDR || '127.0.0.1:19530'
const collectionName = process.env.MILVUS_COLLECTION || 'ai_common_chunks'

const dim = Number(process.env.EMBEDDING_DIM || '1536')
if (!Number.isFinite(dim) || dim <= 0) throw new Error('EMBEDDING_DIM 无效')

const embedProvider = (process.env.EMBED_PROVIDER || 'mock').toLowerCase()
const dryRun = process.argv.includes('--dry-run')

function docTypeFromPath(filePath) {
  const base = path.basename(filePath)
  if (base === 'index.md') return 'index'
  if (base === 'project_index.md') return 'project_index'
  if (base === 'retrospective.md') return 'retrospective'
  if (base === 'vibe_rules.md') return 'rules'
  if (base === 'workflow_retro.md') return 'workflow'
  if (base === 'coding_rules.md') return 'coding_rules'
  if (base === 'git_commit_rules.md') return 'git_rules'
  if (filePath.includes(`${path.sep}extensions${path.sep}`)) return 'extension'
  return 'doc'
}

async function listMarkdownFiles(dir) {
  const out = []
  const entries = await fs.readdir(dir, { withFileTypes: true })

  for (const e of entries) {
    // 排除噪音
    if (e.name === '.DS_Store') continue

    const full = path.join(dir, e.name)
    if (e.isDirectory()) {
      // 只允许扫描 AI_Common/extensions 以及根目录子目录
      // 这里不做复杂黑名单，敏感边界由 privacy_excludes.md 约束；后续可加强
      out.push(...(await listMarkdownFiles(full)))
    } else if (e.isFile() && e.name.endsWith('.md')) {
      out.push(full)
    }
  }

  return out
}

function truncate(str, max) {
  if (str.length <= max) return str
  return str.slice(0, max)
}

async function embedTexts(texts) {
  if (embedProvider === 'mock') return embedMock(texts, dim)

  if (embedProvider === 'ollama') {
    const model = process.env.OLLAMA_MODEL || 'nomic-embed-text'
    const baseUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434'
    const concurrency = Number(process.env.OLLAMA_CONCURRENCY || '4')
    return await embedOllama(texts, { model, baseUrl, dim, concurrency })
  }

  throw new Error(`未知 EMBED_PROVIDER: ${embedProvider}（支持：mock/ollama）`)
}

const client = new MilvusClient({ address })

const files = await listMarkdownFiles(AI_COMMON_ROOT)

// 遵循 privacy_excludes：至少把它本身入库也可以，但如果你不想入库，可在这里排除
const filtered = files.filter((f) => !f.endsWith(`${path.sep}.DS_Store`))

console.log('准备入库文件数:', filtered.length)

const allChunks = []
for (const f of filtered) {
  const stat = await fs.stat(f)
  const markdown = await fs.readFile(f, 'utf-8')
  const chunks = chunkMarkdown({
    filePath: f,
    markdown,
    minChars: 200,
    maxChars: 1200
  })

  const relPath = path.relative(AI_COMMON_ROOT, f)
  chunks.forEach((c) => {
    allChunks.push({
      ...c,
      path: `AI_Common/${relPath}`,
      doc_type: docTypeFromPath(f),
      updated_at: stat.mtimeMs
    })
  })
}

console.log('切片 chunk 总数:', allChunks.length)

if (dryRun) {
  console.log('dry-run 模式：不生成向量、不写入 Milvus')
  process.exit(0)
}

// embedding
const vectors = await embedTexts(allChunks.map((c) => c.content))

// Milvus 写入（batch）
const batchSize = Number(process.env.BATCH_SIZE || '64')

for (let i = 0; i < allChunks.length; i += batchSize) {
  const batch = allChunks.slice(i, i + batchSize)
  const batchVectors = vectors.slice(i, i + batchSize)

  const fields_data = batch.map((c, idx) => ({
    chunk_id: c.chunk_id,
    vector: batchVectors[idx],
    content: truncate(c.content, 8192),
    path: truncate(c.path, 1024),
    title: truncate(c.title, 512),
    section: truncate(c.section, 512),
    doc_type: truncate(c.doc_type, 64),
    updated_at: Math.floor(c.updated_at)
  }))

  await client.insert({
    collection_name: collectionName,
    fields_data
  })

  if ((i / batchSize) % 10 === 0) {
    console.log(`已写入: ${Math.min(i + batchSize, allChunks.length)}/${allChunks.length}`)
  }
}

console.log('写入完成，开始 flush')
await client.flushSync({ collection_names: [collectionName] })

console.log(`完成：AI_Common 已写入 Milvus（EMBED_PROVIDER=${embedProvider}，dim=${dim}）`)
