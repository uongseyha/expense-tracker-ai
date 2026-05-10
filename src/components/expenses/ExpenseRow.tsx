import { Expense } from '@/types/expense'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { Pencil, Trash2 } from 'lucide-react'

interface ExpenseRowProps {
  expense: Expense
  onEdit: (expense: Expense) => void
  onDelete: (id: string) => void
}

export function ExpenseRow({ expense, onEdit, onDelete }: ExpenseRowProps) {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
        {formatDate(expense.date)}
      </td>
      <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
        {expense.description}
      </td>
      <td className="px-4 py-3">
        <Badge category={expense.category} />
      </td>
      <td className="px-4 py-3 text-sm font-semibold text-gray-900 font-mono whitespace-nowrap text-right">
        {formatCurrency(expense.amount)}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(expense)}
            aria-label="Edit expense"
          >
            <Pencil size={15} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(expense.id)}
            aria-label="Delete expense"
            className="text-red-400 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 size={15} />
          </Button>
        </div>
      </td>
    </tr>
  )
}
