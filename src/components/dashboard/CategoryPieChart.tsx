'use client'

import dynamic from 'next/dynamic'
import { CategorySummary } from '@/types/expense'
import { EmptyState } from '@/components/ui/EmptyState'

const CategoryPieChartInner = dynamic(
  () => import('./CategoryPieChartInner').then((m) => m.CategoryPieChartInner),
  { ssr: false, loading: () => <div className="h-52 animate-pulse bg-gray-100 rounded-lg" /> }
)

interface CategoryPieChartProps {
  data: CategorySummary[]
}

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  return (
    <div className="bg-white rounded-card shadow-card p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Spending by Category</h3>
      {data.length === 0 ? (
        <div className="py-8">
          <EmptyState title="No data yet" description="Add expenses to see your category breakdown." />
        </div>
      ) : (
        <CategoryPieChartInner data={data} />
      )}
    </div>
  )
}
