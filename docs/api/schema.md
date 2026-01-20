# Schema 模块

`scripts/common/schemas.mjs` 提供：

- 字段构建器：`int64Field`、`varCharField`、`floatVectorField`、`jsonField` 等。
- 八个预设 schema（`rag`、`simple`、`full_metadata`、`code`、`image`、`multilingual`、`conversation`、`product`），可通过 `PRESET_SCHEMAS` 获取。
- `createSchema`/`cloneSchema` 可用于自定义或扩展预设。
- `describeSchema` 生成字段 / index 描述，便于输出或日志。

所有脚本以及 `docs/*` 示例页面都直接导入该模块。
