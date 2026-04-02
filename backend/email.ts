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
  locale?: string
}

interface PendingBookingDetails {
  name: string
  email: string
  notes: string
  check_in: string
  check_out: string
  appUrl: string
  locale?: string
}

const T = {
  en: {
    confirmSubject: (app: string, date: string) => `${app} — Reservation confirmed (${date})`,
    confirmTitle: (app: string) => `Your stay at ${app} is confirmed! 🌲`,
    confirmIntro: (name: string) => `Hi ${name},`,
    confirmBody: `Your reservation has been saved. Here's a summary:`,
    confirmClosing: `See you at the cabin!`,
    cancelNote: `Need to cancel? Use the button below. This cannot be undone.`,
    cancelBtn: `Cancel my reservation`,
    pendingGuestSubject: (app: string, date: string) => `${app} — Booking request received (${date})`,
    pendingGuestTitle: `Booking request received 🕐`,
    pendingGuestBody: (app: string) => `Your booking request for ${app} has been received and is awaiting confirmation. We'll send you an email once it's approved.`,
    pendingGuestClosing: `We'll be in touch soon!`,
    declineSubject: (app: string, date: string) => `${app} — Booking request declined (${date})`,
    declineTitle: `Booking request declined`,
    declineBody: (app: string) => `Unfortunately your booking request for ${app} could not be confirmed.`,
    declineClosing: `Feel free to request a different time slot.`,
    declineReason: `Reason:`,
    labelCheckIn: `Check-in`,
    labelCheckOut: `Check-out`,
    labelNotes: `Notes`,
  },
  de: {
    confirmSubject: (app: string, date: string) => `${app} — Reservation bestätigt (${date})`,
    confirmTitle: (app: string) => `Dein Aufenthalt im ${app} ist bestätigt! 🌲`,
    confirmIntro: (name: string) => `Hallo ${name},`,
    confirmBody: `Deine Reservation wurde gespeichert. Hier eine Übersicht:`,
    confirmClosing: `Wir freuen uns auf euren Besuch!`,
    cancelNote: `Möchtest du stornieren? Nutze den Button unten. Dies kann nicht rückgängig gemacht werden.`,
    cancelBtn: `Reservation stornieren`,
    pendingGuestSubject: (app: string, date: string) => `${app} — Buchungsanfrage erhalten (${date})`,
    pendingGuestTitle: `Buchungsanfrage erhalten 🕐`,
    pendingGuestBody: (app: string) => `Deine Buchungsanfrage für ${app} wurde erhalten und wartet auf Bestätigung. Wir benachrichtigen dich, sobald sie bestätigt wurde.`,
    pendingGuestClosing: `Wir melden uns bald!`,
    declineSubject: (app: string, date: string) => `${app} — Buchungsanfrage abgelehnt (${date})`,
    declineTitle: `Buchungsanfrage abgelehnt`,
    declineBody: (app: string) => `Leider konnte deine Buchungsanfrage für ${app} nicht bestätigt werden.`,
    declineClosing: `Du kannst gerne einen anderen Zeitraum anfragen.`,
    declineReason: `Grund:`,
    labelCheckIn: `Anreise`,
    labelCheckOut: `Abreise`,
    labelNotes: `Bemerkungen`,
  },
}

function t(locale: string | undefined) {
  return locale === 'de' ? T.de : T.en
}

function formatDate(str: string, locale?: string) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(locale === 'de' ? 'de-CH' : 'en-GB', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
  })
}

export async function sendBookingEmails(booking: BookingDetails) {
  const { name, email, notes, check_in, check_out, cancelUrl, locale } = booking
  const tr = t(locale)
  const checkIn = formatDate(check_in, locale)
  const checkOut = formatDate(check_out, locale)

  const bookerHtml = `
    <h2>${tr.confirmTitle(APP_NAME)}</h2>
    <p>${tr.confirmIntro(name)}</p>
    <p>${tr.confirmBody}</p>
    <table style="border-collapse:collapse;width:100%;max-width:400px">
      <tr><td style="padding:8px 0;color:#888">${tr.labelCheckIn}</td><td style="padding:8px 0;font-weight:bold">${checkIn}</td></tr>
      <tr><td style="padding:8px 0;color:#888">${tr.labelCheckOut}</td><td style="padding:8px 0;font-weight:bold">${checkOut}</td></tr>
      ${notes ? `<tr><td style="padding:8px 0;color:#888">${tr.labelNotes}</td><td style="padding:8px 0;font-style:italic">${notes}</td></tr>` : ''}
    </table>
    <p style="margin-top:24px;color:#666">${tr.confirmClosing}</p>
    ${cancelUrl ? `
    <hr style="margin:32px 0;border:none;border-top:1px solid #eee" />
    <p style="color:#999;font-size:13px">${tr.cancelNote}</p>
    <a href="${cancelUrl}" style="display:inline-block;margin-top:8px;padding:10px 24px;background:#ef4444;color:white;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">
      ${tr.cancelBtn}
    </a>
    ` : ''}
  `

  const adminHtml = `
    <h2>New booking at ${APP_NAME}</h2>
    <table style="border-collapse:collapse;width:100%;max-width:400px">
      <tr><td style="padding:8px 0;color:#888">Who</td><td style="padding:8px 0;font-weight:bold">${name} (${email})</td></tr>
      <tr><td style="padding:8px 0;color:#888">Check-in</td><td style="padding:8px 0">${formatDate(check_in)}</td></tr>
      <tr><td style="padding:8px 0;color:#888">Check-out</td><td style="padding:8px 0">${formatDate(check_out)}</td></tr>
      ${notes ? `<tr><td style="padding:8px 0;color:#888">Notes</td><td style="padding:8px 0;font-style:italic">${notes}</td></tr>` : ''}
    </table>
  `

  const results = await Promise.all([
    resend.emails.send({
      from: FROM,
      to: email,
      subject: tr.confirmSubject(APP_NAME, checkIn),
      html: bookerHtml,
    }),
    ...(ADMIN && ADMIN !== email
      ? [resend.emails.send({
          from: FROM,
          to: ADMIN,
          subject: `New booking by ${name} — ${formatDate(check_in)}`,
          html: adminHtml,
        })]
      : []),
  ])

  results.forEach((r, i) => {
    if (r.error) logger.error({ err: r.error }, `Email ${i} (booking confirmation) failed`)
    else logger.info({ emailId: r.data?.id }, `Email ${i} (booking confirmation) sent`)
  })
}

