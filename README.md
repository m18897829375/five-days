# 健康测评系统 (Health Assessment System)

一个基于 Next.js 16 的全栈健康测评 Web 应用。用户通过 5 步问卷（年龄 → 性别 → 身体数据 → 目标 → 运动频率）完成测评后，系统使用 Mifflin-St Jeor 公式计算 BMI、BMR、TDEE，并生成个性化饮食与运动计划。支持 FREE/PREMIUM 订阅差异化结果展示，PREMIUM 用户可查看完整体重预测趋势和营养方案。

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) |
| 语言 | TypeScript 6 |
| 数据库 | PostgreSQL (Supabase) |
| ORM | Prisma 7 |
| 验证 | Zod 4 |
| 样式 | Tailwind CSS 3 |
| 动画 | Framer Motion 12 |
| 图表 | Chart.js 4 |
| 部署 | Vercel |

## 本地搭建

```bash
# 1. 克隆仓库
git clone https://github.com/m18897829375/five-days.git
cd five-days

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 填入 Supabase 数据库连接信息：
#   DATABASE_URL — Supabase Session Pooler (端口 6543)
#   DIRECT_URL — Supabase 直连 (端口 5432，用于 Prisma 迁移)

# 4. 初始化数据库
npx prisma db push
npx prisma generate

# 5. 启动开发服务器
npm run dev
# 访问 http://localhost:3000
```

## API 端点

| 方法 | 端点 | 说明 | 鉴权 |
|------|------|------|------|
| POST | `/api/session` | 创建匿名会话 | 无 |
| POST | `/api/quiz/step` | 保存单步问卷数据 | sessionId Cookie |
| GET | `/api/quiz/progress` | 查询当前进度 | sessionId Cookie |
| POST | `/api/quiz/complete` | 完成测评并计算 | sessionId Cookie |
| GET | `/api/results` | 获取差异化结果 | sessionId Cookie |
| POST | `/api/pay` | 模拟支付 ¥99 | sessionId Cookie |
| GET | `/api/test/premium-session` | 生成预付费测试会话 | 无 |

### 响应格式

成功：
```json
{
  "success": true,
  "data": { ... }
}
```

错误：
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "年龄必须在 10-120 之间",
    "field": "age",
    "received": 150
  }
}
```

## cURL 演示链

以下 11 条命令完成从创建会话到查看 PREMIUM 结果的完整流程：

```bash
BASE="http://localhost:3000"

# 1. 创建匿名会话
curl -s -c cookie.txt -X POST $BASE/api/session | jq .

# 2. 提交年龄范围 (AGE_RANGE)
curl -s -b cookie.txt -X POST $BASE/api/quiz/step \
  -H "Content-Type: application/json" \
  -d '{"step":"AGE_RANGE","data":{"ageRange":"30-39"}}' | jq .

# 3. 提交性别 (GENDER)
curl -s -b cookie.txt -X POST $BASE/api/quiz/step \
  -H "Content-Type: application/json" \
  -d '{"step":"GENDER","data":{"gender":"male"}}' | jq .

# 4. 提交身体数据 (BODY_DATA)
curl -s -b cookie.txt -X POST $BASE/api/quiz/step \
  -H "Content-Type: application/json" \
  -d '{"step":"BODY_DATA","data":{"age":30,"height":175,"currentWeight":80,"targetWeight":70}}' | jq .

# 5. 提交目标 (GOALS)
curl -s -b cookie.txt -X POST $BASE/api/quiz/step \
  -H "Content-Type: application/json" \
  -d '{"step":"GOALS","data":{"goals":["lose_weight"]}}' | jq .

# 6. 提交运动频率 (EXERCISE_FREQUENCY)
curl -s -b cookie.txt -X POST $BASE/api/quiz/step \
  -H "Content-Type: application/json" \
  -d '{"step":"EXERCISE_FREQUENCY","data":{"frequency":"moderate"}}' | jq .

# 7. 查询进度
curl -s -b cookie.txt $BASE/api/quiz/progress | jq .

# 8. 完成测评
curl -s -b cookie.txt -X POST $BASE/api/quiz/complete | jq .

# 9. 查看 FREE 结果（模糊化展示）
curl -s -b cookie.txt $BASE/api/results | jq .

# 10. 支付 ¥99 解锁完整报告
curl -s -b cookie.txt -X POST $BASE/api/pay \
  -H "Content-Type: application/json" \
  -d '{"amount":99}' | jq .

