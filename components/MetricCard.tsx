import { cn } from "@/lib/utils"

interface MetricCardProps {
  label: string
  value: string | number
  unit?: string
  subtext?: string
  className?: string
}

export default function MetricCard({
  label,
  value,
  unit,
  subtext,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-white p-5 shadow-sm border border-gray-100",
        className,
      )}
    >
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">
        {value}
        {unit && <span className="text-base font-normal text-gray-500 ml-1">{unit}</span>}
      </p>
      {subtext && (
        <p className="text-xs text-gray-400 mt-1">{subtext}</p>
      )}
    </div>
  )
}
