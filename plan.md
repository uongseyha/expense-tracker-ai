# Plan: NextJS 14 Expense Tracker Application

## Context

Building a complete, production-ready expense tracking SPA from scratch in the empty `expense-tracker-ai` directory. The spec is in `agent.md`. No backend — all data persists in localStorage. The app needs a dashboard with analytics charts, full CRUD on expenses, search/filter, and CSV export.

---

## Step 0 — Project Scaffold

```bash
cd "D:\Udemy\AI\AI Coder - Vibe Coder\expense-tracker-ai"
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
npm install recharts react-hook-form zod @hookform/resolvers react-day-picker date-fns lucide-react clsx tailwind-merge
```

> **Note:** `create-next-app` was scaffolded manually (directory had existing files). `next.config.ts` is not supported in Next.js 14 — use `next.config.js` instead.

---

## File Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout: Navbar
│   ├── page.tsx            # Redirect → /dashboard
│   ├── globals.css         # Tailwind directives + Inter font
│   ├── dashboard/page.tsx  # Dashboard (client component)
│   └── expenses/page.tsx   # Expense list (client component)
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   └── PageHeader.tsx
│   ├── dashboard/
│   │   ├── SummaryCard.tsx
│   │   ├── SummaryCards.tsx
│   │   ├── SpendingChart.tsx          # dynamic import wrapper, ssr:false
│   │   ├── SpendingChartInner.tsx     # actual Recharts BarChart
│   │   ├── CategoryPieChart.tsx       # dynamic import wrapper, ssr:false
│   │   ├── CategoryPieChartInner.tsx  # actual Recharts PieChart (donut)
│   │   └── RecentExpenses.tsx
│   ├── expenses/
│   │   ├── ExpenseForm.tsx            # react-hook-form + zod, add/edit modes
│   │   ├── ExpenseList.tsx
│   │   ├── ExpenseRow.tsx
│   │   ├── ExpenseFilters.tsx
│   │   └── DeleteConfirmDialog.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Select.tsx
│       ├── Modal.tsx
│       ├── Badge.tsx
│       ├── EmptyState.tsx
│       └── Toast.tsx
├── hooks/
│   ├── useExpenses.ts     # Core hook: CRUD + localStorage + filters + stats
│   └── useToast.ts
├── lib/
│   ├── storage.ts         # localStorage get/set helpers
│   ├── formatters.ts      # formatCurrency, formatDate, formatPercent, parseCentsFromString
│   ├── analytics.ts       # computeStats, computeCategoryBreakdown, computeMonthlyTotals
│   ├── csvExport.ts       # CSV generator + browser download trigger
│   └── utils.ts           # cn() helper (clsx + tailwind-merge)
├── types/expense.ts       # All TypeScript interfaces
└── constants/categories.ts
```

---

## Data Model (`src/types/expense.ts`)

```typescript
export type Category = 'Food' | 'Transportation' | 'Entertainment' | 'Shopping' | 'Bills' | 'Other'

export interface Expense {
  id: string          // crypto.randomUUID()
  date: string        // "YYYY-MM-DD"
  amount: number      // stored in CENTS (integer) — $12.50 → 1250
  category: Category
  description: string
  createdAt: string   // ISO timestamp
  updatedAt: string   // ISO timestamp
}

export interface ExpenseFormValues {
  date: string
  amount: string      // raw string from input, parsed on submit
  category: Category
  description: string
}

export interface ExpenseFilters {
  search: string
  category: Category | 'All'
  dateFrom: string
  dateTo: string
  sortField: 'date' | 'amount' | 'category' | 'description'
  sortDirection: 'asc' | 'desc'
}

export interface CategorySummary {
  category: Category
  total: number       // cents
  count: number
  percentage: number  // 0–100
}

export interface MonthlyTotal {
  month: string       // "2024-05"
  label: string       // "May" (short, for chart X-axis)
  total: number       // cents
  count: number
}

