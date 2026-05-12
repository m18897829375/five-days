# PRD: 健康测评系统

## Introduction

构建一个健康测评系统的核心后端架构。用户通过5步问卷（年龄范围 → 性别 → 身体数据 → 目标 → 运动频率）提交个人数据，服务端执行健康评估算法（BMI/BMR/TDEE/目标预测），在结果页根据订阅状态差异化返回数据。FREE 用户看到核心指标但预测曲线和饮食计划被锁定，通过 `/pay` 模拟支付升级为 PREMIUM 后解锁完整报告。

参考竞品：BetterMe Quiz Funnel (`betterme-pilates.com`)。核心目标是展示后端工程能力：API 设计、数据库建模、鉴权闭环、AI 协作效率。

## Goals

- 实现5步问卷的分步保存与进度恢复（关闭浏览器后重新打开回到正确步骤）
- 服务端健康评估算法（BMI、BMR、TDEE、建议摄入量、目标预测日期、周度体重预测）
- 基于 subscription_status 的差异化 API 返回（FREE 脱敏 vs PREMIUM 完整）
- 模拟支付闭环（/pay 接口 → 修改数据库 → 刷新结果页即时解锁）
- 数据验证严谨（Zod 运行时校验 + 边界值防护）
- 公网可演示（Vercel 部署，完整 cURL 可重放链）
- 代码仓库含 README、API 文档、DB Schema 图、AI 使用复盘

## User Stories

### Phase 1: Foundation

#### US-001: Prisma Schema 与数据库初始化
**Description:** 作为开发者，我需要定义数据库模型（User、QuizStep、HealthResult、PaymentRecord）并通过 Prisma 迁移到 Supabase PostgreSQL，以便所有后续功能有持久化基础。

**Acceptance Criteria:**
- [ ] `prisma/schema.prisma` 包含 User、QuizStep、HealthResult、PaymentRecord 四个模型
- [ ] 枚举类型定义：`Subscription`(FREE/PREMIUM)、`QuizStep`(AGE_RANGE/GENDER/BODY_DATA/GOALS/EXERCISE_FREQUENCY)、`PaymentStatus`(COMPLETED/FAILED)
- [ ] QuizStep 有 `userId+step` 联合唯一约束（防止重复）
- [ ] HealthResult 有 `userId` 唯一约束（一个用户一份结果）
- [ ] User.sessionId 有唯一索引
- [ ] `npx prisma db push` 成功创建所有表
- [ ] `lib/prisma.ts` 导出 Prisma Client 单例
- [ ] Typecheck 通过

#### US-002: TypeScript 类型定义与 Zod 验证层
**Description:** 作为开发者，我需要定义所有 API 请求/响应的 Zod Schema 并导出 TypeScript 类型，以便编译时类型安全 + 运行时输入验证。

**Acceptance Criteria:**
- [ ] `lib/schemas.ts` 包含所有 step 的 Zod schema（AGE_RANGE/GENDER/BODY_DATA/GOALS/EXERCISE_FREQUENCY）
- [ ] BODY_DATA 验证规则：age(10-120)、height(50-300)、currentWeight(20-500)、targetWeight(20-500)
- [ ] GOALS 验证规则：数组至少1项，每项在允许枚举中
- [ ] EXERCISE_FREQUENCY 验证规则：frequency 在5档枚举中
- [ ] `lib/types.ts` 从 Zod schema 通过 `z.infer` 导出所有 TS 类型
- [ ] 统一定义 `ApiResponse<T>` 和 `ApiError` 类型
- [ ] Typecheck 通过

### Phase 2: API Layer

#### US-003: POST /api/session — 匿名会话管理
**Description:** 作为系统，我需要为每个新访客创建匿名会话（UUID sessionId）并写入 httpOnly cookie，以便后续所有 API 可以识别用户和恢复进度。

**Acceptance Criteria:**
- [ ] `POST /api/session` 无请求体，返回 `{ success, sessionId, subscription }`
- [ ] 创建 User 记录（subscription=FREE）
- [ ] 设置 `Set-Cookie: sessionId=xxx; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`
- [ ] 重复调用同一 sessionId 不创建新用户（幂等）
- [ ] HTTP 201 状态码
- [ ] Typecheck 通过

#### US-004: POST /api/quiz/step — 分步数据保存
**Description:** 作为用户，我每完成一步问卷，系统应将我的答案增量保存到后端，以便中途关闭后不会丢失已填数据。

