import { MilvusClient } from '@zilliz/milvus2-sdk-node'
import { logAction } from '../common/logger.mjs'

const address = process.env.MILVUS_ADDR || '127.0.0.1:19530'
const collectionName = process.env.MILVUS_COLLECTION || 'ai_common_chunks'

const client = new MilvusClient({ address })

// 尽量温和：存在才 drop
const existing = await client.showCollections()
const exists = (existing?.data || []).some((c) => c.name === collectionName)

if (exists) {
  console.log(`准备 drop collection: ${collectionName}`)
  try {
    await client.releaseCollection({ collection_name: collectionName })
  } catch {
    // ignore
  }
  await client.dropCollection({ collection_name: collectionName })
  console.log(`已 drop collection: ${collectionName}`)
} else {
  console.log(`collection 不存在，跳过 drop: ${collectionName}`)
}

// 复用现有 init 脚本逻辑：通过子进程调用，避免重复维护 schema
// 说明：此脚本只负责“全量重建表结构 + 索引 + load”，不负责 embedding/入库。
const { spawnSync } = await import('node:child_process')
const result = spawnSync(process.execPath, ['scripts/collection/milvus-init-collection.mjs'], {
  stdio: 'inherit',
  env: process.env
})

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}

await logAction('REBUILD', { collectionName })
