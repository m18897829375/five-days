# AI 协作开发心得

本文档记录了健康测评系统在 AI 结对编程（Claude Code）下的完整开发过程，涵盖数据库建模、类型推导、算法实现、调试迭代和文档协作 6 个方面。

---

## 1. Database Modeling — 数据库建模

### 设计思路

系统围绕「匿名用户 → 分步问卷 → 健康计算 → 差异化结果」的核心链路，设计了 4 个数据模型：

- **User**：匿名用户，通过 `sessionId`（UUID）标识，`subscription` 区分 FREE/PREMIUM
- **QuizStep**：分步问卷记录，`userId + step` 复合唯一约束防止重复提交
- **HealthResult**：健康计算结果，`userId` 唯一约束确保一个用户只有一份结果
- **PaymentRecord**：支付记录，记录每次支付的金额和状态

### 关键技术决策

1. **Prisma 7 架构适配**：Prisma 7 将连接配置从 `schema.prisma` 移至 `prisma.config.ts`，使用 `defineConfig({ datasource: { url: env('DATABASE_URL') } })`。Schema 中 datasource 块仅保留 `provider = "postgresql"`。

2. **Enum / Model 命名冲突**：Prisma 不允许 enum 和 model 同名。`QuizStep` 同时是枚举和模型导致编译错误，解决方案：枚举命名为 `QuizStepEnum`，模型保持 `QuizStep`。

3. **Supabase PgBouncer 配置**：DDL 操作（`prisma db push`）需直连端口 5432，运行时客户端使用连接池端口 6543。`DATABASE_URL` 和 `DIRECT_URL` 两个环境变量分别服务这两个场景。

4. **Prisma 7 auto-loads .env**：`prisma.config.ts` 自动加载项目根目录 `.env`，无需手动 `dotenv/config`。

### 模式演变

| 轮次 | 变更 |
|------|------|
| US-001 (retry 1) | 初始 Schema 失败 — Enum/Model 命名冲突 |
| US-001 (retry 2) | 修复命名冲突、Prisma 7 配置适配、添加 `@@map()` 表名映射 |
| 最终版 | 4 模型 + 3 枚举 + 完整关系定义，`prisma db push` 通过 |

---

## 2. Type Generation — 类型生成

### Zod + TypeScript 双层架构

采用「Zod 运行时验证 + TypeScript 纯类型推导」的分层模式：

```
lib/schemas.ts ── Zod 验证规则（运行时）
       │
       ▼ z.infer<>
lib/types.ts  ── TypeScript 类型（编译时）
```

### 设计方案

```typescript
// schemas.ts — 5 步独立 Zod Schema
export const bodyDataSchema = z.object({
  age: z.number().min(10).max(120),
  height: z.number().min(50).max(300),
  currentWeight: z.number().min(20).max(500),
  targetWeight: z.number().min(20).max(500),
})

// types.ts — 纯类型推导（import type 避免运行时代码引入）
import type { z } from "zod"
export type BodyData = z.infer<typeof bodyDataSchema>
```

### 关键设计决策

1. **`import type` 隔离**：Zod 类型推导使用 `import type { z }`，避免 Zod 运行时库被引入类型层。
2. **ApiResponse 泛型**：Zod Schema 用泛型函数构造 `(dataSchema) => z.object({...})`，TypeScript 类型用纯泛型 `ApiResponse<T>`，保持灵活性。
3. **联合类型**：`QuizStepData = AgeRangeData | GenderData | BodyData | GoalsData | ExerciseData` 通过联合类型统一各步骤数据类型。

### 演变过程

| 轮次 | 问题 | 解决 |
|------|------|------|
| US-002 (retry 1-2) | Generator 未产出任何代码 | 重新生成 |
| US-002 (retry 3) | Zod 4 API 兼容性问题 | 确认 Zod 4 传统 API 完全可用 |
| US-002 (retry 4) | 类型推导链路验证 | 全部通过，定版 |

---

## 3. Mock Data — 测试数据

### 预付费测试会话

通过 `GET /api/test/premium-session` 端点，无需鉴权即可生成完整 PREMIUM 测试会话：

- 创建 User（`subscription=PREMIUM`）
- 填充全部 5 步问卷（AGE_RANGE → GENDER → BODY_DATA → GOALS → EXERCISE_FREQUENCY）
- 执行健康算法计算并写入 HealthResult
- 返回 `sessionId` + 可直接使用的 cURL 示例

**测试数据**：30 岁男性、175cm、80kg → 目标 70kg（减重）、中等运动频率

### 数据库初始化

本地开发使用 Docker PostgreSQL 替代 Supabase 远程数据库：
```bash
docker run -d --name pg -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:16
```

### cURL 演示链

README 提供 11 条命令的完整演示链，覆盖从创建会话到查看 PREMIUM 结果的完整流程。

---

## 4. Algorithm Implementation — 算法实现

### 健康评估算法 (`lib/health.ts`)

所有算法集中在单一模块中，纯函数设计，无副作用，方便测试和复用：

| 函数 | 公式 | 说明 |
|------|------|------|
| `calculateBMI` | `体重 / 身高²` | 4 级分类（偏瘦/正常/超重/肥胖） |
| `calculateBMR` | Mifflin-St Jeor | 性别区分（男 +5，女 -161） |
| `calculateTDEE` | `BMR × 活动系数` | 5 级：久坐(1.2) → 非常活跃(1.9) |
| `calculateRecommendedCalories` | `TDEE ± 调整值` | 减重 -500、塑形 -300、增肌 +300、保持 0 |
| `calculateTargetDate` | `|Δ体重| / 0.75 × 7 天` | 按每周 0.75kg 安全减重速率 |
| `generateWeeklyProjection` | 线性插值 | 从当前到目标日期的按周体重预测 |
| `generatePlanDetails` | 30/40/30 宏量营养 | 蛋白质/碳水/脂肪克数 + 运动计划 + 每日建议 |

