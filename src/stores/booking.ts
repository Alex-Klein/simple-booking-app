import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface GuestInfo {
  name: string
  email: string
  notes: string
}

export interface BookedPeriod {
  id?: number
  name: string
  email: string
  check_in: string
  check_out: string
  status?: string
}

export const useBookingStore = defineStore('booking', () => {
  const bookedPeriods = ref<BookedPeriod[]>([])

  const checkIn = ref<Date | null>(null)
  const checkOut = ref<Date | null>(null)
  const guestInfo = ref<GuestInfo>({
    name: '',
    email: '',
    notes: '',
  })

  const nights = computed(() => {
    if (!checkIn.value || !checkOut.value) return 0
    const diff = checkOut.value.getTime() - checkIn.value.getTime()
    return Math.round(diff / (1000 * 60 * 60 * 24))
  })

  const isDateRangeSelected = computed(() => checkIn.value !== null && checkOut.value !== null)

  async function fetchBookings() {
    const res = await fetch('/api/bookings')
    bookedPeriods.value = await res.json()
  }

  async function createBooking(locale = 'en'): Promise<{ ok: boolean; status?: string; error?: string }> {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: guestInfo.value.name,
        email: guestInfo.value.email,
        notes: guestInfo.value.notes,
        check_in: toDateString(checkIn.value!),
        check_out: toDateString(checkOut.value!),
        locale,
      }),
    })
    if (!res.ok) {
      const body = await res.json()
      return { ok: false, error: body.error }
    }
    const data = await res.json()
    await fetchBookings()
    return { ok: true, status: data.status }
  }

  function toDateString(d: Date) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  function setDates(start: Date, end: Date) {
    checkIn.value = start
    checkOut.value = end
  }

  function clearDates() {
    checkIn.value = null
    checkOut.value = null
  }

  function reset() {
    clearDates()
    guestInfo.value = { name: '', email: '', notes: '' }
  }

  return {
    bookedPeriods,
    checkIn,
    checkOut,
    guestInfo,
    nights,
    isDateRangeSelected,
    fetchBookings,
    createBooking,
    setDates,
    clearDates,
    reset,
  }
})
