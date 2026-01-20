# 代码片段 Schema

- Collection：`code_snippets`
- 维度：768
- 额外字段：`code`、`language`、`function_name`、`file_path`、`project`、`docstring`
- 索引：`HNSW(COSINE)` 适合代码搜索

特别适用于技术文档、函数查询和工程知识库。通过 `getPresetSchema('code')` 获取。
