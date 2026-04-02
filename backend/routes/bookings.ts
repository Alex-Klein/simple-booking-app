import { Router } from 'express'
import { nanoid } from 'nanoid'
import db from '../db.js'
import logger from '../logger.js'
import { sendBookingEmails, sendPendingBookingEmails, sendDeclineEmail } from '../email.js'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()

function getTrustedEmails(): string[] {
  return (process.env.TRUSTED_EMAILS ?? '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
}

// GET /api/bookings — active bookings (pending + confirmed)
router.get('/', (_req, res) => {
  const bookings = db.prepare("SELECT * FROM bookings WHERE status IN ('pending', 'confirmed') ORDER BY check_in ASC").all()
  res.json(bookings)
})

// GET /api/bookings/history — declined and cancelled bookings (admin only)
router.get('/history', requireAdmin, (_req, res) => {
  const bookings = db.prepare("SELECT * FROM bookings WHERE status IN ('declined', 'cancelled') ORDER BY check_in DESC").all()
  res.json(bookings)
})

// POST /api/bookings — create a booking
router.post('/', (req, res) => {
  const { name, email, notes, check_in, check_out, locale } = req.body

  if (!name || !email || !check_in || !check_out) {
    res.status(400).json({ error: 'name, email, check_in and check_out are required' })
    return
  }

  const minStay = parseInt(process.env.MIN_STAY ?? '2', 10)
  const nights = (new Date(check_out).getTime() - new Date(check_in).getTime()) / 86400000
  if (nights < minStay) {
    res.status(400).json({ error: `Minimum stay is ${minStay} nights` })
    return
  }

  // Check for overlap with existing bookings
  const overlap = db.prepare(`
    SELECT id FROM bookings
    WHERE check_in < @check_out AND check_out > @check_in
  `).get({ check_in, check_out })

  if (overlap) {
    res.status(409).json({ error: 'Those dates overlap with an existing booking' })
    return
  }

  const trusted = getTrustedEmails()
  const status = trusted.includes(email.toLowerCase()) ? 'confirmed' : 'pending'
  const cancel_token = nanoid(32)

  const result = db.prepare(`
    INSERT INTO bookings (name, email, notes, check_in, check_out, cancel_token, status, locale)
    VALUES (@name, @email, @notes, @check_in, @check_out, @cancel_token, @status, @locale)
  `).run({ name, email, notes: notes ?? '', check_in, check_out, cancel_token, status, locale: locale ?? 'en' })

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(result.lastInsertRowid) as any

  const appUrl = process.env.APP_URL ?? 'http://localhost:5173'
  const cancelUrl = `${appUrl}/cancel?token=${cancel_token}`

  if (status === 'confirmed') {
    // Auto-confirmed: send regular confirmation email
    sendBookingEmails({ name, email, notes, check_in, check_out, cancelUrl, locale }).catch((err) =>
      logger.error({ err, bookingId: booking.id }, 'Confirmation email failed')
    )
  } else {
    // Pending: notify guest their request was received, notify admin to approve
    sendPendingBookingEmails({ name, email, notes, check_in, check_out, appUrl, locale }).catch((err) =>
      logger.error({ err, bookingId: booking.id }, 'Pending notification email failed')
    )
  }

  res.status(201).json(booking)
})

// POST /api/bookings/:id/confirm — approve a pending booking (admin only)
router.post('/:id/confirm', requireAdmin, (req, res) => {
  const { id } = req.params
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id) as any

  if (!booking) {
    res.status(404).json({ error: 'Booking not found' })
    return
  }

  if (booking.status === 'confirmed') {
    res.status(400).json({ error: 'Booking is already confirmed' })
    return
  }

  db.prepare("UPDATE bookings SET status = 'confirmed' WHERE id = ?").run(id)
  const updated = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id) as any

  const cancelUrl = `${process.env.APP_URL ?? 'http://localhost:5173'}/cancel?token=${booking.cancel_token}`
  const { name, email, notes, check_in, check_out, locale: bookingLocale } = booking
  sendBookingEmails({ name, email, notes, check_in, check_out, cancelUrl, locale: bookingLocale ?? 'en' }).catch((err) =>
    logger.error({ err, bookingId: id }, 'Approval email failed')
  )

  res.json(updated)
})

// POST /api/bookings/:id/decline — decline a pending booking (admin only)
router.post('/:id/decline', requireAdmin, (req, res) => {
  const { id } = req.params
  const { reason } = req.body
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id) as any

  if (!booking) {
    res.status(404).json({ error: 'Booking not found' })
    return
  }

  if (booking.status !== 'pending') {
    res.status(400).json({ error: 'Only pending bookings can be declined' })
    return
  }

  db.prepare("UPDATE bookings SET status = 'declined', declined_reason = ? WHERE id = ?").run(reason || null, id)

  const { name, email, check_in, check_out, locale: bookingLocale } = booking
  sendDeclineEmail({ name, email, check_in, check_out, reason: reason || undefined, locale: bookingLocale ?? 'en' }).catch((err) =>
    logger.error({ err, bookingId: id }, 'Decline email failed')
  )

  res.status(204).send()
})

// PUT /api/bookings/:id — update a booking (admin only)
router.put('/:id', requireAdmin, (req, res) => {
  const { id } = req.params
  const { name, email, notes, check_in, check_out } = req.body

  const existing = db.prepare('SELECT id FROM bookings WHERE id = ?').get(id)
  if (!existing) {
    res.status(404).json({ error: 'Booking not found' })
    return
  }

  const overlap = db.prepare(`
    SELECT id FROM bookings
    WHERE id != @id AND check_in < @check_out AND check_out > @check_in
  `).get({ id, check_in, check_out })

  if (overlap) {
    res.status(409).json({ error: 'Those dates overlap with an existing booking' })
    return
  }

  db.prepare(`
    UPDATE bookings SET name=@name, email=@email, notes=@notes,
    check_in=@check_in, check_out=@check_out WHERE id=@id
  `).run({ id, name, email, notes, check_in, check_out })

  res.json(db.prepare('SELECT * FROM bookings WHERE id = ?').get(id))
})

// DELETE /api/bookings/:id — cancel a booking (admin only)
router.delete('/:id', requireAdmin, (req, res) => {
  const { id } = req.params
  const booking = db.prepare('SELECT id FROM bookings WHERE id = ?').get(id)

  if (!booking) {
    res.status(404).json({ error: 'Booking not found' })
    return
  }

  db.prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?").run(id)
  res.status(204).send()
})

export default router
