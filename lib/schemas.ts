import { z } from "zod"

export const ageRangeSchema = z.object({
  ageRange: z.enum(["18-29", "30-39", "40-49", "50+"]),
})

export const genderSchema = z.object({
  gender: z.enum(["male", "female"]),
})

export const bodyDataSchema = z.object({
  age: z.number().min(10).max(120),
  height: z.number().min(50).max(300),
  currentWeight: z.number().min(20).max(500),
  targetWeight: z.number().min(20).max(500),
})

export const goalsSchema = z.object({
  goals: z
    .array(z.enum(["lose_weight", "tone_muscle", "build_muscle", "stay_healthy"]))
    .min(1),
})

export const exerciseSchema = z.object({
  frequency: z.enum(["sedentary", "light", "moderate", "active", "very_active"]),
})

export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  field: z.string().optional(),
  received: z.unknown().optional(),
})

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: ApiErrorSchema.optional(),
  })
