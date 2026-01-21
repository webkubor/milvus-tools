import { DataType, MilvusClient } from '@zilliz/milvus2-sdk-node'
import { logAction } from '../common/logger.mjs'

const address = process.env.MILVUS_ADDR || '127.0.0.1:19530'
const collectionName = process.env.MILVUS_COLLECTION || 'ai_common_chunks'

// 向量维度依赖 embedding 模型：先用环境变量控制，默认 1536
const dim = Number(process.env.EMBEDDING_DIM || '1536')
if (!Number.isFinite(dim) || dim <= 0) {
  throw new Error(`无效的 EMBEDDING_DIM: ${process.env.EMBEDDING_DIM}`)
}

const client = new MilvusClient({ address })

const existing = await client.showCollections()
const exists = (existing?.data || []).some((c) => c.name === collectionName)

if (!exists) {
  await client.createCollection({
    collection_name: collectionName,
    fields: [
      {
        name: 'id',
        data_type: DataType.Int64,
        is_primary_key: true,
        autoID: true
      },
      {
        name: 'chunk_id',
        data_type: DataType.VarChar,
        max_length: 128
      },
      {
        name: 'vector',
        data_type: DataType.FloatVector,
        dim
      },
      {
        name: 'content',
        data_type: DataType.VarChar,
        max_length: 8192
      },
      {
        name: 'path',
        data_type: DataType.VarChar,
        max_length: 1024
      },
      {
        name: 'title',
        data_type: DataType.VarChar,
        max_length: 512
      },
      {
        name: 'section',
        data_type: DataType.VarChar,
        max_length: 512
      },
      {
        name: 'doc_type',
        data_type: DataType.VarChar,
        max_length: 64
      },
      {
        name: 'updated_at',
        data_type: DataType.Int64
      }
    ]
  })

  console.log(`已创建 collection: ${collectionName} (dim=${dim})`)
} else {
  console.log(`collection 已存在: ${collectionName}（跳过创建）`)
}

// 建索引（HNSW：MVP 阶段够用）
await client.createIndex({
  collection_name: collectionName,
  field_name: 'vector',
  index_name: 'vector_hnsw',
  index_type: 'HNSW',
  metric_type: 'COSINE',
  params: {
    M: 16,
    efConstruction: 200
  }
})
console.log('已创建/确保 vector 索引: HNSW(COSINE)')

await client.loadCollectionSync({ collection_name: collectionName })
console.log('已 load collection')

await logAction('INIT', {
  collectionName,
  dim,
  status: exists ? 'EXISTED' : 'CREATED'
})
