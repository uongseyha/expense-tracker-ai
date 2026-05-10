'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Expense } from '@/types/expense'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { exportToCSV } from '@/lib/csvExport'
import { exportToPDF } from '@/lib/pdfExport'
import { formatCurrency, formatDate } from '@/lib/formatters'
import {
  EXPORT_TEMPLATES,
  filterByPeriod,
  PERIOD_LABELS,
  ExportTemplate,
} from '@/lib/exportTemplates'
import {
  historyStorage,
  scheduleStorage,
  ExportRecord,
  ScheduleConfig,
  DEFAULT_SCHEDULE,
} from '@/lib/cloudExportStorage'
import { format, addDays, addWeeks, addMonths, setDate, startOfDay } from 'date-fns'
import {
  Download,
  Mail,
  Cloud,
  Clock,
  History,
  Share2,
  CheckCircle,
  Copy,
  Loader2,
  Trash2,
  CalendarClock,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  QrCode,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Tab = 'export' | 'schedule' | 'history' | 'share'

interface CloudExportHubProps {
  isOpen: boolean
  onClose: () => void
  expenses: Expense[]
}

const CLOUD_DESTINATIONS = [
  { id: 'google-sheets', label: 'Google Sheets', icon: '📊', color: 'text-green-600' },
  { id: 'dropbox', label: 'Dropbox', icon: '📦', color: 'text-blue-600' },
  { id: 'onedrive', label: 'OneDrive', icon: '☁️', color: 'text-sky-600' },
  { id: 'notion', label: 'Notion', icon: '📝', color: 'text-gray-700' },
]

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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

function computeNextRun(cfg: ScheduleConfig): string {
  if (!cfg.enabled) return '—'
  const now = new Date()
  const [h, m] = cfg.time.split(':').map(Number)
  let next: Date
  if (cfg.frequency === 'daily') {
    next = startOfDay(addDays(now, 1))
    next.setHours(h, m)
  } else if (cfg.frequency === 'weekly') {
    const diff = (cfg.dayOfWeek - now.getDay() + 7) % 7 || 7
    next = startOfDay(addDays(now, diff))
    next.setHours(h, m)
  } else {
    next = startOfDay(addMonths(now, 1))
    next = setDate(next, cfg.dayOfMonth)
    next.setHours(h, m)
  }
  return format(next, "EEE, MMM d 'at' h:mm a")
}

export function CloudExportHub({ isOpen, onClose, expenses }: CloudExportHubProps) {
  const [activeTab, setActiveTab] = useState<Tab>('export')

  // Export tab
  const [selectedTemplateId, setSelectedTemplateId] = useState('monthly-summary')
  const [isExporting, setIsExporting] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const [isEmailSending, setIsEmailSending] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [connectingId, setConnectingId] = useState<string | null>(null)
  const [connectedServices, setConnectedServices] = useState<Set<string>>(new Set())

  // Schedule tab
  const [schedule, setSchedule] = useState<ScheduleConfig>(DEFAULT_SCHEDULE)
  const [scheduleSaved, setScheduleSaved] = useState(false)

  // History tab
  const [history, setHistory] = useState<ExportRecord[]>([])

  // Share tab
  const [shareLink, setShareLink] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [shareExpiry, setShareExpiry] = useState('7d')
  const [copied, setCopied] = useState(false)
  const [isGeneratingShare, setIsGeneratingShare] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setHistory(historyStorage.get())
      setSchedule(scheduleStorage.get())
      setEmailSent(false)
      setShareLink(null)
      setQrDataUrl(null)
      setCopied(false)
    }
  }, [isOpen])

  const selectedTemplate = useMemo(
    () => EXPORT_TEMPLATES.find((t) => t.id === selectedTemplateId)!,
    [selectedTemplateId]
  )

  const templateExpenses = useMemo(
    () => filterByPeriod(expenses, selectedTemplate.period),
    [expenses, selectedTemplate]
  )

  const defaultFilename = `${selectedTemplate.id}-${format(new Date(), 'yyyy-MM-dd')}`

  // --- Export handlers ---

  const runDownloadExport = useCallback(
    async (template: ExportTemplate, data: Expense[]) => {
      const name = defaultFilename
      if (template.format === 'csv') exportToCSV(data, `${name}.csv`)
      else if (template.format === 'json') exportToJSON(data, name)
      else await exportToPDF(data, name)
    },
    [defaultFilename]
  )

  const handleDownload = async () => {
    if (templateExpenses.length === 0) return
    setIsExporting(true)
    try {
      await runDownloadExport(selectedTemplate, templateExpenses)
      historyStorage.add({
        templateName: selectedTemplate.name,
        destination: 'Download',
        format: selectedTemplate.format.toUpperCase(),
        recordCount: templateExpenses.length,
        status: 'completed',
      })
      setHistory(historyStorage.get())
    } finally {
      setIsExporting(false)
    }
  }

  const handleEmailSend = async () => {
    if (!emailInput.trim() || templateExpenses.length === 0) return
    setIsEmailSending(true)
    await new Promise((r) => setTimeout(r, 1800))
    setIsEmailSending(false)
    setEmailSent(true)
    historyStorage.add({
      templateName: selectedTemplate.name,
      destination: `Email → ${emailInput}`,
      format: selectedTemplate.format.toUpperCase(),
      recordCount: templateExpenses.length,
      status: 'simulated',
    })
    setHistory(historyStorage.get())
  }

  const handleCloudConnect = async (serviceId: string) => {
    setConnectingId(serviceId)
    await new Promise((r) => setTimeout(r, 1200))
    setConnectingId(null)
    setConnectedServices((prev) => new Set(Array.from(prev).concat(serviceId)))
  }

  const handleCloudExport = async (serviceId: string) => {
    const svc = CLOUD_DESTINATIONS.find((d) => d.id === serviceId)!
    setIsExporting(true)
    await new Promise((r) => setTimeout(r, 1000))
    setIsExporting(false)
    historyStorage.add({
      templateName: selectedTemplate.name,
      destination: svc.label,
      format: selectedTemplate.format.toUpperCase(),
      recordCount: templateExpenses.length,
      status: 'simulated',
    })
    setHistory(historyStorage.get())
  }

  // --- Schedule handler ---

  const handleSaveSchedule = () => {
    scheduleStorage.save(schedule)
    setScheduleSaved(true)
    setTimeout(() => setScheduleSaved(false), 2500)
  }

  // --- Share handler ---

  const handleGenerateShare = async () => {
    setIsGeneratingShare(true)
    const token = Array.from(crypto.getRandomValues(new Uint8Array(5)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
    const link = `https://exptracker.app/s/${token}`
    setShareLink(link)
    try {
      const QRCode = (await import('qrcode')).default
      const dataUrl = await QRCode.toDataURL(link, { width: 160, margin: 1, color: { dark: '#4f46e5' } })
      setQrDataUrl(dataUrl)
    } catch {
      // QR generation failed silently — link still usable
    }
    setIsGeneratingShare(false)
  }

  const handleCopy = () => {
    if (!shareLink) return
    navigator.clipboard.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // --- Tab nav ---

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'export', label: 'Export', icon: <Download size={14} /> },
    { id: 'schedule', label: 'Schedule', icon: <CalendarClock size={14} /> },
    { id: 'history', label: 'History', icon: <History size={14} /> },
    { id: 'share', label: 'Share', icon: <Share2 size={14} /> },
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cloud Export Hub" size="lg">
      {/* Tab bar */}
      <div className="flex gap-1 mb-5 bg-gray-50 p-1 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-sm font-medium transition-all',
              activeTab === tab.id
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── EXPORT TAB ── */}
      {activeTab === 'export' && (
        <div className="space-y-5">
          {/* Template picker */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Template
            </p>
            <div className="grid grid-cols-2 gap-2">
              {EXPORT_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplateId(t.id)}
                  className={cn(
                    'text-left p-3 rounded-lg border transition-all',
                    selectedTemplateId === t.id
                      ? `${t.accentBg} ${t.accentBorder} ${t.accentText}`
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  )}
                >
                  <div className="text-lg mb-1">{t.icon}</div>
                  <div className="font-semibold text-sm leading-tight">{t.name}</div>
                  <div className="text-xs mt-0.5 opacity-70">{PERIOD_LABELS[t.period]}</div>
                  <div className="mt-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/60 border border-current/20">
                      {t.format}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Record count */}
          <div className={cn('px-3 py-2 rounded-lg text-sm', selectedTemplate.accentBg)}>
            <span className={cn('font-semibold', selectedTemplate.accentText)}>
              {templateExpenses.length} records
            </span>
            <span className="text-gray-500"> · </span>
            <span className="text-gray-600">{formatCurrency(templateExpenses.reduce((s, e) => s + e.amount, 0))}</span>
            <span className="text-gray-400 text-xs ml-1">({selectedTemplate.description})</span>
          </div>

          {/* Download */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Download Directly
            </p>
            <Button
              onClick={handleDownload}
              isLoading={isExporting}
              disabled={templateExpenses.length === 0}
              className="w-full justify-center"
            >
              <Download size={15} />
              Download {selectedTemplate.name} ({selectedTemplate.format.toUpperCase()})
            </Button>
          </div>

          {/* Email */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Send via Email
            </p>
            {emailSent ? (
              <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                <CheckCircle size={16} />
                Sent to <span className="font-medium">{emailInput}</span>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="recipient@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <Button
                  variant="secondary"
                  onClick={handleEmailSend}
                  isLoading={isEmailSending}
                  disabled={!emailInput.trim() || templateExpenses.length === 0}
                >
                  <Mail size={15} />
                  Send
                </Button>
              </div>
            )}
          </div>

          {/* Cloud integrations */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Cloud Integrations
            </p>
            <div className="space-y-2">
              {CLOUD_DESTINATIONS.map((svc) => {
                const connected = connectedServices.has(svc.id)
                const connecting = connectingId === svc.id
                return (
                  <div
                    key={svc.id}
                    className="flex items-center justify-between px-3 py-2.5 border border-gray-200 rounded-lg bg-white"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{svc.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{svc.label}</p>
                        {connected && (
                          <p className="text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle size={10} /> Connected
                          </p>
                        )}
                      </div>
                    </div>
                    {connected ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleCloudExport(svc.id)}
                        isLoading={isExporting}
                        disabled={templateExpenses.length === 0}
                      >
                        <ExternalLink size={13} />
                        Export
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCloudConnect(svc.id)}
                        isLoading={connecting}
                      >
                        <Cloud size={13} />
                        Connect
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── SCHEDULE TAB ── */}
      {activeTab === 'schedule' && (
        <div className="space-y-5">
          {/* Enable toggle */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-semibold text-gray-800">Automatic Exports</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Export your data automatically on a schedule
              </p>
            </div>
            <button
              onClick={() => setSchedule((s) => ({ ...s, enabled: !s.enabled }))}
              className={cn(
                'transition-colors',
                schedule.enabled ? 'text-primary-600' : 'text-gray-400'
              )}
            >
              {schedule.enabled ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
            </button>
          </div>

          <div className={cn('space-y-4', !schedule.enabled && 'opacity-40 pointer-events-none')}>
            {/* Frequency */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Frequency
              </p>
              <div className="flex gap-2">
                {(['daily', 'weekly', 'monthly'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setSchedule((s) => ({ ...s, frequency: f }))}
                    className={cn(
                      'flex-1 py-2 text-sm font-medium rounded-lg border capitalize transition-colors',
                      schedule.frequency === f
                        ? 'bg-primary-50 border-primary-500 text-primary-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Day of week (weekly) */}
            {schedule.frequency === 'weekly' && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Day of Week
                </p>
                <div className="flex gap-1">
                  {DAY_NAMES.map((d, i) => (
                    <button
                      key={d}
                      onClick={() => setSchedule((s) => ({ ...s, dayOfWeek: i }))}
                      className={cn(
                        'flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors',
                        schedule.dayOfWeek === i
                          ? 'bg-primary-500 border-primary-500 text-white'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Day of month (monthly) */}
            {schedule.frequency === 'monthly' && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Day of Month
                </p>
                <input
                  type="number"
                  min={1}
                  max={28}
                  value={schedule.dayOfMonth}
                  onChange={(e) =>
                    setSchedule((s) => ({ ...s, dayOfMonth: Math.min(28, Math.max(1, +e.target.value)) }))
                  }
                  className="w-24 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            )}

            {/* Time */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Time
              </p>
              <input
                type="time"
                value={schedule.time}
                onChange={(e) => setSchedule((s) => ({ ...s, time: e.target.value }))}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Template */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Template
              </p>
              <select
                value={schedule.templateId}
                onChange={(e) => setSchedule((s) => ({ ...s, templateId: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                {EXPORT_TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.icon} {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Email destination */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Delivery Email
              </p>
              <input
                type="email"
                placeholder="your@email.com"
                value={schedule.email}
                onChange={(e) => setSchedule((s) => ({ ...s, email: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Next run */}
            <div className="flex items-center gap-2 text-sm text-gray-500 px-3 py-2 bg-gray-50 rounded-lg">
              <Clock size={14} className="shrink-0" />
              <span>Next export: <span className="text-gray-800 font-medium">{computeNextRun(schedule)}</span></span>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <Button onClick={handleSaveSchedule} className="flex-1 justify-center">
              Save Schedule
            </Button>
            {scheduleSaved && (
              <span className="flex items-center gap-1.5 text-sm text-green-600">
                <CheckCircle size={15} /> Saved
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {activeTab === 'history' && (
        <div>
          {history.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <History size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No exports yet</p>
              <p className="text-xs mt-1">Your export history will appear here</p>
            </div>
          ) : (
            <>
              <div className="space-y-2 mb-4">
                {history.map((rec) => (
                  <div
                    key={rec.id}
                    className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-lg"
                  >
                    <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                      <Download size={13} className="text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {rec.templateName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {rec.destination} · {rec.recordCount} records · {rec.format}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-400">
                        {format(new Date(rec.timestamp), 'MMM d, h:mm a')}
                      </p>
                      <span
                        className={cn(
                          'text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded',
                          rec.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        )}
                      >
                        {rec.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  historyStorage.clear()
                  setHistory([])
                }}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 size={14} />
                Clear history
              </Button>
            </>
          )}
        </div>
      )}

      {/* ── SHARE TAB ── */}
      {activeTab === 'share' && (
        <div className="space-y-5">
          {/* Expiry */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Link Expiry
            </p>
            <div className="flex gap-2">
              {[
                { value: '24h', label: '24 hours' },
                { value: '7d', label: '7 days' },
                { value: '30d', label: '30 days' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setShareExpiry(opt.value)}
                  className={cn(
                    'flex-1 py-2 text-sm font-medium rounded-lg border transition-colors',
                    shareExpiry === opt.value
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generate / Link display */}
          {!shareLink ? (
            <Button
              onClick={handleGenerateShare}
              isLoading={isGeneratingShare}
              disabled={expenses.length === 0}
              className="w-full justify-center"
            >
              <Share2 size={15} />
              Generate Share Link
            </Button>
          ) : (
            <>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Share Link
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 font-mono truncate">
                    {shareLink}
                  </div>
                  <Button variant="secondary" size="sm" onClick={handleCopy}>
                    {copied ? <CheckCircle size={14} className="text-green-600" /> : <Copy size={14} />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  Expires in {shareExpiry === '24h' ? '24 hours' : shareExpiry === '7d' ? '7 days' : '30 days'}
                </p>
              </div>

              {/* QR code */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  QR Code
                </p>
                <div className="flex items-center gap-4">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="QR code for share link"
                      className="w-20 h-20 rounded-lg border border-gray-100"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-lg border border-gray-100 flex items-center justify-center bg-gray-50">
                      <QrCode size={28} className="text-gray-300" />
                    </div>
                  )}
                  <div className="text-sm text-gray-500">
                    <p>Scan to open the shared report on any device.</p>
                    <p className="text-xs mt-1 text-gray-400">
                      Contains {expenses.length} records
                    </p>
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShareLink(null)
                  setQrDataUrl(null)
                }}
              >
                Generate new link
              </Button>
            </>
          )}

          {/* Sync status indicators */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Cloud Sync Status
            </p>
            <div className="space-y-2">
              {CLOUD_DESTINATIONS.map((svc) => {
                const connected = connectedServices.has(svc.id)
                return (
                  <div
                    key={svc.id}
                    className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span>{svc.icon}</span>
                      <span className="text-sm text-gray-700">{svc.label}</span>
                    </div>
                    <span
                      className={cn(
                        'text-xs font-medium px-2 py-0.5 rounded-full',
                        connected
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-200 text-gray-500'
                      )}
                    >
                      {connected ? '● Synced' : '○ Not connected'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
