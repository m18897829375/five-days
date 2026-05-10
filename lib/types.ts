import type { z } from "zod"
import type {
  ageRangeSchema,
  genderSchema,
  bodyDataSchema,
  goalsSchema,
  exerciseSchema,
  ApiErrorSchema,
} from "@/lib/schemas"

export type AgeRangeData = z.infer<typeof ageRangeSchema>
export type GenderData = z.infer<typeof genderSchema>
export type BodyData = z.infer<typeof bodyDataSchema>
export type GoalsData = z.infer<typeof goalsSchema>
export type ExerciseData = z.infer<typeof exerciseSchema>

export type QuizStepData =
  | AgeRangeData
  | GenderData
  | BodyData
  | GoalsData
  | ExerciseData

export type ApiError = z.infer<typeof ApiErrorSchema>

export type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: ApiError
}
