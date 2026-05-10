export interface ExportRecord {
  id: string
  templateName: string
  destination: string
  format: string
  timestamp: string
  recordCount: number
  status: 'completed' | 'simulated'
}

export interface ScheduleConfig {
  enabled: boolean
  frequency: 'daily' | 'weekly' | 'monthly'
  dayOfWeek: number   // 0 = Sunday
  dayOfMonth: number  // 1–31
  time: string        // "HH:MM"
  templateId: string
  destination: string
  email: string
}

export const DEFAULT_SCHEDULE: ScheduleConfig = {
  enabled: false,
  frequency: 'monthly',
  dayOfWeek: 1,
  dayOfMonth: 1,
  time: '09:00',
  templateId: 'monthly-summary',
  destination: 'email',
  email: '',
}

const HISTORY_KEY = 'expense-tracker-export-history'
const SCHEDULE_KEY = 'expense-tracker-export-schedule'

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export const historyStorage = {
  get(): ExportRecord[] {
    return safeGet<ExportRecord[]>(HISTORY_KEY, [])
  },
  add(record: Omit<ExportRecord, 'id' | 'timestamp'>): void {
    const full: ExportRecord = {
      ...record,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    }
    const history = historyStorage.get()
    localStorage.setItem(HISTORY_KEY, JSON.stringify([full, ...history].slice(0, 50)))
  },
  clear(): void {
    if (typeof window !== 'undefined') localStorage.removeItem(HISTORY_KEY)
  },
}

export const scheduleStorage = {
  get(): ScheduleConfig {
    return safeGet<ScheduleConfig>(SCHEDULE_KEY, DEFAULT_SCHEDULE)
  },
  save(config: ScheduleConfig): void {
    if (typeof window !== 'undefined')
      localStorage.setItem(SCHEDULE_KEY, JSON.stringify(config))
  },
}
