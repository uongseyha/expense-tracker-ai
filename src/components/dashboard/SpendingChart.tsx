'use client'

import dynamic from 'next/dynamic'
import { MonthlyTotal } from '@/types/expense'

const SpendingChartInner = dynamic(
  () => import('./SpendingChartInner').then((m) => m.SpendingChartInner),
  { ssr: false, loading: () => <div className="h-60 animate-pulse bg-gray-100 rounded-lg" /> }
)

interface SpendingChartProps {
  data: MonthlyTotal[]
}

export function SpendingChart({ data }: SpendingChartProps) {
  return (
    <div className="bg-white rounded-card shadow-card p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Spending</h3>
      <SpendingChartInner data={data} />
    </div>
  )
}
