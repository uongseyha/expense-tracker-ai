'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { CategorySummary } from '@/types/expense'
import { CATEGORY_CONFIG } from '@/constants/categories'
import { formatCurrency } from '@/lib/formatters'

interface CategoryPieChartInnerProps {
  data: CategorySummary[]
}

interface TooltipEntry {
  name: string
  value: number
  payload: { percentage: number }
}

interface TooltipProps {
  active?: boolean
  payload?: TooltipEntry[]
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-modal px-3 py-2">
      <p className="text-xs font-medium text-gray-700">{entry.name}</p>
      <p className="text-sm font-semibold text-gray-900">{formatCurrency(entry.value * 100)}</p>
      <p className="text-xs text-gray-400">{entry.payload.percentage.toFixed(1)}%</p>
    </div>
  )
}

export function CategoryPieChartInner({ data }: CategoryPieChartInnerProps) {
  const chartData = data.map((d) => ({
    name: d.category,
    value: d.total / 100,
    percentage: d.percentage,
  }))

  return (
    <div className="flex flex-col gap-4">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            dataKey="value"
            paddingAngle={2}
          >
            {chartData.map((entry) => (
              <Cell
                key={entry.name}
                fill={CATEGORY_CONFIG[entry.name as keyof typeof CATEGORY_CONFIG].hex}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-2 gap-1.5">
        {data.map((d) => {
          const { hex } = CATEGORY_CONFIG[d.category]
          return (
            <div key={d.category} className="flex items-center gap-2 text-xs">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: hex }}
              />
              <span className="text-gray-600 truncate">{d.category}</span>
              <span className="ml-auto font-medium text-gray-800 font-mono">
                {d.percentage.toFixed(0)}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
