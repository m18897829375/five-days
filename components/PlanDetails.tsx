interface MacroNutrient {
  percentage: number
  grams: number
}

interface PlanData {
  protein: MacroNutrient
  carbs: MacroNutrient
  fat: MacroNutrient
  exercisePlan: string
  tips: string[]
}

interface PlanDetailsProps {
  data: PlanData
}

function MacroBar({ label, nutrient, color }: { label: string; nutrient: MacroNutrient; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-16">{label}</span>
      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${nutrient.percentage}%` }}
        />
      </div>
      <span className="text-sm text-gray-900 font-medium w-16 text-right">
        {nutrient.percentage}% {nutrient.grams}g
      </span>
    </div>
  )
}

export default function PlanDetails({ data }: PlanDetailsProps) {
  return (
    <div className="space-y-6">
      {/* Macro breakdown */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">每日营养素分解</h3>
        <div className="space-y-2.5">
          <MacroBar label="蛋白质" nutrient={data.protein} color="bg-blue-500" />
          <MacroBar label="碳水" nutrient={data.carbs} color="bg-amber-500" />
          <MacroBar label="脂肪" nutrient={data.fat} color="bg-red-400" />
        </div>
      </div>

      {/* Exercise plan */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">运动计划</h3>
        <p className="text-sm text-gray-600 leading-relaxed">{data.exercisePlan}</p>
      </div>

      {/* Daily tips */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">每日建议</h3>
        <ul className="space-y-2">
          {data.tips.map((tip, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-600">
              <span className="text-blue-500 shrink-0 mt-0.5">•</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
