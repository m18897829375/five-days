interface WeeklyData {
  week: number
  weight: number
  calories: number
}

interface WeightChartProps {
  data: WeeklyData[]
}

export default function WeightChart({ data }: WeightChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-gray-400 py-12">暂无体重预测数据</div>
    )
  }

  const weights = data.map((d) => d.weight)
  const minWeight = Math.floor(Math.min(...weights) - 1)
  const maxWeight = Math.ceil(Math.max(...weights) + 1)
  const range = maxWeight - minWeight

  const padding = { left: 48, right: 16, top: 16, bottom: 32 }
  const chartWidth = 600
  const chartHeight = 220
  const plotWidth = chartWidth - padding.left - padding.right
  const plotHeight = chartHeight - padding.top - padding.bottom

  const points = data.map((d, i) => {
    const x = padding.left + (i / Math.max(data.length - 1, 1)) * plotWidth
    const y = padding.top + ((maxWeight - d.weight) / range) * plotHeight
    return { x, y, ...d }
  })

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight - padding.bottom} L ${points[0].x} ${chartHeight - padding.bottom} Z`

  const yTicks = 4
  const yLabels = Array.from({ length: yTicks + 1 }, (_, i) => {
    const val = Math.round((maxWeight - (i / yTicks) * range) * 10) / 10
    const y = padding.top + (i / yTicks) * plotHeight
    return { val, y }
  })

  const xTickInterval = Math.max(1, Math.ceil(data.length / 8))

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full h-auto min-w-[300px]"
        role="img"
        aria-label="体重预测折线图"
      >
        {/* Grid lines */}
        {yLabels.map((t, i) => (
          <g key={`grid-${i}`}>
            <line
              x1={padding.left}
              y1={t.y}
              x2={chartWidth - padding.right}
              y2={t.y}
              stroke="#e5e7eb"
              strokeDasharray="4 3"
            />
            <text
              x={padding.left - 8}
              y={t.y + 4}
              textAnchor="end"
              className="text-[10px]"
              fill="#9ca3af"
            >
              {t.val}kg
            </text>
          </g>
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="url(#weightGradient)" />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((p, i) => (
          <g key={`point-${i}`}>
            <circle cx={p.x} cy={p.y} r="4" fill="white" stroke="#3b82f6" strokeWidth="2" />
            {p.week % xTickInterval === 0 && (
              <text
                x={p.x}
                y={chartHeight - padding.bottom + 16}
                textAnchor="middle"
                className="text-[10px]"
                fill="#9ca3af"
              >
                第{p.week}周
              </text>
            )}
          </g>
        ))}

        <defs>
          <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}
