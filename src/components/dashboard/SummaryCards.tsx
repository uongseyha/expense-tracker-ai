import { DashboardStats } from '@/types/expense'
import { SummaryCard } from './SummaryCard'
import { formatCurrency, formatPercent } from '@/lib/formatters'
import { DollarSign, Calendar, TrendingUp, Tag } from 'lucide-react'

interface SummaryCardsProps {
  stats: DashboardStats
}

export function SummaryCards({ stats }: SummaryCardsProps) {
  const momDirection =
    stats.monthOverMonthChange > 0
      ? 'up'
      : stats.monthOverMonthChange < 0
        ? 'down'
        : 'neutral'

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      <SummaryCard
        label="Total Spending"
        value={formatCurrency(stats.totalAllTime)}
        icon={<DollarSign size={20} />}
        accentColor="bg-primary-50 text-primary-500"
      />
      <SummaryCard
        label="This Month"
        value={formatCurrency(stats.totalCurrentMonth)}
        icon={<Calendar size={20} />}
        accentColor="bg-blue-50 text-blue-500"
        trend={
          stats.totalLastMonth > 0
            ? {
                value: formatPercent(stats.monthOverMonthChange),
                direction: momDirection,
              }
            : undefined
        }
      />
      <SummaryCard
        label="Last Month"
        value={formatCurrency(stats.totalLastMonth)}
        icon={<TrendingUp size={20} />}
        accentColor="bg-purple-50 text-purple-500"
      />
      <SummaryCard
        label="Top Category"
        value={stats.topCategory?.category ?? '—'}
        icon={<Tag size={20} />}
        accentColor="bg-orange-50 text-orange-500"
        trend={
          stats.topCategory
            ? {
                value: `${stats.topCategory.percentage.toFixed(0)}% of spend`,
                direction: 'neutral',
              }
            : undefined
        }
      />
    </div>
  )
}
