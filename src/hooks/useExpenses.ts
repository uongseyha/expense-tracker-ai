'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Expense, ExpenseFormValues, ExpenseFilters, DashboardStats } from '@/types/expense'
import { storage } from '@/lib/storage'
import { parseCentsFromString } from '@/lib/formatters'
import { computeStats } from '@/lib/analytics'
import { exportToCSV as csvExport } from '@/lib/csvExport'

const DEFAULT_FILTERS: ExpenseFilters = {
  search: '',
  category: 'All',
  dateFrom: '',
  dateTo: '',
  sortField: 'date',
  sortDirection: 'desc',
}

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFiltersState] = useState<ExpenseFilters>(DEFAULT_FILTERS)

  useEffect(() => {
    setExpenses(storage.getExpenses())
    setIsLoading(false)
  }, [])

  const persist = useCallback((updated: Expense[]) => {
    storage.setExpenses(updated)
    setExpenses(updated)
  }, [])

  const addExpense = useCallback(
    (values: ExpenseFormValues) => {
      const now = new Date().toISOString()
      const expense: Expense = {
        id: crypto.randomUUID(),
        date: values.date,
        amount: parseCentsFromString(values.amount),
        category: values.category,
        description: values.description.trim(),
        createdAt: now,
        updatedAt: now,
      }
      persist([expense, ...expenses])
    },
    [expenses, persist]
  )

  const updateExpense = useCallback(
    (id: string, values: ExpenseFormValues) => {
      const updated = expenses.map((e) =>
        e.id === id
          ? {
              ...e,
              date: values.date,
              amount: parseCentsFromString(values.amount),
              category: values.category,
              description: values.description.trim(),
              updatedAt: new Date().toISOString(),
            }
          : e
      )
      persist(updated)
    },
    [expenses, persist]
  )

  const deleteExpense = useCallback(
    (id: string) => {
      persist(expenses.filter((e) => e.id !== id))
    },
    [expenses, persist]
  )

  const clearAllExpenses = useCallback(() => {
    storage.clear()
    setExpenses([])
  }, [])

  const setFilters = useCallback((partial: Partial<ExpenseFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...partial }))
  }, [])

  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS)
  }, [])

  const filteredExpenses = useMemo(() => {
    let result = [...expenses]

    if (filters.search) {
      const q = filters.search.toLowerCase()
      result = result.filter(
        (e) =>
          e.description.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q)
      )
    }

    if (filters.category !== 'All') {
      result = result.filter((e) => e.category === filters.category)
    }

    if (filters.dateFrom) {
      result = result.filter((e) => e.date >= filters.dateFrom)
    }

    if (filters.dateTo) {
      result = result.filter((e) => e.date <= filters.dateTo)
    }

    result.sort((a, b) => {
      let cmp = 0
      if (filters.sortField === 'amount') {
        cmp = a.amount - b.amount
      } else if (filters.sortField === 'date') {
        cmp = a.date.localeCompare(b.date)
      } else {
        cmp = a[filters.sortField].localeCompare(b[filters.sortField])
      }
      return filters.sortDirection === 'desc' ? -cmp : cmp
    })

    return result
  }, [expenses, filters])

  const stats: DashboardStats = useMemo(() => computeStats(expenses), [expenses])

  const exportToCSV = useCallback(
    (opts?: { filtered?: boolean }) => {
      const data = opts?.filtered === false ? expenses : filteredExpenses
      csvExport(data)
    },
    [expenses, filteredExpenses]
  )

  return {
    expenses,
    isLoading,
    addExpense,
    updateExpense,
    deleteExpense,
    clearAllExpenses,
    stats,
    filteredExpenses,
    filters,
    setFilters,
    resetFilters,
    exportToCSV,
  }
}
