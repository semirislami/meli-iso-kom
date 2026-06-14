import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Project, Settings } from '../types'
import { sectionTotal, projectTotal, projectMeasurementCount } from './calc'
import { formatValue, formatDate } from './format'

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
  doc.text(settings.companyName || 'Measurement Report', margin, 50)

  if (settings.companyContact) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(...SUBTLE)
    doc.text(settings.companyContact, margin, 66)
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...PRIMARY)
  doc.text('MEASUREMENT REPORT', pageW - margin, 50, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...SUBTLE)
  doc.text(`Generated ${formatDate(Date.now())}`, pageW - margin, 64, { align: 'right' })

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
  doc.text(project.name || 'Untitled project', col1, y + 28, { maxWidth: contentW / 2 - 24 })

  const infoRows: Array<[string, string]> = [
    ['Client', project.client || '—'],
    ['Location', project.location || '—'],
    ['Date', formatDate(project.date)],
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
    doc.text('No measurements recorded yet.', margin, y + 10)
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
      head: [['#', 'Description', 'Calculation', 'Result']],
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
  doc.text('GRAND TOTAL', margin + 16, y + boxH / 2 + 4)
  doc.setFontSize(19)
  doc.text(formatValue(grand, settings), pageW - margin - 16, y + boxH / 2 + 5, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...SUBTLE)
  doc.text(
    `${nonEmpty.length} section${nonEmpty.length === 1 ? '' : 's'} · ${projectMeasurementCount(
      project
    )} measurements · unit: ${settings.unit || '—'}`,
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
    doc.text(`Page ${i} of ${pageCount}`, pageW - margin, pageH - 16, { align: 'right' })
  }

  const safeName = (project.name || 'project').replace(/[^a-z0-9\-_]+/gi, '_').slice(0, 40)
  doc.save(`${safeName}_measurements.pdf`)
}
