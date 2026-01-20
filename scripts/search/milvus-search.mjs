import { MilvusClient } from '@zilliz/milvus2-sdk-node'
import { embedMock } from './milvus-embed-mock.mjs'
import { embedOllama } from './milvus-embed-ollama.mjs'

const address = process.env.MILVUS_ADDR || '127.0.0.1:19530'
const collectionName = process.env.MILVUS_COLLECTION || 'ai_common_chunks'
const dim = Number(process.env.EMBEDDING_DIM || '768')

const embedProvider = (process.env.EMBED_PROVIDER || 'ollama').toLowerCase()

const query = process.argv.slice(2).join(' ').trim()
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
    const model = process.env.OLLAMA_MODEL || 'nomic-embed-text'
    const baseUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434'
    const [v] = await embedOllama([text], { model, baseUrl, dim, concurrency: 1 })
    return v
  }

  throw new Error(`未知 EMBED_PROVIDER: ${embedProvider}（支持：ollama/mock）`)
}

const vector = await embedQuery(query)

const res = await client.search({
  collection_name: collectionName,
  anns_field: 'vector',
  data: vector,
  limit: topK,
  metric_type: 'COSINE',
  params: { ef: 64 },
  output_fields: ['path', 'title', 'section', 'doc_type', 'updated_at', 'content', 'chunk_id']
})

console.log(JSON.stringify(res, null, 2))
