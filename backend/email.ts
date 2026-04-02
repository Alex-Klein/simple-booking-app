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

// ─── Shared layout ────────────────────────────────────────────────────────────

function layout(body: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f1ed;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ed;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- Header -->
        <tr><td style="background:#4a6741;border-radius:12px 12px 0 0;padding:28px 32px;text-align:center;">
          <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">${APP_NAME}</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;padding:36px 32px;border-left:1px solid #e5ddd4;border-right:1px solid #e5ddd4;">
          ${body}
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f9f6f2;border:1px solid #e5ddd4;border-top:none;border-radius:0 0 12px 12px;padding:16px 32px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#a89880;">${APP_NAME}</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function detailsTable(rows: { label: string; value: string; bold?: boolean }[]) {
  const cells = rows.map((r, i) => `
    <tr style="background:${i % 2 === 0 ? '#f9f6f2' : '#ffffff'};">
      <td style="padding:12px 16px;font-size:13px;color:#7a6a5a;white-space:nowrap;width:110px;">${r.label}</td>
      <td style="padding:12px 16px;font-size:14px;color:#1a1a1a;${r.bold ? 'font-weight:600;' : ''}">${r.value}</td>
    </tr>`).join('')
  return `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #e5ddd4;margin:24px 0;">
    ${cells}
  </table>`
}

function primaryBtn(href: string, label: string, color = '#4a6741') {
  return `<table cellpadding="0" cellspacing="0" style="margin-top:24px;">
    <tr><td style="background:${color};border-radius:8px;">
      <a href="${href}" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">${label}</a>
    </td></tr>
  </table>`
}

// ─── Email senders ─────────────────────────────────────────────────────────────

