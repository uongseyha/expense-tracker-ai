'use client'

import { useState } from 'react'
import { Expense } from '@/types/expense'
import { useExpenses } from '@/hooks/useExpenses'
import { useToast } from '@/hooks/useToast'
import { PageHeader } from '@/components/layout/PageHeader'
import { SummaryCards } from '@/components/dashboard/SummaryCards'
import { SpendingChart } from '@/components/dashboard/SpendingChart'
import { CategoryPieChart } from '@/components/dashboard/CategoryPieChart'
import { RecentExpenses } from '@/components/dashboard/RecentExpenses'
import { ExpenseForm } from '@/components/expenses/ExpenseForm'
import { DeleteConfirmDialog } from '@/components/expenses/DeleteConfirmDialog'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { ToastContainer } from '@/components/ui/Toast'
import { Plus } from 'lucide-react'
import { format } from 'date-fns'

export default function DashboardPage() {
  const { expenses, stats, addExpense, updateExpense, deleteExpense } = useExpenses()
  const { toasts, addToast, removeToast } = useToast()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>()
  const [deletingExpense, setDeletingExpense] = useState<Expense | undefined>()

  const handleAdd = (values: Parameters<typeof addExpense>[0]) => {
    addExpense(values)
    setIsAddOpen(false)
    addToast('success', 'Expense added successfully')
  }

  const handleUpdate = (values: Parameters<typeof addExpense>[0]) => {
    if (!editingExpense) return
    updateExpense(editingExpense.id, values)
    setEditingExpense(undefined)
    addToast('success', 'Expense updated')
  }

  const handleDelete = () => {
    if (!deletingExpense) return
    deleteExpense(deletingExpense.id)
    setDeletingExpense(undefined)
    addToast('success', 'Expense deleted')
  }

  const currentMonth = format(new Date(), 'MMMM yyyy')

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={currentMonth}
        action={
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus size={16} />
            Add Expense
          </Button>
        }
      />

      <SummaryCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2">
          <SpendingChart data={stats.monthlyTotals} />
        </div>
        <div>
          <CategoryPieChart data={stats.categoryBreakdown} />
        </div>
      </div>

      <RecentExpenses
        expenses={expenses}
        onEdit={setEditingExpense}
        onDelete={(id) => setDeletingExpense(expenses.find((e) => e.id === id))}
      />

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Expense">
        <ExpenseForm onSubmit={handleAdd} onCancel={() => setIsAddOpen(false)} />
      </Modal>

      <Modal
        isOpen={!!editingExpense}
        onClose={() => setEditingExpense(undefined)}
        title="Edit Expense"
      >
        <ExpenseForm
          expense={editingExpense}
          onSubmit={handleUpdate}
          onCancel={() => setEditingExpense(undefined)}
        />
      </Modal>

      <DeleteConfirmDialog
        isOpen={!!deletingExpense}
        expenseDescription={deletingExpense?.description ?? ''}
        onConfirm={handleDelete}
        onCancel={() => setDeletingExpense(undefined)}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  )
}
