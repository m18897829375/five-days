# Ralph 自动化工具清单

根据 prd.json 的 16 个 User Story 分析，以下工具已配备完成。

## CLI 工具

| 工具 | 版本 | 用途 | 对应的 Story |
|------|------|------|-------------|
| `node` | v24.14.0 | JavaScript 运行时 | US-001~016 |
| `npm` | 11.9.0 | 包管理 | US-001~016 |
| `npx` | 11.9.0 | CLI 工具执行 | US-001~016 |
| `npx prisma` | 7.8.0 | 数据库迁移、客户端生成 | US-001 |
| `npx tsc` | 6.0.3 | TypeScript 类型检查 | US-002, 全Phase |
| `git` | 2.53.0 | 版本控制 | 全Phase |
| `curl` | 8.18.0 | API 端点测试 | US-003~009, US-015 |
| `jq` | 1.8.1 | JSON 解析与断言 | US-003~009, US-015 |
| `gh` | 2.92.0 | GitHub 仓库操作 | US-016 |
| `vercel` | 53.3.1 | 部署到公网 | US-016 |

## MCP 工具

| 工具 | 配置位置 | 用途 | 对应的 Story |
|------|----------|------|-------------|
| Playwright | `.mcp.json` | 浏览器自动化测试、UI 截图验证 | US-010~015 |
| Context7 | `.mcp.json` | 最新库文档查询（Prisma/Next.js） | US-001~006 |

## 验证脚本

| 脚本 | 调用方式 | 覆盖的 Story |
|------|----------|-------------|
| `scripts/verify-build.sh` | `bash scripts/verify-build.sh` | US-001~014（typecheck + build） |
| `scripts/verify-api.sh` | `bash scripts/verify-api.sh [BASE_URL]` | US-003~009, US-015（完整 API 测试） |

## prd.json Story → 验证工具映射

| Story | 主要工具 | 验证方式 |
|-------|----------|----------|
| US-001 | npx prisma | `npx prisma db push` 成功 + `npx prisma generate` 通过 |
| US-002 | npx tsc | `npx tsc --noEmit` 零错误 |
| US-003 | curl + jq | verify-api.sh: 201 + sessionId 存在 |
| US-004 | curl + jq | verify-api.sh: 200 + nextStep / 400 VALIDATION_ERROR |
| US-005 | curl + jq | verify-api.sh: 200 + completedSteps 数量正确 |
| US-006 | curl + jq | verify-api.sh: 200 + 409 防重 |
| US-007 | curl + jq | verify-api.sh: FREE 脱敏 / PREMIUM 完整 |
| US-008 | curl + jq | verify-api.sh: 200 + subscription变PREMIUM + 409 防重 |
| US-009 | curl + jq | verify-api.sh: 200 + sessionId 可查完整结果 |
| US-010 | Playwright MCP + npx tsc | 浏览器验证进度条、重定向 + typecheck |
| US-011 | Playwright MCP + npx tsc | 浏览器验证步骤提交 + typecheck |
| US-012 | Playwright MCP + npx tsc | 浏览器验证表单输入 + typecheck |
| US-013 | Playwright MCP + curl | 浏览器验证 FREE 结果页 + verify-api.sh |
| US-014 | Playwright MCP + curl | 浏览器验证支付弹窗解锁 + verify-api.sh |
| US-015 | curl + jq + Playwright | verify-api.sh 全量 + 浏览器 E2E |
| US-016 | gh + vercel | `gh repo create` + `vercel --prod` |

## .claude/settings.json 已添加的权限

```json
"Bash(npx prisma *)",
"Bash(npx create-next-app *)",
"Bash(vercel *)",
"Bash(gh *)",
"Bash(npx next *)",
"Bash(powershell *)",
"Bash(bash *)"
```
