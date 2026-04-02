# Backlog

## Bugs / loose ends

- [x] **Nights count missing number** — fixed
- [x] **Verify back-to-back visuals** — confirmed working on prod
- [x] **Existing bookings off by one day** — only test data, no action needed

## Features

- [x] **Emails in guest's language** — locale sent at submission, guest emails in EN/DE accordingly
- [x] **Locale stored on booking** — persist locale in DB so admin-triggered emails (approve, decline) also go out in the guest's language
- [ ] **Block dates** — admin can mark date ranges as unavailable (maintenance, personal use)
- [ ] **Pre-arrival reminder email** — send guest a reminder N days before check-in (configurable via env var)
- [x] **Booking history** — keep a log of declined and cancelled bookings visible to admin (currently deleted from DB)
- [ ] **Export bookings to CSV** — download button in admin dashboard
- [x] **Branded email templates** — nicer HTML layout matching the app's look and feel
