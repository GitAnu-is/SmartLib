import api from './api'

function parseFilenameFromDisposition(disposition) {
  if (!disposition || typeof disposition !== 'string') return ''

  // Examples:
  // content-disposition: attachment; filename="borrow-report-2024-03-01.csv"
  // content-disposition: attachment; filename*=UTF-8''borrow-report-2024-03-01.csv
  const utf8Match = disposition.match(/filename\*=(?:UTF-8''|utf-8'')([^;]+)/)
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim().replace(/^"|"$/g, ''))
    } catch {
      return utf8Match[1].trim().replace(/^"|"$/g, '')
    }
  }

  const match = disposition.match(/filename=([^;]+)/)
  if (!match?.[1]) return ''
  return match[1].trim().replace(/^"|"$/g, '')
}

export async function fetchReportCsv(reportType, date) {
  const pathByType = {
    borrow: '/reports/borrow',
    overdue: '/reports/overdue',
    usage: '/reports/usage',
  }

  const path = pathByType[reportType]
  if (!path) {
    throw new Error('Invalid report type')
  }

  const res = await api.get(path, {
    params: { date },
    responseType: 'blob',
    headers: {
      Accept: 'text/csv',
    },
  })

  const disposition = res?.headers?.['content-disposition']
  const filename = parseFilenameFromDisposition(disposition)

  return {
    blob: res.data,
    filename,
  }
}