**Acceptance Criteria:**
- [ ] `POST /api/quiz/step` 接收 `{ step, data }`，从 cookie 获取 sessionId
- [ ] 使用 Zod schema 校验 data（类型 + 边界值）
- [ ] 校验失败返回 `400 { success:false, error:{ code:"VALIDATION_ERROR", message, field, received } }`
- [ ] 校验通过 upsert 写入 QuizStep（userId+step 联合唯一）
- [ ] 返回 `{ success:true, nextStep }`（告知前端下一步路由）
- [ ] 无 sessionId 返回 401 UNAUTHORIZED
- [ ] Typecheck 通过

#### US-005: GET /api/quiz/progress — 进度恢复
**Description:** 作为用户，当我重新打开页面时，系统应返回我已完成的所有步骤数据并告知我下一步应该去哪里。

**Acceptance Criteria:**
- [ ] `GET /api/quiz/progress` 从 cookie 获取 sessionId
- [ ] 返回 `{ success, currentStep, completedSteps[], data:{...allCompletedData}, isCompleted }`
- [ ] `currentStep` 是第一个未完成的步骤枚举值
- [ ] `data` 包含所有已完成步骤的聚合数据（用于预填表单）
- [ ] `isCompleted` 为 true 时表示所有5步已完成（前端应跳转 /results）
- [ ] 无 sessionId 返回 401 UNAUTHORIZED
- [ ] Typecheck 通过

#### US-006: POST /api/quiz/complete — 完成测评并计算
**Description:** 作为用户，我完成所有步骤后触发服务端健康评估算法，系统计算 BMI/BMR/TDEE/目标日期/周度预测并持久化。

**Acceptance Criteria:**
- [ ] `POST /api/quiz/complete` 检查5步是否全部完成
- [ ] 缺步返回 `400 { success:false, error:{ code:"INCOMPLETE_QUIZ", details:{ missingSteps } } }`
- [ ] 已 complete 返回 `409 { code:"ALREADY_COMPLETED" }`
- [ ] 计算 BMI：`weight(kg) / height(m)²`，分类为偏瘦/正常/超重/肥胖
- [ ] 计算 BMR：Mifflin-St Jeor 公式（按性别区分）
- [ ] 计算 TDEE：BMR × 活动系数
- [ ] 计算建议摄入：TDEE ± 500/300kcal（按目标）
- [ ] 计算目标日期：`|targetWeight - currentWeight| / 0.75kg × 7` 天
- [ ] 生成周度预测：从今天到目标日期，线性插值每周体重和卡路里
- [ ] 写入 HealthResult 记录（关联 userId）
- [ ] Typecheck 通过

#### US-007: GET /api/results — 订阅差异化结果
**Description:** 作为系统，我需要根据用户的 subscription_status 返回不同的结果数据。FREE 用户看到核心指标但预测曲线和饮食计划被锁定；PREMIUM 用户看到完整数据。

**Acceptance Criteria:**
- [ ] `GET /api/results` 从 cookie 获取 sessionId
- [ ] 无结果（未完成测评）返回 `404 { code:"NOT_FOUND", message:"请先完成测评" }`
- [ ] FREE：返回 BMI/BMI分类/BMR/建议摄入/目标日期/stats，但 `weeklyProjection: null, planDetails: null, lockMessage: "..."` 
- [ ] PREMIUM：返回所有字段，包括完整的 weeklyProjection 数组和 planDetails 对象
- [ ] weeklyProjection 包含每周的 weight 和 calories 数据点
- [ ] planDetails 包含 protein/carbs/fat 的百分比和克数、exercisePlan、tips
- [ ] `response.subscription` 字段明确标注当前订阅状态
- [ ] Typecheck 通过

#### US-008: POST /api/pay — 模拟支付
**Description:** 作为用户，我可以通过 `/pay` 接口模拟支付 ¥99 来解锁完整报告。系统修改我的 subscription_status 为 PREMIUM 并记录支付。

**Acceptance Criteria:**
- [ ] `POST /api/pay` 接收 `{ amount: 99 }`，从 cookie 获取 sessionId
- [ ] 检查当前 subscription：已是 PREMIUM 返回 `409 { code:"ALREADY_PREMIUM" }`
- [ ] 模拟支付成功：UPDATE User SET subscription = "PREMIUM"
- [ ] INSERT PaymentRecord (status=COMPLETED, amount)
- [ ] 返回 `{ success:true, subscription:"PREMIUM", message:"支付成功" }`
- [ ] 模拟支付失败场景：返回 `{ success:false, error:{ code:"PAYMENT_FAILED" } }`，插入 PaymentRecord(status=FAILED)
- [ ] Typecheck 通过

#### US-009: GET /api/test/premium-session — 测试辅助
**Description:** 作为面试官，我需要一个快捷方式获得已支付的测试 sessionId，以便直接对比付费前后的差异化返回。

