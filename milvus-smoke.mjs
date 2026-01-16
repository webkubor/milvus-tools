import { MilvusClient } from '@zilliz/milvus2-sdk-node'

const address = process.env.MILVUS_ADDR || '127.0.0.1:19530'

const client = new MilvusClient({ address })

const version = await client.getVersion()
console.log('Milvus version:', version)

const health = await client.checkHealth()
console.log('Milvus health:', health)

const collections = await client.showCollections()
console.log('Collections:', collections?.data?.map((c) => c.name) ?? collections)
