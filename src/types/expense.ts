export type Category =
  | 'Food'
  | 'Transportation'
  | 'Entertainment'
  | 'Shopping'
  | 'Bills'
  | 'Other'

export type SortField = 'date' | 'amount' | 'category' | 'description'
export type SortDirection = 'asc' | 'desc'

export interface Expense {
  id: string
  date: string        // "YYYY-MM-DD"
  amount: number      // stored in cents — $12.50 → 1250
  category: Category
  description: string
  createdAt: string
  updatedAt: string
}

export interface ExpenseFormValues {
  date: string
  amount: string
  category: Category
  description: string
}

export interface ExpenseFilters {
  search: string
  category: Category | 'All'
  dateFrom: string
  dateTo: string
  sortField: SortField
  sortDirection: SortDirection
}

export interface CategorySummary {
  category: Category
  total: number
  count: number
  percentage: number
}

export interface MonthlyTotal {
  month: string   // "2024-05"
  label: string   // "May 2024"
  total: number
  count: number
}

export interface DashboardStats {
  totalAllTime: number
  totalCurrentMonth: number
  totalLastMonth: number
  monthOverMonthChange: number
  topCategory: CategorySummary | null
  categoryBreakdown: CategorySummary[]
  monthlyTotals: MonthlyTotal[]
  expenseCount: number
}
