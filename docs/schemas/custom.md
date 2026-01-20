# 自定义 Schema

可以通过 `createSchema`/`cloneSchema` 构建自定义方案。

```javascript
import { createSchema, varCharField, floatVectorField } from '../../scripts/common/schemas.mjs'

const schema = createSchema({
  collectionName: 'custom_docs',
  dimension: 1024,
  customFields: [
    varCharField('source', 256),
    floatVectorField('vector', 1024)
  ],
  indexParams: { nlist: 1024 }
})
```

- 结合 `indexParams` 与 `metricType` 可调优搜索。
- `describeSchema(schema)` 可用于生成文档描述。
