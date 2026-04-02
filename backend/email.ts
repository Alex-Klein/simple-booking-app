import { Resend } from 'resend'
import logger from './logger.js'

const resend = new Resend(process.env.RESEND_API_KEY)

const APP_NAME = process.env.APP_NAME ?? 'Simple Booking App'
const fromEmail = process.env.FROM_EMAIL ?? 'onboarding@resend.dev'
const fromName = process.env.FROM_NAME ?? APP_NAME
const FROM = `${fromName} <${fromEmail}>`
const ADMIN = process.env.ADMIN_EMAIL ?? ''

interface BookingDetails {
  name: string
  email: string
  notes: string
  check_in: string
  check_out: string
  cancelUrl?: string
}

interface PendingBookingDetails {
  name: string
  email: string
  notes: string
  check_in: string
  check_out: string
  appUrl: string
}

function formatDate(str: string) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
  })
}

export async function sendBookingEmails(booking: BookingDetails) {
  const { name, email, notes, check_in, check_out, cancelUrl } = booking
  const checkIn = formatDate(check_in)
  const checkOut = formatDate(check_out)

  // Email to the booker
  const bookerHtml = `
    <h2>Your stay at ${APP_NAME} is confirmed! 🌲</h2>
    <p>Hi ${name},</p>
    <p>Your reservation has been saved. Here's a summary:</p>
    <table style="border-collapse:collapse;width:100%;max-width:400px">
      <tr><td style="padding:8px 0;color:#888">Check-in</td><td style="padding:8px 0;font-weight:bold">${checkIn}</td></tr>
      <tr><td style="padding:8px 0;color:#888">Check-out</td><td style="padding:8px 0;font-weight:bold">${checkOut}</td></tr>
      ${notes ? `<tr><td style="padding:8px 0;color:#888">Notes</td><td style="padding:8px 0;font-style:italic">${notes}</td></tr>` : ''}
    </table>
    <p style="margin-top:24px;color:#666">See you at the cabin!</p>
    ${cancelUrl ? `
    <hr style="margin:32px 0;border:none;border-top:1px solid #eee" />
    <p style="color:#999;font-size:13px">Need to cancel? Use the button below. This cannot be undone.</p>
    <a href="${cancelUrl}" style="display:inline-block;margin-top:8px;padding:10px 24px;background:#ef4444;color:white;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">
      Cancel my reservation
    </a>
    ` : ''}
  `

  // Email to the admin
  const adminHtml = `
    <h2>New booking at ${APP_NAME}</h2>
    <table style="border-collapse:collapse;width:100%;max-width:400px">
      <tr><td style="padding:8px 0;color:#888">Who</td><td style="padding:8px 0;font-weight:bold">${name} (${email})</td></tr>
      <tr><td style="padding:8px 0;color:#888">Check-in</td><td style="padding:8px 0">${checkIn}</td></tr>
      <tr><td style="padding:8px 0;color:#888">Check-out</td><td style="padding:8px 0">${checkOut}</td></tr>
      ${notes ? `<tr><td style="padding:8px 0;color:#888">Notes</td><td style="padding:8px 0;font-style:italic">${notes}</td></tr>` : ''}
    </table>
  `

  const results = await Promise.all([
    resend.emails.send({
      from: FROM,
      to: email,
      subject: `${APP_NAME} — Reservation confirmed (${checkIn})`,
      html: bookerHtml,
    }),
    ...(ADMIN && ADMIN !== email
      ? [resend.emails.send({
          from: FROM,
          to: ADMIN,
          subject: `New booking by ${name} — ${checkIn}`,
          html: adminHtml,
        })]
      : []),
  ])

  results.forEach((r, i) => {
    if (r.error) logger.error({ err: r.error }, `Email ${i} (booking confirmation) failed`)
    else logger.info({ emailId: r.data?.id }, `Email ${i} (booking confirmation) sent`)
  })
}

