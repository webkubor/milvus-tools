import { MilvusClient } from '@zilliz/milvus2-sdk-node'
import fs from 'node:fs'
import { embedMock } from './milvus-embed-mock.mjs'
import { embedOllama } from './milvus-embed-ollama.mjs'

const address = process.env.MILVUS_ADDR || '127.0.0.1:19530'
const collectionName = process.env.MILVUS_COLLECTION || 'ai_common_chunks'
const dim = Number(process.env.EMBEDDING_DIM || '768')

const embedProvider = (process.env.EMBED_PROVIDER || 'ollama').toLowerCase()
const embedModel = process.env.OLLAMA_MODEL || 'nomic-embed-text'
const embedBaseUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434'

// RAG Query Alias (可选：别名扩展，提高命中率)
const aliasFile = process.env.ALIAS_FILE || '/Users/webkubor/Documents/AI_Common/snippets/_aliases.md'
const configFile = process.env.MILVUS_CONFIG_FILE || '/Users/webkubor/Desktop/AI-tools/milvus-tools/config.json'
const logDir = process.env.RAG_LOG_DIR || '/Users/webkubor/Documents/AI_Plan/rag_logs'
const logEnabled = (process.env.RAG_LOG_ENABLED || '1') !== '0'
function loadAliases(filePath) {
  try {
    if (!fs.existsSync(filePath)) return new Map()
    const raw = fs.readFileSync(filePath, 'utf-8')
    const map = new Map()
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const normalized = trimmed.replace(/^[-*]\s+/, '')
      const idx = normalized.indexOf(':')
      if (idx <= 0) continue
      const key = normalized.slice(0, idx).trim()
      const rest = normalized.slice(idx + 1).trim()
      if (!key || !rest) continue
      const values = rest.split(/,|，/).map((v) => v.trim()).filter(Boolean)
      if (!values.length) continue
      map.set(key.toLowerCase(), values)
    }
    return map
  } catch (_) {
    return new Map()
  }
}

function expandQuery(query, aliases) {
  const words = query.split(/\s+/).filter(Boolean)
  if (words.length > 2) return query
  const expanded = [query]
  for (const w of words) {
    const list = aliases.get(w.toLowerCase())
    if (list) expanded.push(...list)
  }
  const uniq = []
  const seen = new Set()
  for (const item of expanded) {
    const key = item.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    uniq.push(item)
  }
  return uniq.join(' OR ')
}

function loadConfig(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null
    const raw = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(raw)
  } catch (_) {
    return null
  }
}

function safeFilename(input) {
  return input
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_\-\.]+/g, '_')
    .slice(0, 60) || 'query'
}

function formatLocalTime(d) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function writeSearchLog({ query, expandedQuery, topK, embedProvider, embedModel, embedBaseUrl, dim, durationMs, milvusAddress, milvusCollection, attuUrl }) {
  if (!logEnabled) return
  try {
    fs.mkdirSync(logDir, { recursive: true })
    const ts = new Date()
    const stamp = ts.toISOString().replace(/[:]/g, '-').replace(/\..+/, '')
    const file = `${logDir}/${stamp}_${safeFilename(query)}.md`
    const lines = [
      '# RAG Search Log',
      `- 时间: ${formatLocalTime(ts)}`,
      `- 查询词: ${query}`,
      `- 扩展词: ${expandedQuery}`,
      `- 搜索耗时(ms): ${durationMs}`,
      `- TOPK: ${topK}`,
      `- 模型提供者: ${embedProvider === 'ollama' ? 'Ollama(本地)' : embedProvider}`,
      `- 具体模型: ${embedProvider === 'ollama' ? embedModel : 'N/A'}`,
      `- 模型服务地址: ${embedProvider === 'ollama' ? embedBaseUrl : 'N/A'}`,
      `- 向量维度: ${dim}`,
      `- 向量数据库: Milvus(本地)`,
      `- 向量库地址: ${milvusAddress}`,
      `- Collection: ${milvusCollection}`,
      `- 前端(Attu): ${attuUrl || 'N/A'}`,
      ''
    ]
    fs.writeFileSync(file, lines.join('\n'))
  } catch (_) {
    // 忽略日志错误，避免影响检索
  }
}

const query = process.argv.slice(2).join(' ').trim()
const aliases = loadAliases(aliasFile)
const expandedQuery = expandQuery(query, aliases)
if (!query) {
  console.error('用法: pnpm run milvus:search -- "你的问题"')
  process.exit(1)
}

const topK = Number(process.env.TOPK || '10')

const client = new MilvusClient({ address })

async function embedQuery(text) {
  if (embedProvider === 'mock') {
    const [v] = embedMock([text], dim)
    return v
  }

  if (embedProvider === 'ollama') {
    const [v] = await embedOllama([text], { model: embedModel, baseUrl: embedBaseUrl, dim, concurrency: 1 })
    return v
  }

  throw new Error(`未知 EMBED_PROVIDER: ${embedProvider}（支持：ollama/mock）`)
}

const startedAt = Date.now()
const vector = await embedQuery(expandedQuery)

const res = await client.search({
  collection_name: collectionName,
  anns_field: 'vector',
  data: vector,
  limit: topK,
  metric_type: 'COSINE',
  params: { ef: 64 },
  output_fields: ['path', 'title', 'section', 'doc_type', 'updated_at', 'content', 'chunk_id']
})

const durationMs = Date.now() - startedAt
const cfg = loadConfig(configFile)
const cfgMilvus = cfg?.milvus || {}
const cfgDocker = cfgMilvus?.docker || {}
writeSearchLog({
  query,
  expandedQuery,
  topK,
  embedProvider,
  embedModel,
  embedBaseUrl,
  dim,
  durationMs,
  milvusAddress: address,
  milvusCollection: collectionName,
  attuUrl: cfgDocker.attuUrl
})

console.log(JSON.stringify(res, null, 2))
