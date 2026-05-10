'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { Expense, ExpenseFormValues } from '@/types/expense'
import { CATEGORIES } from '@/constants/categories'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'

const schema = z.object({
  date: z.string().min(1, 'Date is required'),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
      message: 'Amount must be a positive number',
    }),
  category: z.enum(['Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 'Other']),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(200, 'Description must be under 200 characters'),
})

interface ExpenseFormProps {
  expense?: Expense
  onSubmit: (values: ExpenseFormValues) => void
  onCancel: () => void
  isSubmitting?: boolean
}

const categoryOptions = CATEGORIES.map((c) => ({ value: c, label: c }))

export function ExpenseForm({ expense, onSubmit, onCancel, isSubmitting }: ExpenseFormProps) {
  const isEdit = !!expense

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      amount: '',
      category: 'Food',
      description: '',
    },
  })

  useEffect(() => {
    if (expense) {
      reset({
        date: expense.date,
        amount: (expense.amount / 100).toFixed(2),
        category: expense.category,
        description: expense.description,
      })
    }
  }, [expense, reset])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input
        label="Date"
        type="date"
        error={errors.date?.message}
        {...register('date')}
      />
      <Input
        label="Amount ($)"
        type="number"
        step="0.01"
        min="0.01"
        placeholder="0.00"
        error={errors.amount?.message}
        {...register('amount')}
      />
      <Select
        label="Category"
        options={categoryOptions}
        error={errors.category?.message}
        {...register('category')}
      />
      <Input
        label="Description"
        type="text"
        placeholder="What was this expense for?"
        error={errors.description?.message}
        {...register('description')}
      />
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting} className="flex-1">
          {isEdit ? 'Save Changes' : 'Add Expense'}
        </Button>
      </div>
    </form>
  )
}