export async function sendDeclineEmail(booking: { name: string; email: string; check_in: string; check_out: string; reason?: string }) {
  const { name, email, check_in, check_out, reason } = booking
  const checkIn = formatDate(check_in)
  const checkOut = formatDate(check_out)

  const html = `
    <h2>Booking request declined</h2>
    <p>Hi ${name},</p>
    <p>Unfortunately your booking request for ${APP_NAME} could not be confirmed.</p>
    <table style="border-collapse:collapse;width:100%;max-width:400px">
      <tr><td style="padding:8px 0;color:#888">Check-in</td><td style="padding:8px 0;font-weight:bold">${checkIn}</td></tr>
      <tr><td style="padding:8px 0;color:#888">Check-out</td><td style="padding:8px 0;font-weight:bold">${checkOut}</td></tr>
    </table>
    ${reason ? `
    <div style="margin-top:20px;padding:12px 16px;background:#fef2f2;border-left:3px solid #ef4444;border-radius:4px">
      <p style="margin:0;color:#7f1d1d;font-size:14px"><strong>Reason:</strong> ${reason}</p>
    </div>` : ''}
    <p style="margin-top:24px;color:#666">Feel free to request a different time slot.</p>
  `

  const result = await resend.emails.send({
    from: FROM,
    to: email,
    subject: `${APP_NAME} — Booking request declined (${checkIn})`,
    html,
  })

  if (result.error) logger.error({ err: result.error }, 'Decline email failed')
  else logger.info({ emailId: result.data?.id }, 'Decline email sent')
}

export async function sendPendingBookingEmails(booking: PendingBookingDetails) {
  const { name, email, notes, check_in, check_out, appUrl } = booking
  const checkIn = formatDate(check_in)
  const checkOut = formatDate(check_out)

  const bookerHtml = `
    <h2>Booking request received 🕐</h2>
    <p>Hi ${name},</p>
    <p>Your booking request for ${APP_NAME} has been received and is awaiting confirmation. We'll send you an email once it's approved.</p>
    <table style="border-collapse:collapse;width:100%;max-width:400px">
      <tr><td style="padding:8px 0;color:#888">Check-in</td><td style="padding:8px 0;font-weight:bold">${checkIn}</td></tr>
      <tr><td style="padding:8px 0;color:#888">Check-out</td><td style="padding:8px 0;font-weight:bold">${checkOut}</td></tr>
      ${notes ? `<tr><td style="padding:8px 0;color:#888">Notes</td><td style="padding:8px 0;font-style:italic">${notes}</td></tr>` : ''}
    </table>
    <p style="margin-top:24px;color:#666">We'll be in touch soon!</p>
  `

  const adminHtml = `
    <h2>New booking request at ${APP_NAME} (pending approval)</h2>
    <table style="border-collapse:collapse;width:100%;max-width:400px">
      <tr><td style="padding:8px 0;color:#888">Who</td><td style="padding:8px 0;font-weight:bold">${name} (${email})</td></tr>
      <tr><td style="padding:8px 0;color:#888">Check-in</td><td style="padding:8px 0">${checkIn}</td></tr>
      <tr><td style="padding:8px 0;color:#888">Check-out</td><td style="padding:8px 0">${checkOut}</td></tr>
      <tr><td style="padding:8px 0;color:#888">Guests</td><td style="padding:8px 0">${guests}</td></tr>
      ${notes ? `<tr><td style="padding:8px 0;color:#888">Notes</td><td style="padding:8px 0;font-style:italic">${notes}</td></tr>` : ''}
    </table>
    <p style="margin-top:24px">
      <a href="${appUrl}/admin" style="display:inline-block;padding:10px 24px;background:#5a7c5a;color:white;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">
        Review in Admin Panel
      </a>
    </p>
  `

  const results = await Promise.all([
    resend.emails.send({
      from: FROM,
      to: email,
      subject: `${APP_NAME} — Booking request received (${checkIn})`,
      html: bookerHtml,
    }),
    ...(ADMIN && ADMIN !== email
      ? [resend.emails.send({
          from: FROM,
          to: ADMIN,
          subject: `Booking request by ${name} — ${checkIn} (awaiting approval)`,
          html: adminHtml,
        })]
      : []),
  ])

  results.forEach((r, i) => {
    if (r.error) logger.error({ err: r.error }, `Email ${i} (pending notification) failed`)
    else logger.info({ emailId: r.data?.id }, `Email ${i} (pending notification) sent`)
  })
}
