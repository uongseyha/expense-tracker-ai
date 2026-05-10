import { Expense } from '@/types/expense'
import { ExpenseRow } from './ExpenseRow'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { Download } from 'lucide-react'
import { formatCurrency } from '@/lib/formatters'

interface ExpenseListProps {
  expenses: Expense[]
  onEdit: (expense: Expense) => void
  onDelete: (id: string) => void
  onExport: () => void
  onAdd: () => void
}

export function ExpenseList({ expenses, onEdit, onDelete, onExport, onAdd }: ExpenseListProps) {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0)

  if (expenses.length === 0) {
    return (
      <div className="bg-white rounded-card shadow-card">
        <EmptyState
          title="No expenses found"
          description="Try adjusting your filters or add your first expense."
          action={
            <Button onClick={onAdd}>Add Expense</Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-card shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <p className="text-sm text-gray-500">
          Total:{' '}
          <span className="font-semibold text-gray-900 font-mono">{formatCurrency(total)}</span>
        </p>
        <Button variant="secondary" size="sm" onClick={onExport}>
          <Download size={15} />
          Export Data
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Description
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Category
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                Amount
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {expenses.map((expense) => (
              <ExpenseRow
                key={expense.id}
                expense={expense}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
