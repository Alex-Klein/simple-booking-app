import { Router } from 'express'
import db from '../db.js'
import logger from '../logger.js'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()

// GET /api/calendar.ics/url — returns the full subscribable URL (admin only)
router.get('/url', requireAdmin, (req, res) => {
  const appUrl = process.env.APP_URL ?? `${req.protocol}://${req.headers.host}`
  const token = process.env.CALENDAR_TOKEN
  const url = token
    ? `${appUrl}/api/calendar.ics?token=${token}`
    : `${appUrl}/api/calendar.ics`
  res.json({ url })
})

function toIcsDate(dateStr: string): string {
  // dateStr is YYYY-MM-DD — convert to iCal all-day format YYYYMMDD
  return dateStr.replace(/-/g, '')
}

function toIcsTimestamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function escapeIcs(str: string): string {
  return (str ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

// GET /api/calendar.ics?token=<CALENDAR_TOKEN>
router.get('/', (req, res) => {
  const token = process.env.CALENDAR_TOKEN
  if (token && req.query.token !== token) {
    res.status(401).send('Unauthorized')
    return
  }

  const bookings = db.prepare(
    "SELECT * FROM bookings WHERE status = 'confirmed' ORDER BY check_in ASC"
  ).all() as any[]

  const appName = process.env.APP_NAME ?? 'Cabin'
  const appUrl = process.env.APP_URL ?? 'http://localhost:3001'
  const now = toIcsTimestamp(new Date())

  const events = bookings.map((b) => {
    const summary = escapeIcs(`${b.name}${b.guests > 1 ? ` (${b.guests} guests)` : ''}`)
    const description = escapeIcs(b.notes || '')
    return [
      'BEGIN:VEVENT',
      `UID:booking-${b.id}@cabin`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${toIcsDate(b.check_in)}`,
      `DTEND;VALUE=DATE:${toIcsDate(b.check_out)}`,
      `SUMMARY:${summary}`,
      description ? `DESCRIPTION:${description}` : null,
      `URL:${appUrl}`,
      'END:VEVENT',
    ].filter(Boolean).join('\r\n')
  }).join('\r\n')

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//${appName}//Bookings//EN`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${appName} — Bookings`,
    'X-WR-TIMEZONE:UTC',
    events,
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n')

  logger.info({ count: bookings.length }, 'Calendar feed requested')
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
  res.setHeader('Content-Disposition', 'inline; filename="bookings.ics"')
  res.send(ics)
})

export default router
