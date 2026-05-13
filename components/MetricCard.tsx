import { cn } from "@/lib/utils"

interface MetricCardProps {
  label: string
  value: string | number
  unit?: string
  subtext?: string
  className?: string
}

export default function MetricCard({ label, value, unit, subtext, className }: MetricCardProps) {
  return (
    <div className={cn("bg-white rounded-xl p-6 shadow-sm border border-gray-100", className)}>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
        {unit && <span className="text-sm text-gray-400">{unit}</span>}
      </div>
      {subtext && <p className="text-sm text-gray-500 mt-1">{subtext}</p>}
    </div>
  )
}
