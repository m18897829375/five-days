const ACTIVITY_COEFFICIENTS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
}

const CALORIE_ADJUST: Record<string, number> = {
  lose_weight: -500,
  tone_muscle: -300,
  build_muscle: 300,
  stay_healthy: 0,
}

export function calculateBMI(weightKg: number, heightCm: number) {
  const heightM = heightCm / 100
  const bmi = Math.round((weightKg / (heightM * heightM)) * 100) / 100

  let category: string
  if (bmi < 18.5) category = "underweight"
  else if (bmi < 25) category = "normal"
  else if (bmi < 30) category = "overweight"
  else category = "obese"

  return { bmi, bmiCategory: category }
}

export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: string,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  return Math.round(base + (gender === "male" ? 5 : -161))
}

export function calculateTDEE(bmr: number, frequency: string): number {
  const coeff = ACTIVITY_COEFFICIENTS[frequency] ?? 1.2
  return Math.round(bmr * coeff)
}

export function calculateRecommendedCalories(tdee: number, goals: string[]): number {
  const primaryGoal = goals[0] ?? "stay_healthy"
  const adjust = CALORIE_ADJUST[primaryGoal] ?? 0
  return tdee + adjust
}

export function calculateTargetDate(currentWeight: number, targetWeight: number): Date {
  const weeks = Math.ceil(Math.abs(targetWeight - currentWeight) / 0.75)
  const now = new Date()
  return new Date(now.getTime() + weeks * 7 * 86400000)
}

export function generateWeeklyProjection(
  currentWeight: number,
  targetWeight: number,
  recommendedCalories: number,
  targetDate: Date,
) {
  const now = new Date()
  const totalDays = Math.ceil((targetDate.getTime() - now.getTime()) / 86400000)
  const totalWeeks = Math.max(1, Math.ceil(totalDays / 7))

  return Array.from({ length: totalWeeks }, (_, i) => {
    const progress = (i + 1) / totalWeeks
    const weight = Math.round((currentWeight + (targetWeight - currentWeight) * progress) * 100) / 100
    return { week: i + 1, weight, calories: recommendedCalories }
  })
}

export function generatePlanDetails(
  recommendedCalories: number,
  goals: string[],
  _frequency: string,
) {
  const proteinPct = 0.3
  const carbsPct = 0.4
  const fatPct = 0.3

  const proteinG = Math.round((recommendedCalories * proteinPct) / 4)
  const carbsG = Math.round((recommendedCalories * carbsPct) / 4)
  const fatG = Math.round((recommendedCalories * fatPct) / 9)

  const primaryGoal = goals[0] ?? "stay_healthy"

  const exercisePlans: Record<string, string> = {
    lose_weight: "每周5天中等强度有氧运动（快走/游泳/骑行），每次40分钟；2天力量训练",
    tone_muscle: "每周3天全身力量训练 + 2天HIIT，每次30-45分钟",
    build_muscle: "每周4-5天分化力量训练（推/拉/腿），每次45-60分钟，配合蛋白质摄入",
    stay_healthy: "每周3-4天混合运动（有氧 + 基础力量），每次30分钟",
  }

  const tips: Record<string, string[]> = {
    lose_weight: [
      "每天保持500kcal热量缺口，每周可减约0.5-0.75kg",
      "优先选择高蛋白低脂食物，增加饱腹感",
      "保证每天7-8小时睡眠，睡眠不足会降低代谢率",
    ],
    tone_muscle: [
      "力量训练前后补充蛋白质，促进肌肉合成",
      "每周渐进增加训练强度，避免平台期",
      "保持水的摄入，每天2-3升",
    ],
    build_muscle: [
      "热量盈余期间优先增肌，每天多摄入300kcal",
      "每公斤体重摄入1.6-2.0g蛋白质",
      "大重量低次数（6-12次/组）促进肌肥大",
    ],
    stay_healthy: [
      "均衡饮食，保证膳食纤维摄入",
      "每周至少150分钟中等强度运动",
      "定期体检，关注体脂率和腰围",
    ],
  }

  return {
    protein: { percentage: 30, grams: proteinG },
    carbs: { percentage: 40, grams: carbsG },
    fat: { percentage: 30, grams: fatG },
    exercisePlan: exercisePlans[primaryGoal] ?? exercisePlans.stay_healthy,
    tips: tips[primaryGoal] ?? tips.stay_healthy,
  }
}

export interface HealthInput {
  currentWeight: number
  targetWeight: number
  heightCm: number
  age: number
  gender: string
  goals: string[]
  frequency: string
}

export interface HealthResult {
  bmi: number
  bmiCategory: string
  bmr: number
  tdee: number
  recommendedCalories: number
  targetDate: string
  weeklyProjection: { week: number; weight: number; calories: number }[]
  planDetails: ReturnType<typeof generatePlanDetails>
}

export function calculateAll(input: HealthInput): HealthResult {
  const { bmi, bmiCategory } = calculateBMI(input.currentWeight, input.heightCm)
  const bmr = calculateBMR(input.currentWeight, input.heightCm, input.age, input.gender)
  const tdee = calculateTDEE(bmr, input.frequency)
  const recommendedCalories = calculateRecommendedCalories(tdee, input.goals)
  const targetDate = calculateTargetDate(input.currentWeight, input.targetWeight)
  const weeklyProjection = generateWeeklyProjection(
    input.currentWeight,
    input.targetWeight,
    recommendedCalories,
    targetDate,
  )
  const planDetails = generatePlanDetails(recommendedCalories, input.goals, input.frequency)

  return {
    bmi,
    bmiCategory,
    bmr,
    tdee,
    recommendedCalories,
    targetDate: targetDate.toISOString(),
    weeklyProjection,
    planDetails,
  }
}