export async function sendBookingEmails(booking: BookingDetails) {
  const { name, email, notes, check_in, check_out, cancelUrl, locale } = booking
  const tr = t(locale)
  const checkIn = formatDate(check_in, locale)
  const checkOut = formatDate(check_out, locale)

  const rows = [
    { label: tr.labelCheckIn, value: checkIn, bold: true },
    { label: tr.labelCheckOut, value: checkOut, bold: true },
    ...(notes ? [{ label: tr.labelNotes, value: `<em>${notes}</em>` }] : []),
  ]

  const bookerHtml = layout(`
    <h1 style="margin:0 0 8px;font-size:22px;color:#1a1a1a;">${tr.confirmTitle(APP_NAME)}</h1>
    <p style="margin:0 0 4px;font-size:15px;color:#3a3a3a;">${tr.confirmIntro(name)}</p>
    <p style="margin:0 0 8px;font-size:14px;color:#6b6b6b;">${tr.confirmBody}</p>
    ${detailsTable(rows)}
    <p style="margin:24px 0 0;font-size:14px;color:#6b6b6b;">${tr.confirmClosing}</p>
    ${cancelUrl ? `
    <hr style="margin:32px 0;border:none;border-top:1px solid #ede8e0;" />
    <p style="margin:0 0 8px;font-size:13px;color:#a89880;">${tr.cancelNote}</p>
    ${primaryBtn(cancelUrl, tr.cancelBtn, '#dc2626')}
    ` : ''}
  `)

  const adminRows = [
    { label: 'Guest', value: `${name} &lt;${email}&gt;`, bold: true },
    { label: 'Check-in', value: formatDate(check_in), bold: true },
    { label: 'Check-out', value: formatDate(check_out), bold: true },
    ...(notes ? [{ label: 'Notes', value: `<em>${notes}</em>` }] : []),
  ]

  const adminHtml = layout(`
    <h1 style="margin:0 0 8px;font-size:22px;color:#1a1a1a;">New booking at ${APP_NAME}</h1>
    <p style="margin:0 0 8px;font-size:14px;color:#6b6b6b;">A new reservation has been confirmed.</p>
    ${detailsTable(adminRows)}
  `)

  const results = await Promise.all([
    resend.emails.send({ from: FROM, to: email, subject: tr.confirmSubject(APP_NAME, checkIn), html: bookerHtml }),
    ...(ADMIN ? [resend.emails.send({ from: FROM, to: ADMIN, subject: `New booking by ${name} — ${formatDate(check_in)}`, html: adminHtml })] : []),
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

  const rows = [
    { label: tr.labelCheckIn, value: checkIn, bold: true },
    { label: tr.labelCheckOut, value: checkOut, bold: true },
  ]

  const html = layout(`
    <h1 style="margin:0 0 8px;font-size:22px;color:#1a1a1a;">${tr.declineTitle}</h1>
    <p style="margin:0 0 4px;font-size:15px;color:#3a3a3a;">${tr.confirmIntro(name)}</p>
    <p style="margin:0 0 8px;font-size:14px;color:#6b6b6b;">${tr.declineBody(APP_NAME)}</p>
    ${detailsTable(rows)}
    ${reason ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <tr><td style="background:#fef2f2;border-left:3px solid #dc2626;border-radius:4px;padding:12px 16px;font-size:14px;color:#7f1d1d;">
        <strong>${tr.declineReason}</strong> ${reason}
      </td></tr>
    </table>` : ''}
    <p style="margin:24px 0 0;font-size:14px;color:#6b6b6b;">${tr.declineClosing}</p>
  `)

  const result = await resend.emails.send({ from: FROM, to: email, subject: tr.declineSubject(APP_NAME, checkIn), html })

  if (result.error) logger.error({ err: result.error }, 'Decline email failed')
  else logger.info({ emailId: result.data?.id }, 'Decline email sent')
}

export async function sendPendingBookingEmails(booking: PendingBookingDetails) {
  const { name, email, notes, check_in, check_out, appUrl, locale } = booking
  const tr = t(locale)
  const checkIn = formatDate(check_in, locale)
  const checkOut = formatDate(check_out, locale)

  const rows = [
    { label: tr.labelCheckIn, value: checkIn, bold: true },
    { label: tr.labelCheckOut, value: checkOut, bold: true },
    ...(notes ? [{ label: tr.labelNotes, value: `<em>${notes}</em>` }] : []),
  ]

  const bookerHtml = layout(`
    <h1 style="margin:0 0 8px;font-size:22px;color:#1a1a1a;">${tr.pendingGuestTitle}</h1>
    <p style="margin:0 0 4px;font-size:15px;color:#3a3a3a;">${tr.confirmIntro(name)}</p>
    <p style="margin:0 0 8px;font-size:14px;color:#6b6b6b;">${tr.pendingGuestBody(APP_NAME)}</p>
    ${detailsTable(rows)}
    <p style="margin:24px 0 0;font-size:14px;color:#6b6b6b;">${tr.pendingGuestClosing}</p>
  `)

  const adminRows = [
    { label: 'Guest', value: `${name} &lt;${email}&gt;`, bold: true },
    { label: 'Check-in', value: formatDate(check_in), bold: true },
    { label: 'Check-out', value: formatDate(check_out), bold: true },
    ...(notes ? [{ label: 'Notes', value: `<em>${notes}</em>` }] : []),
  ]

  const adminHtml = layout(`
    <h1 style="margin:0 0 8px;font-size:22px;color:#1a1a1a;">New booking request at ${APP_NAME}</h1>
    <p style="margin:0 0 8px;font-size:14px;color:#6b6b6b;">A new request is waiting for your approval.</p>
    ${detailsTable(adminRows)}
    ${primaryBtn(`${appUrl}/admin`, 'Review in Admin Panel')}
  `)

  const results = await Promise.all([
    resend.emails.send({ from: FROM, to: email, subject: tr.pendingGuestSubject(APP_NAME, checkIn), html: bookerHtml }),
    ...(ADMIN ? [resend.emails.send({ from: FROM, to: ADMIN, subject: `Booking request by ${name} — ${formatDate(check_in)} (awaiting approval)`, html: adminHtml })] : []),
  ])

  results.forEach((r, i) => {
    if (r.error) logger.error({ err: r.error }, `Email ${i} (pending notification) failed`)
    else logger.info({ emailId: r.data?.id }, `Email ${i} (pending notification) sent`)
  })
}
