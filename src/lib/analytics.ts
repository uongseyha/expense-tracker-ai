import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { Expense, DashboardStats, CategorySummary, MonthlyTotal, Category } from '@/types/expense'
import { CATEGORIES } from '@/constants/categories'

export function computeStats(expenses: Expense[]): DashboardStats {
  const now = new Date()
  const currentMonthStart = format(startOfMonth(now), 'yyyy-MM-dd')
  const currentMonthEnd = format(endOfMonth(now), 'yyyy-MM-dd')
  const lastMonthStart = format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd')
  const lastMonthEnd = format(endOfMonth(subMonths(now, 1)), 'yyyy-MM-dd')

  const totalAllTime = expenses.reduce((sum, e) => sum + e.amount, 0)

  const currentMonthExpenses = expenses.filter(
    (e) => e.date >= currentMonthStart && e.date <= currentMonthEnd
  )
  const lastMonthExpenses = expenses.filter(
    (e) => e.date >= lastMonthStart && e.date <= lastMonthEnd
  )

  const totalCurrentMonth = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0)
  const totalLastMonth = lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0)

  const monthOverMonthChange =
    totalLastMonth === 0
      ? 0
      : ((totalCurrentMonth - totalLastMonth) / totalLastMonth) * 100

  const categoryBreakdown = computeCategoryBreakdown(expenses)
  const topCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0] : null
  const monthlyTotals = computeMonthlyTotals(expenses, 6)

  return {
    totalAllTime,
    totalCurrentMonth,
    totalLastMonth,
    monthOverMonthChange,
    topCategory,
    categoryBreakdown,
    monthlyTotals,
    expenseCount: expenses.length,
  }
}

export function computeCategoryBreakdown(expenses: Expense[]): CategorySummary[] {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0)

  const map = new Map<Category, { total: number; count: number }>()
  for (const cat of CATEGORIES) {
    map.set(cat, { total: 0, count: 0 })
  }

  for (const e of expenses) {
    const entry = map.get(e.category)!
    entry.total += e.amount
    entry.count += 1
  }

  return Array.from(map.entries())
    .filter(([, v]) => v.total > 0)
    .map(([category, v]) => ({
      category,
      total: v.total,
      count: v.count,
      percentage: total > 0 ? (v.total / total) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total)
}

export function computeMonthlyTotals(expenses: Expense[], months: number): MonthlyTotal[] {
  const now = new Date()
  const result: MonthlyTotal[] = []

  for (let i = months - 1; i >= 0; i--) {
    const date = subMonths(now, i)
    const monthKey = format(date, 'yyyy-MM')
    const monthStart = format(startOfMonth(date), 'yyyy-MM-dd')
    const monthEnd = format(endOfMonth(date), 'yyyy-MM-dd')

    const monthExpenses = expenses.filter(
      (e) => e.date >= monthStart && e.date <= monthEnd
    )

    result.push({
      month: monthKey,
      label: format(date, 'MMM'),
      total: monthExpenses.reduce((sum, e) => sum + e.amount, 0),
      count: monthExpenses.length,
    })
  }

  return result
}