### 设计原则

- **纯函数**：每个函数输入确定则输出确定，无数据库依赖
- **单一职责**：每个函数只做一件事
- **可组合**：`calculateAll()` 组合所有函数，返回完整结果
- **类型安全**：`HealthInput` / `HealthResult` 接口约束输入输出

### 热量调整与运动计划映射

```
减重 (lose_weight)：TDEE - 500kcal → 每周 5 天有氧 + 2 天力量
塑形 (tone_muscle)：TDEE - 300kcal → 每周 3 天力量 + 2 天 HIIT
增肌 (build_muscle)：TDEE + 300kcal → 每周 4-5 天分化力量训练
保持 (stay_healthy)：TDEE + 0    → 每周 3-4 天混合运动
```

---

## 5. Debugging Iterations — 调试迭代

### 典型问题与解决

| 问题 | 根因 | 解决 | 故事 |
|------|------|------|------|
| Prisma enum/model 同名冲突 | Prisma 限制 | 枚举改名为 `QuizStepEnum` | US-001 |
| TypeScript 找不到 `process.env` | `moduleResolution: "bundler"` 不自动引入 Node 类型 | tsconfig 添加 `"types": ["node"]` | US-001 |
| Prisma 7 连接字符串在哪里配 | Prisma 7 架构变更 | 从 schema.prisma 移至 prisma.config.ts | US-001 |
| Zod 4 新 API 与传统 API 混用 | Zod 4 同时支持新旧 API | 全部使用传统 API (`z.object`/`z.enum`/`z.number`) | US-002 |
| Prisma `data` 字段类型不匹配 | Json 字段需要 `InputJsonValue` | `data as Prisma.InputJsonValue` | US-004 |
| Next.js 16 `cookies()` 返回 Promise | Next.js 16 API 变更 | `await cookies()` | US-003 |
| Tailwind 动态类名被 JIT 剪枝 | Tailwind JIT 扫描完整字符串 | 使用 `cn()` 辅助函数 + 完整静态类名 | US-011 |
| ESLint 9 flat config 兼容性 | `@eslint/eslintrc` FlatCompat 循环引用 | 直接用 typescript-eslint 原生 flat config | US-011 |
| `.ralph/` 目录触发 ESLint 误报 | 评估脚本含 `eval`/`console` | eslint.config.mjs 添加 ignores | US-011 |

### 调试方法论

1. **增量验证**：每个故事完成后立即运行 `tsc --noEmit` + `npm run lint`，不让错误积累
2. **合同驱动**：在写代码前先与 Evaluator 协商验收标准，减少方向性错误
3. **失败快速重试**：被退回后不做大范围重写，先读 evaluation feedback，针对性修复

### 重试统计

- US-001: 2 次重试（Prisma 7 适配）
- US-002: 4 次重试（类型层设计迭代）
- US-003: 1 次重试
- US-006: 1 次重试（合同协商失败，手动实现）
- US-008: 1 次重试
- US-011-US-014: 各 1 次重试（UI 细节修复）
- 其余 12 个故事一次通过

---

## 6. Collaborative Documentation — 文档协作

### 协作流程

本项目采用 Ralph 自主开发系统，AI 代理分为 3 个角色：

```
ralph.sh 编排器
    │
    ├── Generator (我)  ── 起草合同 → 实现代码 → 自检验证
    │       │
    │       ▼
    ├── Evaluator       ── 审查合同 → 评估实现 → 打分/退回
    │       │
    │       ▼
    └── Loop Controller ── 循环直到所有故事 passes: true
```

### 合同驱动开发 (Contract-Driven Development)

每个用户故事在编码前先经过「合同协商」阶段：

1. **Generator 起草**：分析 PRD 验收标准，起草实现范围、验收标准、验证步骤
2. **Evaluator 审核**：检查合同是否与 PRD 对齐、AC 是否可验证、范围是否精确
3. **修订/批准**：Evaluator 退回则修改重提，通过则锁定（locked）
4. **按合同实现**：Generator 严格按 locked contract 写代码，不超出范围
5. **评估打分**：Evaluator 从功能、代码质量、设计质量、产品深度 4 维度评分

### 文档产出

- **README.md**：项目门面，包含完整的技术文档和 cURL 演示链
- **AI-COLLABORATION.md**（本文档）：开发过程复盘和心得
- **progress.txt**：增量进度日志，记录每个故事的文件变更和教训
- **prd.json**：产品需求文档，包含 19 个用户故事的完整定义和评估记录

### 关键心得

1. **合同比代码更基础**：先对齐验收标准再写代码，比写完再改高效得多。US-019 第一版合同将「生产部署」降级为「创建配置文件」被退回，修订后才正确对齐 PRD。

2. **阶段纪律不可破**：contract 阶段写代码、build 阶段改合同都是无效操作。每个阶段有明确的产出物。

3. **Pre-QA 自检节省评估轮次**：在提交给 Evaluator 之前逐条自检验收标准，能避免因低级错误（应用启动崩溃、类型错误）被扣分。

4. **AI 代理适合执行明确任务**：验收标准越精确，AI 实现越准确。模糊的 AC（如「工作正常」）在合同阶段就会被退回。

---

> 本文档由 Claude Code (Generator) 在 Ralph 自主开发系统框架下撰写。
