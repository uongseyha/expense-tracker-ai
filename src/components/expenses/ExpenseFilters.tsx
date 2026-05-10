'use client'

import { ExpenseFilters as FiltersType } from '@/types/expense'
import { CATEGORIES } from '@/constants/categories'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Search, X } from 'lucide-react'

interface ExpenseFiltersProps {
  filters: FiltersType
  onChange: (partial: Partial<FiltersType>) => void
  onReset: () => void
  totalCount: number
  filteredCount: number
}

const categoryOptions = [
  { value: 'All', label: 'All Categories' },
  ...CATEGORIES.map((c) => ({ value: c, label: c })),
]

const sortOptions = [
  { value: 'date|desc', label: 'Date (Newest)' },
  { value: 'date|asc', label: 'Date (Oldest)' },
  { value: 'amount|desc', label: 'Amount (High → Low)' },
  { value: 'amount|asc', label: 'Amount (Low → High)' },
  { value: 'category|asc', label: 'Category (A → Z)' },
  { value: 'description|asc', label: 'Description (A → Z)' },
]

export function ExpenseFilters({
  filters,
  onChange,
  onReset,
  totalCount,
  filteredCount,
}: ExpenseFiltersProps) {
  const sortValue = `${filters.sortField}|${filters.sortDirection}`
  const hasActiveFilters =
    filters.search || filters.category !== 'All' || filters.dateFrom || filters.dateTo

  return (
    <div className="bg-white rounded-card shadow-card p-4 mb-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none mt-px" style={{top: 'calc(50% + 2px)'}} />
          <input
            type="text"
            placeholder="Search expenses..."
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <Select
          options={categoryOptions}
          value={filters.category}
          onChange={(e) => onChange({ category: e.target.value as FiltersType['category'] })}
        />
        <div className="flex gap-2">
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => onChange({ dateFrom: e.target.value })}
            placeholder="From"
            title="From date"
          />
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => onChange({ dateTo: e.target.value })}
            placeholder="To"
            title="To date"
          />
        </div>
        <Select
          options={sortOptions}
          value={sortValue}
          onChange={(e) => {
            const [sortField, sortDirection] = e.target.value.split('|') as [
              FiltersType['sortField'],
              FiltersType['sortDirection']
            ]
            onChange({ sortField, sortDirection })
          }}
        />
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          Showing <span className="font-medium text-gray-700">{filteredCount}</span> of{' '}
          <span className="font-medium text-gray-700">{totalCount}</span> expenses
        </p>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            <X size={14} />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  )
}
