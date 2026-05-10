import Link from 'next/link'
import { Expense } from '@/types/expense'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { ArrowRight, Pencil, Trash2 } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'

interface RecentExpensesProps {
  expenses: Expense[]
  onEdit: (expense: Expense) => void
  onDelete: (id: string) => void
}

export function RecentExpenses({ expenses, onEdit, onDelete }: RecentExpensesProps) {
  const recent = expenses.slice(0, 5)

  return (
    <div className="bg-white rounded-card shadow-card">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700">Recent Expenses</h3>
        <Link href="/expenses">
          <Button variant="ghost" size="sm">
            View all <ArrowRight size={14} />
          </Button>
        </Link>
      </div>
      {recent.length === 0 ? (
        <div className="py-8">
          <EmptyState
            title="No expenses yet"
            description="Add your first expense to get started."
          />
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {recent.map((expense) => (
            <div key={expense.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{expense.description}</p>
                <p className="text-xs text-gray-400">{formatDate(expense.date)}</p>
              </div>
              <Badge category={expense.category} />
              <p className="text-sm font-semibold text-gray-900 font-mono shrink-0">
                {formatCurrency(expense.amount)}
              </p>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => onEdit(expense)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => onDelete(expense.id)}
                  className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