**Acceptance Criteria:**
- [ ] `GET /api/test/premium-session` 无需鉴权
- [ ] 创建一个新 User（subscription=PREMIUM）
- [ ] 填充完整的5步测试数据
- [ ] 执行健康计算并写入 HealthResult
- [ ] 返回 `{ sessionId, subscription:"PREMIUM", curlExample:"curl -b 'sessionId=xxx' ..." }`
- [ ] Typecheck 通过

### Phase 3: Frontend

#### US-010: 问卷框架 — Layout + Middleware + ProgressBar
**Description:** 作为用户，我需要一个统一的问卷界面框架，包含顶部进度条、步骤间自动跳转、以及中断后恢复进度的能力。

**Acceptance Criteria:**
- [ ] `middleware.ts` 读取 sessionId cookie，无则 POST /api/session 创建
- [ ] Middleware 调用 GET /api/quiz/progress 获取进度
- [ ] 有未完成步骤 → 重定向到当前应访问的步骤
- [ ] 已完成 → 访问非结果页时重定向到 /results
- [ ] `components/ProgressBar.tsx` 显示 5 步进度（当前步骤高亮，已完成打勾）
- [ ] `components/StepPage.tsx` 通用布局：标题 + 内容区 + "继续"按钮
- [ ] 步骤间过渡动画（Framer Motion）
- [ ] Verify in browser using dev-browser skill
- [ ] Typecheck 通过

#### US-011: 问卷步骤页 — 5步数据采集
**Description:** 作为用户，我需要依次完成年龄范围选择、性别、身体数据、目标、运动频率5个步骤，每步提交后自动进入下一步。

**Acceptance Criteria:**
- [ ] `/` 年龄范围选择：4张卡片（18-29/30-39/40-49/50+），每张含人物图片和年龄标签，点击即提交
- [ ] `/quiz/gender` 性别选择：男/女大图标按钮
- [ ] `/quiz/body` 身体数据：年龄(数字)、身高(cm)、当前体重(kg)、目标体重(kg) 四个数字输入
- [ ] `/quiz/goals` 目标选择：减重/塑形/增肌/保持健康 多选卡片
- [ ] `/quiz/exercise` 运动频率：久坐/轻度/中度/活跃/非常活跃 5档单选
- [ ] 每步提交调用 POST /api/quiz/step，成功后自动跳转 nextStep
- [ ] 验证失败时在对应字段旁显示红色错误消息
- [ ] 所有步骤完成后自动跳转 /results
- [ ] 移动端响应式（主要目标设备为手机）
- [ ] Verify in browser using dev-browser skill
- [ ] Typecheck 通过

#### US-012: 结果页 — 免费预览 + 付费墙 + 完整报告
**Description:** 作为用户，我需要在结果页看到我的健康评估。FREE 用户看到核心指标和锁住的预测数据；点击付费后即时解锁完整报告。

**Acceptance Criteria:**
- [ ] `/results` 页面加载时调用 GET /api/results
- [ ] FREE 状态：显示4个指标卡片（BMI/日摄入/目标日期/预计减重），预测曲线区域显示毛玻璃遮罩+锁图标+CTA按钮
- [ ] 付费 CTA 按钮："解锁完整方案 — ¥99"
- [ ] 点击 CTA → 弹出支付确认弹窗（PayModal）
- [ ] PayModal 显示：支付金额 ¥99、确认按钮、取消按钮
- [ ] 确认支付 → POST /api/pay → 成功：关闭弹窗 + 刷新数据（即时展示 PREMIUM 内容）
- [ ] 支付失败 → 弹窗内显示错误消息 + 重试按钮
- [ ] PREMIUM 状态：预测曲线展开（CSS绘制的简单图表或Chart.js）、饮食计划（蛋白/碳水/脂肪配比）、运动建议、提示列表
- [ ] 刷新页面保持 PREMIUM 状态（sessionId cookie 不变）
- [ ] 加载中显示骨架屏
- [ ] Verify in browser using dev-browser skill
- [ ] Typecheck 通过

### Phase 4: Integration & Delivery

#### US-013: 端到端流程串联与异常处理
**Description:** 作为系统，我需要确保完整的用户旅程不漏不崩，覆盖所有异常路径。

**Acceptance Criteria:**
- [ ] 完整流程测试：首页 → 5步 → 结果(FREE) → 支付 → 结果(PREMIUM) 无报错
- [ ] 进度恢复测试：填到第3步 → 关闭标签页 → 重新打开 → 自动回到第4步
- [ ] 跳过步骤测试：直接访问 /quiz/goals → 重定向到最早未完成步骤
- [ ] 边界值测试：提交 height:3000 → 400 VALIDATION_ERROR
- [ ] 重复支付测试：PREMIUM 用户调用 /pay → 409 ALREADY_PREMIUM
- [ ] 缺步 complete 测试：只完成3步调用 /api/quiz/complete → 400 INCOMPLETE_QUIZ
- [ ] 无 session 访问结果：返回 404
- [ ] Typecheck + Lint 通过

