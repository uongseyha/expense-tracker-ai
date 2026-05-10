import { Category } from '@/types/expense'
import { CATEGORY_CONFIG } from '@/constants/categories'
import { cn } from '@/lib/utils'

interface BadgeProps {
  category: Category
  className?: string
}

export function Badge({ category, className }: BadgeProps) {
  const { bgClass, textClass, label } = CATEGORY_CONFIG[category]
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        bgClass,
        textClass,
        className
      )}
    >
      {label}
    </span>
  )
}
