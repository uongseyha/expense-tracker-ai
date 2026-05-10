import { Expense } from '@/types/expense'
import { format } from 'date-fns'

function escapeCSVField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function exportToCSV(expenses: Expense[], filename?: string): void {
  const headers = ['Date', 'Description', 'Category', 'Amount (USD)']

  const rows = expenses.map((e) => [
    e.date,
    escapeCSVField(e.description),
    e.category,
    (e.amount / 100).toFixed(2),
  ])

  const csvContent =
    '﻿' + // UTF-8 BOM for Excel
    [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename ?? `expenses-${format(new Date(), 'yyyy-MM-dd')}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
