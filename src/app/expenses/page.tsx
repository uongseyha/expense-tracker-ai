'use client'

import { useState } from 'react'
import { Expense } from '@/types/expense'
import { useExpenses } from '@/hooks/useExpenses'
import { useToast } from '@/hooks/useToast'
import { PageHeader } from '@/components/layout/PageHeader'
import { ExpenseList } from '@/components/expenses/ExpenseList'
import { ExpenseFilters } from '@/components/expenses/ExpenseFilters'
import { ExpenseForm } from '@/components/expenses/ExpenseForm'
import { DeleteConfirmDialog } from '@/components/expenses/DeleteConfirmDialog'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { ToastContainer } from '@/components/ui/Toast'
import { Plus } from 'lucide-react'

export default function ExpensesPage() {
  const {
    expenses,
    filteredExpenses,
    filters,
    setFilters,
    resetFilters,
    addExpense,
    updateExpense,
    deleteExpense,
    exportToCSV,
  } = useExpenses()

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
    addToast('success', 'Expense updated successfully')
  }

  const handleDelete = () => {
    if (!deletingExpense) return
    deleteExpense(deletingExpense.id)
    setDeletingExpense(undefined)
    addToast('success', 'Expense deleted')
  }

  return (
    <>
      <PageHeader
        title="Expenses"
        subtitle="Manage and track all your expenses"
        action={
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus size={16} />
            Add Expense
          </Button>
        }
      />

      <ExpenseFilters
        filters={filters}
        onChange={setFilters}
        onReset={resetFilters}
        totalCount={expenses.length}
        filteredCount={filteredExpenses.length}
      />

      <ExpenseList
        expenses={filteredExpenses}
        onEdit={setEditingExpense}
        onDelete={(id) => setDeletingExpense(expenses.find((e) => e.id === id))}
        onExport={() => exportToCSV({ filtered: true })}
        onAdd={() => setIsAddOpen(true)}
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
