import { Router } from 'express'
import db from '../db.js'

const router = Router()

// GET /api/cancel/:token — look up booking by token
router.get('/:token', (req, res) => {
  const booking = db.prepare(
    'SELECT id, name, email, check_in, check_out FROM bookings WHERE cancel_token = ?'
  ).get(req.params.token)

  if (!booking) {
    res.status(404).json({ error: 'Booking not found or already cancelled' })
    return
  }
  res.json(booking)
})

// DELETE /api/cancel/:token — cancel booking by token
router.delete('/:token', (req, res) => {
  const booking = db.prepare(
    'SELECT id FROM bookings WHERE cancel_token = ?'
  ).get(req.params.token)

  if (!booking) {
    res.status(404).json({ error: 'Booking not found or already cancelled' })
    return
  }

  db.prepare('DELETE FROM bookings WHERE cancel_token = ?').run(req.params.token)
  res.status(204).send()
})

export default router