# 11. 查看 PREMIUM 完整结果（含体重预测 + 营养方案）
curl -s -b cookie.txt $BASE/api/results | jq .
```

## 预付费测试会话

使用以下命令快速生成一个预付费 PREMIUM 会话，直接查看完整报告：

```bash
# 生成 PREMIUM 测试会话（含完整测评数据）
curl -s http://localhost:3000/api/test/premium-session | jq .
```

返回示例：
```json
{
  "sessionId": "382b1e9a-42a1-4b7d-a854-cf4565666f7a",
  "subscription": "PREMIUM",
  "curlExample": "curl -s -b 'sessionId=382b1e9a-42a1-4b7d-a854-cf4565666f7a' http://localhost:3000/api/results | jq ."
}
```

复制返回的 `curlExample` 命令，或直接使用以下预付费测试 sessionId：

```bash
# 直接使用预付费测试会话查看完整 PREMIUM 报告
curl -s -b 'sessionId=382b1e9a-42a1-4b7d-a854-cf4565666f7a' http://localhost:3000/api/results | jq .
```

此 sessionId 返回完整数据：体重预测趋势（weeklyProjection）+ 蛋白质/碳水/脂肪营养方案（planDetails）+ 运动计划 + 每日建议。

## 数据库关系图

```
┌──────────────────────────────────────────────────────────────────┐
│                         DATABASE SCHEMA                          │
└──────────────────────────────────────────────────────────────────┘

┌─────────────────────┐
│       users         │
├─────────────────────┤
│ id          UUID PK │──┐
│ sessionId   VARCHAR │  │  1:N
│ subscription ENUM   │  │  ┌─────────────────────────┐
│ createdAt   TIMESTMP│  ├─▶│       quiz_steps        │
│ updatedAt   TIMESTMP│  │  ├─────────────────────────┤
└────────┬────────────┘  │  │ id          UUID PK     │
         │               │  │ step    quiz_step ENUM  │
         │ 1:1           │  │ data         JSON       │
         ▼               │  │ userId      UUID FK     │
┌─────────────────────┐  │  │ createdAt  TIMESTMP    │
│   health_results    │  │  │ updatedAt  TIMESTMP    │
├─────────────────────┤  │  │                         │
│ id          UUID PK │  │  │ UNIQUE(userId, step)    │
│ userId  UUID FK(UQ) │◀─┘  └─────────────────────────┘
│ bmi           FLOAT │
│ bmiCategory  VARCHAR │     ┌─────────────────────────┐
│ bmr           FLOAT │  ┌─▶│    payment_records      │
│ tdee          FLOAT │  │  ├─────────────────────────┤
│ recommendedCal INT  │  │  │ id          UUID PK     │
│ targetDate  TIMESTMP│  │  │ userId      UUID FK     │
│ weeklyProjection JSON│ │  │ amount        INT       │
│ planDetails     JSON │  │  │ status payment_status ENUM
│ createdAt   TIMESTMP│  │  │ createdAt  TIMESTMP    │
│ updatedAt   TIMESTMP│  │  └─────────────────────────┘
└─────────────────────┘  │
                          │ 1:N
         ┌────────────────┘

  Relationship Summary:
  ─────────────────────
  users ──1:N──▶ quiz_steps      (一个用户有 5 个测评步骤)
  users ──1:1──▶ health_results  (一个用户有一个测评结果)
  users ──1:N──▶ payment_records (一个用户可多次支付)

  Enum Definitions:
  ────────────────
  subscription:    FREE | PREMIUM
  quiz_step:       AGE_RANGE | GENDER | BODY_DATA | GOALS | EXERCISE_FREQUENCY
  payment_status:  COMPLETED | FAILED
```

## 健康算法说明

本系统采用以下运动医学标准公式：

- **BMI**：`体重(kg) / 身高(m)²`，分为 4 级（偏瘦/正常/超重/肥胖）
- **BMR**：Mifflin-St Jeor 公式（性别区分）
  - 男：`10×体重 + 6.25×身高 - 5×年龄 + 5`
  - 女：`10×体重 + 6.25×身高 - 5×年龄 - 161`
- **TDEE**：`BMR × 活动系数`（5 级：久坐 1.2 → 非常活跃 1.9）
- **推荐热量**：`TDEE ± 调整值`（减重 -500、塑形 -300、增肌 +300、保持 0）
- **目标日期**：`|当前体重 - 目标体重| / 0.75 × 7 天`
