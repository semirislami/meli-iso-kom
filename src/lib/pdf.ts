import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Project, Settings, CostCalculation } from '../types'
import { sectionTotal, projectTotal, projectMeasurementCount } from './calc'
import { computeCost, workTypeLabel } from './cost'
import { formatValue, formatDate, formatMoney, formatNumber } from './format'

// Brand palette (RGB) used across the report.
const INK: [number, number, number] = [17, 19, 24]
const SUBTLE: [number, number, number] = [110, 116, 128]
const PRIMARY: [number, number, number] = [37, 99, 235]
const LINE: [number, number, number] = [226, 228, 233]
const SOFT: [number, number, number] = [247, 248, 250]

type RGB = [number, number, number]

/** Build and trigger download of a polished, client-ready PDF report. */
export function exportProjectPdf(project: Project, settings: Settings) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 40
  const contentW = pageW - margin * 2

  // ── Header band ────────────────────────────────────────────────────
  doc.setFillColor(...PRIMARY)
  doc.rect(0, 0, pageW, 6, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(...INK)
  doc.text(settings.companyName || 'Raport i Matjeve', margin, 50)

  if (settings.companyContact) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(...SUBTLE)
    doc.text(settings.companyContact, margin, 66)
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...PRIMARY)
  doc.text('RAPORT I MATJEVE', pageW - margin, 50, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...SUBTLE)
  doc.text(`Krijuar më ${formatDate(Date.now())}`, pageW - margin, 64, { align: 'right' })

  // ── Project info card ──────────────────────────────────────────────
  let y = 88
  doc.setDrawColor(...LINE)
  doc.setFillColor(...SOFT)
  doc.roundedRect(margin, y, contentW, 72, 8, 8, 'FD')

  const col1 = margin + 16
  const col2 = margin + contentW / 2 + 8
  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...INK)
  doc.text(project.name || 'Projekt pa titull', col1, y + 28, { maxWidth: contentW / 2 - 24 })

  const infoRows: Array<[string, string]> = [
    ['Klienti', project.client || '—'],
    ['Vendndodhja', project.location || '—'],
    ['Data', formatDate(project.date)],
  ]
  doc.setFontSize(9)
  let infoY = y + 22
  infoRows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...SUBTLE)
    doc.text(label.toUpperCase(), col2, infoY)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...INK)
    doc.text(value, col2 + 64, infoY, { maxWidth: contentW / 2 - 84 })
    infoY += 16
  })

  y += 72 + 24

  // ── Sections ───────────────────────────────────────────────────────
  const nonEmpty = project.sections.filter((s) => s.measurements.length > 0)

  if (nonEmpty.length === 0) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(11)
    doc.setTextColor(...SUBTLE)
    doc.text('Ende pa matje të regjistruara.', margin, y + 10)
  }

  nonEmpty.forEach((section) => {
    const subtotal = sectionTotal(section)

    // Page-break guard so a heading never sits alone at the bottom.
    if (y > pageH - 120) {
      doc.addPage()
      y = 56
    }

    // Section heading bar.
    doc.setFillColor(...INK)
    doc.roundedRect(margin, y, contentW, 24, 5, 5, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10.5)
    doc.setTextColor(255, 255, 255)
    doc.text(section.name.toUpperCase(), margin + 12, y + 16)
    doc.setTextColor(180, 200, 255)
    doc.text(formatValue(subtotal, settings), pageW - margin - 12, y + 16, { align: 'right' })

    autoTable(doc, {
      startY: y + 24,
      margin: { left: margin, right: margin },
      head: [['#', 'Përshkrimi', 'Llogaritja', 'Rezultati']],
      body: section.measurements.map((m, i) => [
        String(i + 1),
        m.description || '—',
        m.expression || '—',
        formatValue(m.value, settings),
      ]),
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 9.5,
        cellPadding: 6,
        textColor: INK as RGB,
        lineColor: LINE as RGB,
        lineWidth: 0.5,
      },
      headStyles: {
        fillColor: SOFT as RGB,
        textColor: SUBTLE as RGB,
        fontStyle: 'bold',
        fontSize: 8.5,
        lineColor: LINE as RGB,
        lineWidth: 0.5,
      },
      columnStyles: {
        0: { cellWidth: 26, halign: 'center', textColor: SUBTLE as RGB },
        2: { halign: 'right', font: 'courier' },
        3: { cellWidth: 92, halign: 'right', fontStyle: 'bold' },
      },
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 22
  })

  // ── Grand total box ────────────────────────────────────────────────
  const grand = projectTotal(project)
  if (y > pageH - 110) {
    doc.addPage()
    y = 56
  }
  const boxH = 50
  doc.setFillColor(...PRIMARY)
  doc.roundedRect(margin, y, contentW, boxH, 8, 8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('TOTALI I PËRGJITHSHËM', margin + 16, y + boxH / 2 + 4)
  doc.setFontSize(19)
  doc.text(formatValue(grand, settings), pageW - margin - 16, y + boxH / 2 + 5, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...SUBTLE)
  doc.text(
    `${nonEmpty.length} seksion${nonEmpty.length === 1 ? '' : 'e'} · ${projectMeasurementCount(
      project
    )} matje · njësia: ${settings.unit || '—'}`,
    margin,
    y + boxH + 18
  )

  // ── Footer on every page ───────────────────────────────────────────
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setDrawColor(...LINE)
    doc.setLineWidth(0.5)
    doc.line(margin, pageH - 30, pageW - margin, pageH - 30)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...SUBTLE)
    doc.text(settings.companyName || '', margin, pageH - 16)
    doc.text(`Faqja ${i} nga ${pageCount}`, pageW - margin, pageH - 16, { align: 'right' })
  }

  const safeName = (project.name || 'project').replace(/[^a-z0-9\-_]+/gi, '_').slice(0, 40)
  doc.save(`${safeName}_measurements.pdf`)
}

