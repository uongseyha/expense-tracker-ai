'use client'

import { useState, useMemo } from 'react'
import { Expense, Category } from '@/types/expense'
import { CATEGORIES, CATEGORY_CONFIG } from '@/constants/categories'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { exportToCSV } from '@/lib/csvExport'
import { exportToPDF } from '@/lib/pdfExport'
import { formatCurrency } from '@/lib/formatters'
import { format } from 'date-fns'
import { Download } from 'lucide-react'

type ExportFormat = 'csv' | 'json' | 'pdf'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  expenses: Expense[]
}

function exportToJSON(expenses: Expense[], filename: string): void {
  const data = expenses.map((e) => ({
    date: e.date,
    category: e.category,
    amount: (e.amount / 100).toFixed(2),
    description: e.description,
  }))
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const FORMAT_LABELS: Record<ExportFormat, string> = { csv: 'CSV', json: 'JSON', pdf: 'PDF' }

export function ExportModal({ isOpen, onClose, expenses }: ExportModalProps) {
  const defaultFilename = `expenses-${format(new Date(), 'yyyy-MM-dd')}`

  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<Set<Category>>(
    () => new Set(CATEGORIES)
  )
  const [filename, setFilename] = useState(defaultFilename)
  const [isExporting, setIsExporting] = useState(false)

  const filteredData = useMemo(
    () =>
      expenses.filter((e) => {
        if (dateFrom && e.date < dateFrom) return false
        if (dateTo && e.date > dateTo) return false
        if (!selectedCategories.has(e.category)) return false
        return true
      }),
    [expenses, dateFrom, dateTo, selectedCategories]
  )

  const totalAmount = useMemo(
    () => filteredData.reduce((sum, e) => sum + e.amount, 0),
    [filteredData]
  )

  const previewRows = filteredData.slice(0, 5)

  const toggleCategory = (cat: Category) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(cat) && next.size > 1) {
        next.delete(cat)
      } else {
        next.add(cat)
      }
      return next
    })
  }

  const handleExport = async () => {
    if (filteredData.length === 0) return
    setIsExporting(true)
    try {
      const name = filename.trim() || defaultFilename
      if (exportFormat === 'csv') exportToCSV(filteredData, `${name}.csv`)
      else if (exportFormat === 'json') exportToJSON(filteredData, name)
      else await exportToPDF(filteredData, name)
      onClose()
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export Data" size="lg">
      {/* Format */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Format</p>
        <div className="flex gap-2">
          {(['csv', 'json', 'pdf'] as ExportFormat[]).map((f) => (
            <button
              key={f}
              onClick={() => setExportFormat(f)}
              className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                exportFormat === f
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {FORMAT_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Date range */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Date Range
        </p>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Category filter */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Categories
        </p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const cfg = CATEGORY_CONFIG[cat]
            const selected = selectedCategories.has(cat)
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  selected
                    ? `${cfg.bgClass} ${cfg.textClass} border-transparent`
                    : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* Preview */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Preview</p>
        {filteredData.length === 0 ? (
          <div className="border border-gray-100 rounded-lg px-4 py-8 text-center text-sm text-gray-400">
            No records match the selected filters
          </div>
        ) : (
          <div className="border border-gray-100 rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  {['Date', 'Category', 'Amount', 'Description'].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2 text-left font-semibold text-gray-500 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {previewRows.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{e.date}</td>
                    <td className="px-3 py-2 text-gray-700">{e.category}</td>
                    <td className="px-3 py-2 text-gray-700 font-mono whitespace-nowrap">
                      ${(e.amount / 100).toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-gray-500 truncate max-w-[160px]">
                      {e.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-2 text-xs text-gray-500">
          <span className="font-semibold text-gray-700">{filteredData.length}</span>{' '}
          record{filteredData.length !== 1 ? 's' : ''}
          {filteredData.length > 0 && (
            <>
              {' '}
              ·{' '}
              <span className="font-semibold text-gray-700">{formatCurrency(totalAmount)}</span>{' '}
              total
            </>
          )}
          {filteredData.length > 5 && ` · showing first 5`}
        </p>
      </div>

      {/* Filename */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Filename
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder={defaultFilename}
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <span className="text-sm text-gray-400 select-none">.{exportFormat}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <Button variant="secondary" onClick={onClose} disabled={isExporting}>
          Cancel
        </Button>
        <Button
          onClick={handleExport}
          isLoading={isExporting}
          disabled={filteredData.length === 0 || isExporting}
        >
          <Download size={15} />
          Export {FORMAT_LABELS[exportFormat]}
        </Button>
      </div>
    </Modal>
  )
}