export interface DashboardStats {
  totalAllTime: number
  totalCurrentMonth: number
  totalLastMonth: number
  monthOverMonthChange: number  // percentage, can be negative
  topCategory: CategorySummary | null
  categoryBreakdown: CategorySummary[]
  monthlyTotals: MonthlyTotal[]
  expenseCount: number
}
```

**Key decision:** Amounts stored as integer cents to avoid floating-point drift. All formatters divide by 100 for display.

---

## `useExpenses` Hook API (`src/hooks/useExpenses.ts`)

```typescript
{
  expenses: Expense[]           // all expenses, unfiltered
  isLoading: boolean            // true during initial localStorage hydration
  addExpense(v: ExpenseFormValues): void
  updateExpense(id: string, v: ExpenseFormValues): void
  deleteExpense(id: string): void
  clearAllExpenses(): void
  stats: DashboardStats         // useMemo over all expenses
  filteredExpenses: Expense[]   // useMemo over expenses + filters
  filters: ExpenseFilters
  setFilters(f: Partial<ExpenseFilters>): void
  resetFilters(): void
  exportToCSV(opts?: { filtered?: boolean }): void
}
```

**Persistence strategy:** Each mutation calls `storage.setExpenses()` synchronously alongside `setExpenses()` — no separate effect, so localStorage is always consistent.

**Filter pipeline order:** text search → category → date range → sort.

---

## Charts (Recharts, `ssr: false`)

Recharts accesses `window` internally, so each chart is split into two files:
- A **wrapper** (`SpendingChart.tsx`) that uses `next/dynamic` with `{ ssr: false }` and shows a skeleton while loading
- An **inner** (`SpendingChartInner.tsx`) that contains the actual Recharts JSX

**SpendingChart:** `BarChart` — last 6 months of spending. X: month abbreviation, Y: dollar amounts. Bar fill: `#6366f1` (indigo-500).

**CategoryPieChart:** `PieChart` with `innerRadius` (donut variant) — category breakdown. Slice colors from `CATEGORY_CONFIG[c].hex`. Custom legend below chart.

---

## Design System

- **Colors:** Indigo primary (`#6366f1`), `slate-50` page background, white cards with `shadow-card`
- **Category badges:** orange / blue / purple / pink / red / gray — defined in `CATEGORY_CONFIG` in `constants/categories.ts`
- **Font:** Inter via Google Fonts (loaded in `globals.css`), monospace (`font-mono`) for currency amounts
- **Tailwind extensions:** `primary` color scale, `surface` color scale, `shadow-card`, `shadow-card-hover`, `shadow-modal`, `borderRadius.card`

---

## CSV Export (`src/lib/csvExport.ts`)

1. Build `string[][]` — header row + one row per expense
2. Escape commas/quotes in `description`; convert cents → `$0.00` string
3. Join rows with `\r\n` (RFC 4180); prepend UTF-8 BOM (`﻿`) for Excel compatibility
4. Create `Blob` → object URL → programmatic `<a>` click → revoke URL
5. Filename: `expenses-YYYY-MM-DD.csv` (date-stamped)

`exportToCSV({ filtered: true })` (default) exports the current filtered view; `{ filtered: false }` exports all expenses.

---

## Build Order

1. Config files: `package.json`, `next.config.js`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`, `.eslintrc.json`
2. Install: `npm install` + `npm install --save-dev autoprefixer`
3. `src/types/expense.ts` → `src/constants/categories.ts`
4. `src/lib/storage.ts` → `src/lib/formatters.ts` → `src/lib/analytics.ts` → `src/lib/csvExport.ts` → `src/lib/utils.ts`
5. `src/hooks/useToast.ts` → `src/hooks/useExpenses.ts`
6. UI primitives: Button, Input, Select, Modal, Badge, EmptyState, Toast
7. Layout: Navbar, PageHeader → `app/layout.tsx` → `app/page.tsx` (redirect)
8. Expense components: ExpenseForm → ExpenseRow → ExpenseFilters → DeleteConfirmDialog → ExpenseList → `app/expenses/page.tsx`
9. Dashboard components: SummaryCard → SummaryCards → SpendingChartInner/SpendingChart → CategoryPieChartInner/CategoryPieChart → RecentExpenses → `app/dashboard/page.tsx`

---

## Known Issues / Decisions Made During Build

- `next.config.ts` is **not supported** in Next.js 14.2.x — must use `next.config.js`
- `autoprefixer` must be installed separately as a devDependency (not bundled with Next.js 14)
- `@typescript-eslint` plugin is not installed, so custom tooltip props for Recharts use typed interfaces instead of `any`
- `react-day-picker` was installed but not used — the date input uses native `<input type="date">` which is sufficient and simpler

---

## Verification

```bash
npm run dev     # http://localhost:3000 → redirects to /dashboard
npm run build   # production build — must succeed with no SSR errors from Recharts
npm run lint    # ESLint check
```

Manual test checklist:
- Add expense → appears in list, dashboard stats update
- Edit expense → form pre-fills with existing values, saves changes
- Delete expense → confirmation dialog appears, removes on confirm
- Search: type in search box, list filters in real-time
- Category filter: select a category, only matching rows show
- Date range filter: set from/to dates, verify count label updates
- Sort: change sort dropdown, rows reorder correctly
- CSV export: click "Export CSV", open in Excel — verify UTF-8 BOM, all columns present
- Hard-refresh: expenses persist from localStorage
- Empty state: clear all filters with no data → EmptyState component renders
