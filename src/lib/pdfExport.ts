import { Expense } from '@/types/expense'
import { format } from 'date-fns'

export async function exportToPDF(expenses: Expense[], filename: string): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const { autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF()

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Expense Report', 14, 16)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120)
  doc.text(`Generated: ${format(new Date(), 'MMMM d, yyyy')}`, 14, 23)
  doc.text(`${expenses.length} record${expenses.length !== 1 ? 's' : ''}`, 14, 29)
  doc.setTextColor(0)

  autoTable(doc, {
    startY: 34,
    head: [['Date', 'Category', 'Amount', 'Description']],
    body: expenses.map((e) => [
      e.date,
      e.category,
      `$${(e.amount / 100).toFixed(2)}`,
      e.description,
    ]),
    headStyles: { fillColor: [99, 102, 241], fontSize: 9 },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 2: { halign: 'right' } },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  })

  doc.save(`${filename}.pdf`)
}
