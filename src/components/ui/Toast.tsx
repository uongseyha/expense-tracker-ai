'use client'

import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import { ToastMessage } from '@/hooks/useToast'
import { cn } from '@/lib/utils'

const icons = {
  success: <CheckCircle className="w-5 h-5 text-green-500" />,
  error: <XCircle className="w-5 h-5 text-red-500" />,
  info: <Info className="w-5 h-5 text-blue-500" />,
}

const borderColors = {
  success: 'border-green-200',
  error: 'border-red-200',
  info: 'border-blue-200',
}

interface ToastContainerProps {
  toasts: ToastMessage[]
  onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'pointer-events-auto flex items-start gap-3 bg-white rounded-lg shadow-modal',
            'border px-4 py-3 min-w-[280px] max-w-sm',
            'animate-in slide-in-from-right-5 fade-in duration-200',
            borderColors[toast.type]
          )}
        >
          {icons[toast.type]}
          <p className="flex-1 text-sm text-gray-800">{toast.message}</p>
          <button
            onClick={() => onRemove(toast.id)}
            className="text-gray-400 hover:text-gray-600 mt-0.5"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}