#### US-014: 部署与文档交付
**Description:** 作为开发者，我需要将项目部署到 Vercel 公网并交付完整的文档（README、API 文档、DB Schema 图、AI 使用复盘、cURL 演示链）。

**Acceptance Criteria:**
- [ ] Vercel 部署成功，公网 URL 可访问
- [ ] Supabase 环境变量在 Vercel 中配置（DATABASE_URL, DIRECT_URL）
- [ ] README.md 包含：项目简介、技术栈、本地启动步骤、API 端点列表
- [ ] README.md 包含完整 cURL 演示链（从 session 创建到支付后查看完整结果，10+ 条命令）
- [ ] README.md 包含 DB Schema ASCII 图
- [ ] README.md 包含测试 sessionId（已付费，可直接查看 PREMIUM 结果）
- [ ] AI-COLLABORATION.md 包含6个章节：数据库建模、类型生成、Mock数据、算法实现、调试迭代、协作文档
- [ ] GitHub 仓库公开可访问

## Functional Requirements

- **FR-1:** 系统必须为每个访客生成唯一的 sessionId（UUID v4）并写入 httpOnly cookie
- **FR-2:** 系统必须在每个问卷步骤提交时执行 Zod 运行时校验，拒绝非法类型和边界外数值
- **FR-3:** 身高校验范围 50-300cm，体重 20-500kg，年龄 10-120 岁
- **FR-4:** 系统必须通过 upsert（userId+step 联合唯一）防止重复提交
- **FR-5:** 系统必须在所有5步完成后触发服务端健康评估算法
- **FR-6:** 健康评估算法必须包含：BMI（含分类）、BMR（Mifflin-St Jeor 公式，按性别区分）、TDEE（5档活动系数）、建议摄入量（按目标调整）、目标预测日期、周度体重预测
- **FR-7:** GET /api/results 必须根据 User.subscription 返回不同数据（FREE 隐藏 weeklyProjection 和 planDetails）
- **FR-8:** POST /api/pay 必须修改 User.subscription 为 PREMIUM 并插入 PaymentRecord
- **FR-9:** 前端 Middleware 必须根据 GET /api/quiz/progress 的返回自动重定向到正确步骤
- **FR-10:** 结果页必须即时反映订阅状态变化（支付后无需重新登录）
- **FR-11:** 所有 API 错误必须遵循统一格式 `{ success:false, error:{ code, message, field?, received?, details? } }`
- **FR-12:** 系统必须通过 `/api/test/premium-session` 提供可对比的测试数据

## Non-Goals

- 不使用真实支付集成（Stripe/PayPal 等），仅模拟
- 不使用 OAuth/JWT 等正式鉴权方案，仅匿名 sessionId
- 不需要用户注册/登录/密码
- 不需要邮箱验证或手机验证
- 不需要管理后台或 CMS
- 不需要国际化（仅中文或仅英文）
- 不需要真实的健康专业审核（算法仅供演示）
- 不 1:1 复刻 BetterMe 的 UI/UX 细节
- 不需要 App 下载流程
- 不需要追加销售（upsell）流程

## Technical Considerations

- **会话方案:** 匿名 UUID sessionId + httpOnly cookie（非 JWT，简化但符合要求）
- **数据存储:** 问卷数据用 JSONB（灵活适应不同步骤的不同字段），计算结果用结构化列
- **防重策略:** userId+step 联合唯一约束 + upsert（数据库层面保证幂等）
- **进度恢复:** middleware 每次页面加载时调用 GET /api/quiz/progress
- **类型安全:** Zod schema → `z.infer` 自动推导 TS 类型，API 入参和返回值全类型覆盖
- **部署架构:** Next.js App Router API Routes + Prisma + Supabase PostgreSQL，Vercel 托管
- **样式方案:** Tailwind CSS（快速构建，移动端优先）

## Success Metrics

- 完整 funnel 从首页到支付后结果页无报错（1次走通）
- 进度恢复：关闭浏览器后重新打开回到正确步骤
- 所有 API 边界值验证拒绝非法输入（height:3000 返回 400）
- cURL 链可完整重放全流程（无需浏览器即可演示）
- FREE vs PREMIUM 的 `/api/results` 返回结构差异清晰可见
- DB Schema 图可展示表关系（User → QuizStep → HealthResult → PaymentRecord）

## Open Questions

- 结果页的预测曲线用纯 CSS 实现还是引入 Chart.js？（体积 vs 表现力，建议先用纯CSS）
- 是否需要单元测试？（docx 未要求，但可加分；时间允许则加）
- README 语言用中文还是英文？（建议中英双语，中文主 + 英文关键部分）
