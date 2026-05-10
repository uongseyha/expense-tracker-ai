import { Expense } from '@/types/expense'
import { startOfMonth, subMonths, format } from 'date-fns'

export type ExportPeriod = 'current-month' | 'last-month' | 'last-3-months' | 'all-time'

export interface ExportTemplate {
  id: string
  name: string
  description: string
  icon: string
  period: ExportPeriod
  format: 'csv' | 'json' | 'pdf'
  accentBg: string
  accentText: string
  accentBorder: string
}

export const EXPORT_TEMPLATES: ExportTemplate[] = [
  {
    id: 'tax-report',
    name: 'Tax Report',
    description: 'Full expense history formatted for tax filing — all categories, all time',
    icon: '🧾',
    period: 'all-time',
    format: 'pdf',
    accentBg: 'bg-green-50',
    accentText: 'text-green-700',
    accentBorder: 'border-green-200',
  },
  {
    id: 'monthly-summary',
    name: 'Monthly Summary',
    description: "This month's spending organized by category and date",
    icon: '📊',
    period: 'current-month',
    format: 'pdf',
    accentBg: 'bg-blue-50',
    accentText: 'text-blue-700',
    accentBorder: 'border-blue-200',
  },
  {
    id: 'category-analysis',
    name: 'Category Analysis',
    description: 'Spending breakdown across categories over the past 3 months',
    icon: '🔍',
    period: 'last-3-months',
    format: 'csv',
    accentBg: 'bg-purple-50',
    accentText: 'text-purple-700',
    accentBorder: 'border-purple-200',
  },
  {
    id: 'full-export',
    name: 'Full Export',
    description: 'Complete raw data with all fields — ideal for importing elsewhere',
    icon: '📦',
    period: 'all-time',
    format: 'json',
    accentBg: 'bg-orange-50',
    accentText: 'text-orange-700',
    accentBorder: 'border-orange-200',
  },
]

export function filterByPeriod(expenses: Expense[], period: ExportPeriod): Expense[] {
  const now = new Date()
  const today = format(now, 'yyyy-MM-dd')

  if (period === 'all-time') return expenses

  if (period === 'current-month') {
    const from = format(startOfMonth(now), 'yyyy-MM-dd')
    return expenses.filter((e) => e.date >= from && e.date <= today)
  }

  if (period === 'last-month') {
    const lastMonth = subMonths(now, 1)
    const from = format(startOfMonth(lastMonth), 'yyyy-MM-dd')
    const to = format(startOfMonth(now), 'yyyy-MM-dd')
    return expenses.filter((e) => e.date >= from && e.date < to)
  }

  if (period === 'last-3-months') {
    const from = format(startOfMonth(subMonths(now, 3)), 'yyyy-MM-dd')
    return expenses.filter((e) => e.date >= from && e.date <= today)
  }

  return expenses
}

export const PERIOD_LABELS: Record<ExportPeriod, string> = {
  'current-month': 'This month',
  'last-month': 'Last month',
  'last-3-months': 'Last 3 months',
  'all-time': 'All time',
}
