# Backlog

## Bugs / loose ends

- [ ] **Nights count missing number** — the summary bar may show "nights" without the digit in front; should read "3 nights" not just "nights"
- [ ] **Verify back-to-back visuals** — confirm half-day range caps and merged tooltip look correct in production after latest calendar changes
- [ ] **Existing bookings shifted by one day** — the UTC→local timezone fix may have silently stored wrong dates for bookings made before the fix; worth reviewing any bookings that pre-date the fix
- [ ] **Resend email broken** — `FROM_EMAIL` must use a domain verified in Resend; `hugishues.li` needs DNS records added in OpenSRS and verified in the Resend dashboard (or use `onboarding@resend.dev` temporarily)

## Infrastructure

- [ ] **www subdomain** — add an A record for `www.hugishues.li` → `83.228.208.33` in OpenSRS, then re-run `init-ssl.sh` (or expand the cert with `-d www.hugishues.li`) and verify the nginx redirect works

## Features

- [ ] **Block dates** — admin can mark date ranges as unavailable (maintenance, personal use) so guests cannot book them
- [ ] **Pre-arrival reminder email** — send guest a reminder N days before check-in (configurable via env var)
- [ ] **Export bookings to CSV** — download button in admin dashboard for simple record-keeping
- [ ] **Guest count in admin cards** — show number of guests next to each booking in the dashboard list
- [ ] **Booking history** — keep a log of declined and cancelled bookings visible to admin (currently deleted from DB)
- [ ] **Branded email templates** — replace plain-text emails with a simple HTML template matching the app's look
