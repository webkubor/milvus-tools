# 环境依赖

| 组件 | 说明 |
|-----|------|
| Node.js >= 18 | 运行脚本与 VitePress，本项目使用 `type: module`。|
| pnpm >= 8 | 推荐 pnpm 来保持锁文件一致。|
| Docker >= 20.10 | Milvus standalone 依赖容器。|
| Ollama（可选） | 本地 embedding，默认配置为 `nomic-embed-text`。|
| 浏览器 | 访问 VitePress 文档或 Attu UI。|

可通过 `pnpm run docs:dev` 启动 docs（HTML）并确认依赖满足，`pnpm run milvus:smoke` 则能快速检测 Milvus 连接。
