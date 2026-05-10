import { Expense } from '@/types/expense'

const KEY = 'expense-tracker-expenses'

export const storage = {
  getExpenses(): Expense[] {
    if (typeof window === 'undefined') return []
    try {
      const raw = localStorage.getItem(KEY)
      return raw ? (JSON.parse(raw) as Expense[]) : []
    } catch {
      return []
    }
  },

  setExpenses(expenses: Expense[]): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(KEY, JSON.stringify(expenses))
  },

  clear(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(KEY)
  },
}
