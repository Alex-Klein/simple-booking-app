# Backlog

## Bugs / loose ends

- [ ] **Nights count missing number** — summary bar shows "nights" without the digit; should read e.g. "3 nights"
- [ ] **Verify back-to-back visuals** — confirm half-day range caps and merged tooltip look correct in production
- [ ] **Existing bookings off by one day** — the UTC→local timezone fix may have shifted dates for bookings made before the fix; worth a manual check

## Features

- [ ] **Emails in guest's language** — detect the browser language at submission time and send emails in EN or DE accordingly
- [ ] **Block dates** — admin can mark date ranges as unavailable (maintenance, personal use)
- [ ] **Pre-arrival reminder email** — send guest a reminder N days before check-in (configurable via env var)
- [ ] **Booking history** — keep a log of declined and cancelled bookings visible to admin (currently deleted from DB)
- [ ] **Export bookings to CSV** — download button in admin dashboard
- [ ] **Branded email templates** — nicer HTML layout matching the app's look and feel