// ── Cost & Profit report ─────────────────────────────────────────────
const SUCCESS: [number, number, number] = [22, 163, 74]
const DANGER: [number, number, number] = [220, 38, 38]

/** Build and download a professional cost / profit report for one calculation. */
export function exportCostPdf(project: Project, calc: CostCalculation, settings: Settings) {
  const r = computeCost(calc)
  const money = (v: number) => formatMoney(v, settings)
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 40
  const contentW = pageW - margin * 2

  // Header band
  doc.setFillColor(...PRIMARY)
  doc.rect(0, 0, pageW, 6, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(...INK)
  doc.text(settings.companyName || 'Raport i Kostos', margin, 50)
  if (settings.companyContact) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(...SUBTLE)
    doc.text(settings.companyContact, margin, 66)
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...PRIMARY)
  doc.text('RAPORT I KOSTOS & FITIMIT', pageW - margin, 50, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...SUBTLE)
  doc.text(`Krijuar më ${formatDate(Date.now())}`, pageW - margin, 64, { align: 'right' })

  // Project + parameters card
  let y = 88
  doc.setDrawColor(...LINE)
  doc.setFillColor(...SOFT)
  doc.roundedRect(margin, y, contentW, 86, 8, 8, 'FD')
  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...INK)
  doc.text(project.name || 'Projekt pa titull', margin + 16, y + 26, { maxWidth: contentW / 2 - 24 })

  const left: Array<[string, string]> = [
    ['Klienti', project.client || '—'],
    ['Vendndodhja', project.location || '—'],
    ['Data', formatDate(calc.createdAt)],
  ]
  const right: Array<[string, string]> = [
    ['Lloji i punës', workTypeLabel(calc.workType)],
    ['Sipërfaqja', `${formatNumber(r.area, settings)} m²`],
    ['Çmimi / m²', `${formatNumber(calc.pricePerM2Eur, settings)} EUR`],
    ['Kursi i këmbimit', `1 EUR = ${formatNumber(r.rate, settings)} MKD`],
  ]
  doc.setFontSize(9)
  let ly = y + 44
  left.forEach(([l, v]) => {
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...SUBTLE)
    doc.text(l.toUpperCase(), margin + 16, ly)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...INK)
    doc.text(v, margin + 80, ly, { maxWidth: contentW / 2 - 96 })
    ly += 14
  })
  let ry = y + 22
  right.forEach(([l, v]) => {
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...SUBTLE)
    doc.text(l.toUpperCase(), margin + contentW / 2 + 8, ry)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...INK)
    doc.text(v, pageW - margin - 16, ry, { align: 'right' })
    ry += 14
  })
  y += 86 + 22

  // Material breakdown
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...INK)
  doc.text('Ndarja e materialeve', margin, y)
  y += 8
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Materiali', 'Sasia', 'Çmimi për njësi', 'Kosto (MKD)']],
    body: r.materials.map((m) => {
      const detail =
        m.requiredKg !== undefined
          ? ` (${formatNumber(m.requiredKg, settings)} kg)`
          : m.line.autoKind === 'volume-bags' && m.volumeM3 !== undefined
            ? ` (${formatNumber(m.volumeM3, settings)} m³ zalli)`
            : ''
      const qty =
        m.line.autoKind === 'volume'
          ? `${formatNumber(m.volumeM3 ?? 0, settings)} ${m.line.unitLabel}`
          : `${m.units} ${m.line.unitLabel}`
      return [
        m.line.name + detail,
        qty,
        `${money(m.line.pricePerUnit)} / ${m.line.unitLabel}`,
        money(m.cost),
      ]
    }),
    foot: [['', '', 'Totali i materialeve', money(r.materialCostMkd)]],
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 9.5, cellPadding: 6, textColor: INK, lineColor: LINE, lineWidth: 0.5 },
    headStyles: { fillColor: SOFT, textColor: SUBTLE, fontStyle: 'bold', fontSize: 8.5 },
    footStyles: { fillColor: SOFT, textColor: PRIMARY, fontStyle: 'bold' },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right', cellWidth: 100 } },
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 18

  // Additional expenses
  if (calc.expenses.length > 0) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...INK)
    doc.text('Shpenzime shtesë', margin, y)
    y += 8
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Shpenzimi', 'Shënime', 'Shuma (MKD)']],
      body: calc.expenses.map((e) => [e.name || '—', e.notes || '—', money(e.amount)]),
      foot: [['', 'Totali i shpenzimeve', money(r.additionalMkd)]],
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 9.5, cellPadding: 6, textColor: INK, lineColor: LINE, lineWidth: 0.5 },
      headStyles: { fillColor: SOFT, textColor: SUBTLE, fontStyle: 'bold', fontSize: 8.5 },
      footStyles: { fillColor: SOFT, textColor: PRIMARY, fontStyle: 'bold' },
      columnStyles: { 2: { halign: 'right', cellWidth: 100 } },
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 18
  }

  // Financial summary
  if (y > pageH - 220) {
    doc.addPage()
    y = 56
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...INK)
  doc.text('Përmbledhje financiare', margin, y)
  y += 8
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['', 'EUR', 'MKD']],
    body: [
      ['Të ardhurat', money(r.incomeEur), money(r.incomeMkd)],
      ['Shpenzimet', money(r.totalExpensesEur), money(r.totalExpensesMkd)],
    ],
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 10, cellPadding: 7, textColor: INK, lineColor: LINE, lineWidth: 0.5 },
    headStyles: { fillColor: INK, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' }, 2: { halign: 'right' } },
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 16

  // Profit box (green / red)
  const tone = r.profitable ? SUCCESS : DANGER
  const boxH = 64
  if (y > pageH - boxH - 50) {
    doc.addPage()
    y = 56
  }
  doc.setFillColor(...tone)
  doc.roundedRect(margin, y, contentW, boxH, 8, 8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text(r.profitable ? 'FITIM' : 'HUMBJE', margin + 16, y + 26)
  doc.setFontSize(22)
  doc.text(`${money(r.profitMkd)} MKD`, pageW - margin - 16, y + 30, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`${money(r.profitEur)} EUR`, margin + 16, y + 48)
  doc.text(`${formatNumber(r.profitPct, settings)} %`, pageW - margin - 16, y + 50, { align: 'right' })

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setDrawColor(...LINE)
    doc.setLineWidth(0.5)
    doc.line(margin, pageH - 30, pageW - margin, pageH - 30)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...SUBTLE)
    doc.text(settings.companyName || '', margin, pageH - 16)
    doc.text(`Faqja ${i} nga ${pageCount}`, pageW - margin, pageH - 16, { align: 'right' })
  }

  const safeName = (project.name || 'project').replace(/[^a-z0-9\-_]+/gi, '_').slice(0, 40)
  doc.save(`${safeName}_cost_profit.pdf`)
}
