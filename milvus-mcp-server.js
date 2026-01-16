#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { MilvusClient } from '@zilliz/milvus2-sdk-node'
import fs from 'node:fs/promises'
import path from 'node:path'

const MILVUS_HOST = process.env.MILVUS_HOST || 'localhost'
const MILVUS_PORT = process.env.MILVUS_PORT || '19530'
const MILVUS_COLLECTION = process.env.MILVUS_COLLECTION || 'documents'
const TOPK = Number(process.env.TOPK || '10')
const EMBEDDING_DIM = Number(process.env.EMBEDDING_DIM || '768')
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'nomic-embed-text'
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434'

const client = new MilvusClient({ address: `${MILVUS_HOST}:${MILVUS_PORT}` })

// 等待服务启动
async function waitForService(service, checkFn, maxAttempts = 60, interval = 2000) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await checkFn()
      console.error(`✓ ${service} 就绪`)
      return
    } catch (err) {
      console.error(`⏳ 等待 ${service} 启动... (${i + 1}/${maxAttempts})`)
      await new Promise(r => setTimeout(r, interval))
    }
  }
  throw new Error(`${service} 启动超时`)
}

// 检查 Ollama 服务是否可用
async function checkOllama() {
  const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
    method: 'GET',
    headers: { 'content-type': 'application/json' }
  })
  if (!res.ok) throw new Error('Ollama 未响应')
}

// 检查 Milvus 服务是否可用
async function checkMilvus() {
  await client.checkHealth()
}

// 将文本转换为向量
async function embedText(text) {
  const res = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model: OLLAMA_MODEL, prompt: text })
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Ollama embedding 失败: HTTP ${res.status} ${body}`)
  }

  const json = await res.json()
  const embedding = json?.embedding
  if (!Array.isArray(embedding)) throw new Error('Ollama 响应缺少 embedding 数组')
  return embedding
}

// 批量将文本转换为向量
async function embedTexts(texts, concurrency = 4) {
  const results = new Array(texts.length)
  let nextIndex = 0

  async function worker() {
    while (true) {
      const i = nextIndex
      nextIndex += 1
      if (i >= texts.length) return

      results[i] = await embedText(texts[i])
    }
  }

  const workers = Array.from({ length: Math.max(1, concurrency) }, () => worker())
  await Promise.all(workers)
  return results
}

// 将 markdown 切分为 chunks
function chunkMarkdown({ filePath, markdown, minChars = 200, maxChars = 1200 }) {
  const chunks = []
  const lines = markdown.split('\n')
  let currentChunk = ''
  let currentSection = ''
  let currentTitle = ''

  for (const line of lines) {
    const trimmed = line.trim()

    if (trimmed.startsWith('# ')) {
      if (currentChunk.trim()) {
        chunks.push({
          chunk_id: `${filePath}:${chunks.length}`,
          content: currentChunk.trim(),
          title: currentTitle || 'Untitled',
          section: currentSection || 'Introduction'
        })
        currentChunk = ''
      }
      currentTitle = trimmed.slice(2).trim()
      currentSection = currentTitle
    } else if (trimmed.startsWith('## ')) {
      if (currentChunk.trim()) {
        chunks.push({
          chunk_id: `${filePath}:${chunks.length}`,
          content: currentChunk.trim(),
          title: currentTitle || 'Untitled',
          section: currentSection || 'Introduction'
        })
        currentChunk = ''
      }
      currentSection = trimmed.slice(3).trim()
    }

    currentChunk += line + '\n'

    if (currentChunk.length >= maxChars && currentChunk.length >= minChars) {
      chunks.push({
        chunk_id: `${filePath}:${chunks.length}`,
        content: currentChunk.trim(),
        title: currentTitle || 'Untitled',
        section: currentSection || 'Introduction'
      })
      currentChunk = ''
    }
  }

  if (currentChunk.trim()) {
    chunks.push({
      chunk_id: `${filePath}:${chunks.length}`,
      content: currentChunk.trim(),
      title: currentTitle || 'Untitled',
      section: currentSection || 'Introduction'
    })
  }

  return chunks
}

// 根据文件路径确定文档类型
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

// 递归列出 markdown 文件
async function listMarkdownFiles(dir) {
  const out = []
  const entries = await fs.readdir(dir, { withFileTypes: true })

  for (const e of entries) {
    if (e.name === '.DS_Store' || e.name === 'node_modules') continue

    const full = path.join(dir, e.name)
    if (e.isDirectory()) {
      out.push(...(await listMarkdownFiles(full)))
    } else if (e.isFile() && e.name.endsWith('.md')) {
      out.push(full)
    }
  }

  return out
}

// 截断字符串
function truncate(str, max) {
  if (str.length <= max) return str
  return str.slice(0, max)
}

const server = new Server(
  {
    name: 'milvus-mcp-server',
    version: '1.0.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
)

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'search_milvus',
        description: '在 Milvus 向量数据库中搜索相关文档',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: '搜索查询文本'
            }
          },
          required: ['query']
        }
      },
      {
        name: 'ingest_milvus',
        description: '全量更新 Milvus 向量数据库，从指定目录导入 markdown 文档',
        inputSchema: {
          type: 'object',
          properties: {
            root_dir: {
              type: 'string',
              description: '包含 markdown 文件的根目录'
            }
          },
          required: ['root_dir']
        }
      }
    ]
  }
})

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  if (name === 'search_milvus') {
    const { query } = args

    if (!query || typeof query !== 'string') {
      throw new Error('query 参数必须是字符串')
    }

    const vector = await embedText(query)

    const res = await client.search({
      collection_name: MILVUS_COLLECTION,
      anns_field: 'vector',
      data: vector,
      limit: TOPK,
      metric_type: 'COSINE',
      params: { ef: 64 },
      output_fields: ['path', 'title', 'section', 'doc_type', 'updated_at', 'content', 'chunk_id']
    })

    const results = res.results.map((r, i) => ({
      score: r.score,
      chunk_id: r.chunk_id,
      title: r.title,
      section: r.section,
      path: r.path,
      content: r.content?.substring(0, 500) + (r.content?.length > 500 ? '...' : ''),
      doc_type: r.doc_type
    }))

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(results, null, 2)
        }
      ]
    }
  }

  if (name === 'ingest_milvus') {
    const { root_dir } = args

    if (!root_dir || typeof root_dir !== 'string') {
      throw new Error('root_dir 参数必须是字符串')
    }

    const files = await listMarkdownFiles(root_dir)
    const allChunks = []

    for (const f of files) {
      const stat = await fs.stat(f)
      const markdown = await fs.readFile(f, 'utf-8')
      const chunks = chunkMarkdown({
        filePath: f,
        markdown,
        minChars: 200,
        maxChars: 1200
      })

      const relPath = path.relative(root_dir, f)
      chunks.forEach((c) => {
        allChunks.push({
          ...c,
          path: relPath,
          doc_type: docTypeFromPath(f),
          updated_at: stat.mtimeMs
        })
      })
    }

    const vectors = await embedTexts(allChunks.map((c) => c.content))
    const batchSize = 64

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
        collection_name: MILVUS_COLLECTION,
        fields_data
      })
    }

    await client.flushSync({ collection_names: [MILVUS_COLLECTION] })

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            files_processed: files.length,
            chunks_created: allChunks.length
          }, null, 2)
        }
      ]
    }
  }

  throw new Error(`未知工具: ${name}`)
})

// 主函数：启动 MCP 服务器
async function main() {
  console.error('正在检查服务...')
  await Promise.all([
    waitForService('Ollama', checkOllama),
    waitForService('Milvus', checkMilvus)
  ])

  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch(console.error)
