import db from './db.js'
import logger from './logger.js'
import { sendReminderEmail } from './email.js'

const REMINDER_DAYS = parseInt(process.env.REMINDER_DAYS ?? '3', 10)
const POLL_INTERVAL_MS = 60 * 60 * 1000 // 1 hour

interface BookingRow {
  id: number
  name: string
  email: string
  notes: string
  check_in: string
  check_out: string
  cancel_token: string
  locale: string
}

async function runReminderCheck() {
  const bookings = db.prepare(`
    SELECT id, name, email, notes, check_in, check_out, cancel_token, locale
    FROM bookings
    WHERE status = 'confirmed'
      AND reminder_sent = 0
      AND date(check_in) = date('now', '+' || ? || ' days')
  `).all(REMINDER_DAYS) as BookingRow[]

  if (bookings.length === 0) return

  logger.info({ count: bookings.length, reminderDays: REMINDER_DAYS }, 'Sending pre-arrival reminders')

  const appUrl = (process.env.APP_URL ?? 'http://localhost:3001').replace(/\/$/, '')

  for (const booking of bookings) {
    const cancelUrl = `${appUrl}/cancel?token=${booking.cancel_token}`
    try {
      await sendReminderEmail({
        name: booking.name,
        email: booking.email,
        notes: booking.notes,
        check_in: booking.check_in,
        check_out: booking.check_out,
        cancelUrl,
        locale: booking.locale,
        daysUntil: REMINDER_DAYS,
      })
      db.prepare('UPDATE bookings SET reminder_sent = 1 WHERE id = ?').run(booking.id)
      logger.info({ bookingId: booking.id }, 'Reminder sent and marked')
    } catch (err) {
      // Leave reminder_sent = 0 so it retries on the next hourly poll
      logger.error({ err, bookingId: booking.id }, 'Reminder email failed — will retry')
    }
  }
}

export function startReminderScheduler() {
  logger.info({ reminderDays: REMINDER_DAYS }, 'Reminder scheduler started')
  // Run immediately on startup to catch any reminders missed during downtime
  runReminderCheck().catch(err => logger.error({ err }, 'Initial reminder check failed'))
  setInterval(() => {
    runReminderCheck().catch(err => logger.error({ err }, 'Reminder check failed'))
  }, POLL_INTERVAL_MS)
}
