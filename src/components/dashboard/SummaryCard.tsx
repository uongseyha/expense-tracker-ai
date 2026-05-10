import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface SummaryCardProps {
  label: string
  value: string
  icon: ReactNode
  trend?: {
    value: string
    direction: 'up' | 'down' | 'neutral'
  }
  accentColor?: string
}

const trendIcons = {
  up: <TrendingUp size={13} />,
  down: <TrendingDown size={13} />,
  neutral: <Minus size={13} />,
}

const trendColors = {
  up: 'text-red-500',    // spending up = bad
  down: 'text-green-500', // spending down = good
  neutral: 'text-gray-400',
}

export function SummaryCard({ label, value, icon, trend, accentColor = 'bg-primary-50 text-primary-500' }: SummaryCardProps) {
  return (
    <div className="bg-white rounded-card shadow-card p-5 hover:shadow-card-hover transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900 font-mono">{value}</p>
          {trend && (
            <div className={cn('flex items-center gap-1 mt-1.5 text-xs font-medium', trendColors[trend.direction])}>
              {trendIcons[trend.direction]}
              <span>{trend.value} vs last month</span>
            </div>
          )}
        </div>
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', accentColor)}>
          {icon}
        </div>
      </div>
    </div>
  )
}
