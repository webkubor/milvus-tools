export async function embedOllama(texts, { model, baseUrl, dim, concurrency = 4 }) {
  const results = new Array(texts.length)

  let nextIndex = 0
  async function worker() {
    while (true) {
      const i = nextIndex
      nextIndex += 1
      if (i >= texts.length) return

      const text = texts[i]
      const res = await fetch(`${baseUrl}/api/embeddings`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ model, prompt: text })
      })

      if (!res.ok) {
        const body = await res.text().catch(() => '')
        throw new Error(`Ollama embedding 失败: HTTP ${res.status} ${body}`)
      }

      const json = await res.json()
      const embedding = json?.embedding
      if (!Array.isArray(embedding)) throw new Error('Ollama embedding 响应缺少 embedding 数组')
      if (dim && embedding.length !== dim) {
        throw new Error(`Ollama embedding 维度(${embedding.length})与 EMBEDDING_DIM(${dim})不一致；请先用正确维度全量重建 collection`)
      }

      results[i] = embedding
    }
  }

  const workers = Array.from({ length: Math.max(1, concurrency) }, () => worker())
  await Promise.all(workers)

  return results
}
