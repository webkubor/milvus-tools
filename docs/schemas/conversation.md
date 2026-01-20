# 对话系统 Schema

- Collection：`conversations`
- 维度：768
- 字段：`conversation_id`、`message_id`、`role`、`content`、`turn_order`
- 索引：`IVF_FLAT(COSINE)`，`nlist=512`

用于会话历史存储、上下文检索、聊天日志分析。