export async function sendDeclineEmail(booking: { name: string; email: string; check_in: string; check_out: string; reason?: string; locale?: string }) {
  const { name, email, check_in, check_out, reason, locale } = booking
  const tr = t(locale)
  const checkIn = formatDate(check_in, locale)
  const checkOut = formatDate(check_out, locale)

  const html = `
    <h2>${tr.declineTitle}</h2>
    <p>${tr.confirmIntro(name)}</p>
    <p>${tr.declineBody(APP_NAME)}</p>
    <table style="border-collapse:collapse;width:100%;max-width:400px">
      <tr><td style="padding:8px 0;color:#888">${tr.labelCheckIn}</td><td style="padding:8px 0;font-weight:bold">${checkIn}</td></tr>
      <tr><td style="padding:8px 0;color:#888">${tr.labelCheckOut}</td><td style="padding:8px 0;font-weight:bold">${checkOut}</td></tr>
    </table>
    ${reason ? `
    <div style="margin-top:20px;padding:12px 16px;background:#fef2f2;border-left:3px solid #ef4444;border-radius:4px">
      <p style="margin:0;color:#7f1d1d;font-size:14px"><strong>${tr.declineReason}</strong> ${reason}</p>
    </div>` : ''}
    <p style="margin-top:24px;color:#666">${tr.declineClosing}</p>
  `

  const result = await resend.emails.send({
    from: FROM,
    to: email,
    subject: tr.declineSubject(APP_NAME, checkIn),
    html,
  })

  if (result.error) logger.error({ err: result.error }, 'Decline email failed')
  else logger.info({ emailId: result.data?.id }, 'Decline email sent')
}

export async function sendPendingBookingEmails(booking: PendingBookingDetails) {
  const { name, email, notes, check_in, check_out, appUrl, locale } = booking
  const tr = t(locale)
  const checkIn = formatDate(check_in, locale)
  const checkOut = formatDate(check_out, locale)

  const bookerHtml = `
    <h2>${tr.pendingGuestTitle}</h2>
    <p>${tr.confirmIntro(name)}</p>
    <p>${tr.pendingGuestBody(APP_NAME)}</p>
    <table style="border-collapse:collapse;width:100%;max-width:400px">
      <tr><td style="padding:8px 0;color:#888">${tr.labelCheckIn}</td><td style="padding:8px 0;font-weight:bold">${checkIn}</td></tr>
      <tr><td style="padding:8px 0;color:#888">${tr.labelCheckOut}</td><td style="padding:8px 0;font-weight:bold">${checkOut}</td></tr>
      ${notes ? `<tr><td style="padding:8px 0;color:#888">${tr.labelNotes}</td><td style="padding:8px 0;font-style:italic">${notes}</td></tr>` : ''}
    </table>
    <p style="margin-top:24px;color:#666">${tr.pendingGuestClosing}</p>
  `

  const adminHtml = `
    <h2>New booking request at ${APP_NAME} (pending approval)</h2>
    <table style="border-collapse:collapse;width:100%;max-width:400px">
      <tr><td style="padding:8px 0;color:#888">Who</td><td style="padding:8px 0;font-weight:bold">${name} (${email})</td></tr>
      <tr><td style="padding:8px 0;color:#888">Check-in</td><td style="padding:8px 0">${formatDate(check_in)}</td></tr>
      <tr><td style="padding:8px 0;color:#888">Check-out</td><td style="padding:8px 0">${formatDate(check_out)}</td></tr>
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
      subject: tr.pendingGuestSubject(APP_NAME, checkIn),
      html: bookerHtml,
    }),
    ...(ADMIN && ADMIN !== email
      ? [resend.emails.send({
          from: FROM,
          to: ADMIN,
          subject: `Booking request by ${name} — ${formatDate(check_in)} (awaiting approval)`,
          html: adminHtml,
        })]
      : []),
  ])

  results.forEach((r, i) => {
    if (r.error) logger.error({ err: r.error }, `Email ${i} (pending notification) failed`)
    else logger.info({ emailId: r.data?.id }, `Email ${i} (pending notification) sent`)
  })
}
