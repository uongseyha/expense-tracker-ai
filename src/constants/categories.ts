import { Category } from '@/types/expense'

export const CATEGORIES: Category[] = [
  'Food',
  'Transportation',
  'Entertainment',
  'Shopping',
  'Bills',
  'Other',
]

export const CATEGORY_CONFIG: Record<
  Category,
  { bgClass: string; textClass: string; hex: string; label: string }
> = {
  Food:           { bgClass: 'bg-orange-100', textClass: 'text-orange-700', hex: '#f97316', label: 'Food' },
  Transportation: { bgClass: 'bg-blue-100',   textClass: 'text-blue-700',   hex: '#3b82f6', label: 'Transportation' },
  Entertainment:  { bgClass: 'bg-purple-100', textClass: 'text-purple-700', hex: '#a855f7', label: 'Entertainment' },
  Shopping:       { bgClass: 'bg-pink-100',   textClass: 'text-pink-700',   hex: '#ec4899', label: 'Shopping' },
  Bills:          { bgClass: 'bg-red-100',    textClass: 'text-red-700',    hex: '#ef4444', label: 'Bills' },
  Other:          { bgClass: 'bg-gray-100',   textClass: 'text-gray-600',   hex: '#6b7280', label: 'Other' },
}
