<template>
  <div class="max-w-5xl mx-auto px-4 py-12">
    <h1 class="text-3xl font-serif text-cabin-800 dark:text-gray-100 mb-2">{{ t('book.title') }}</h1>
    <p class="text-cabin-600 dark:text-gray-400 mb-10">{{ t('book.subtitle') }}</p>

    <!-- Step 1: Date picker with availability -->
    <section class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-cabin-100 dark:border-gray-700 p-4 sm:p-6 mb-6">
      <div class="flex items-center justify-between mb-1">
        <h2 class="text-lg font-semibold text-cabin-800 dark:text-gray-100 flex items-center gap-2">
          <span class="bg-cabin-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
          {{ t('book.step1') }}
        </h2>
        <div class="flex items-center gap-2">
          <button
            @click="skipMonths(-6)"
            :disabled="!canGoBack"
            class="px-3 py-1.5 text-sm rounded-lg border border-cabin-200 dark:border-gray-600 text-cabin-600 dark:text-gray-300 hover:bg-cabin-50 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {{ t('book.prev6') }}
          </button>
          <button
            @click="skipMonths(6)"
            class="px-3 py-1.5 text-sm rounded-lg border border-cabin-200 dark:border-gray-600 text-cabin-600 dark:text-gray-300 hover:bg-cabin-50 dark:hover:bg-gray-700 transition-colors"
          >
            {{ t('book.next6') }}
          </button>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-cabin-500 dark:text-gray-400 mb-4">
        <span v-for="p in legend" :key="p.email" class="flex items-center gap-1.5">
          <span class="inline-block w-3 h-3 rounded-sm border" :class="SWATCH[p.color]"></span>
          {{ p.name }}
        </span>
        <span v-if="hasPendingBookings" class="flex items-center gap-1.5">
          <span
            class="inline-block w-3 h-3 rounded-sm border border-gray-400"
            style="background: repeating-linear-gradient(45deg, #d1d5db, #d1d5db 2px, transparent 2px, transparent 5px)"
          ></span>
          {{ t('book.legendPending') }}
        </span>
      </div>

      <VDatePicker
        ref="pickerRef"
        :model-value="dateRange"
        @update:model-value="onRangeUpdate"
        :min-date="today"
        :disabled-dates="disabledDates"
        :attributes="calendarAttributes"
        :locale="locale"
        :is-dark="isDark"
        :columns="calColumns"
        :rows="calRows"
        color="orange"
        is-expanded
        borderless
      />

      <div v-if="store.isDateRangeSelected" class="mt-4 bg-cabin-50 dark:bg-gray-700 border border-cabin-200 dark:border-gray-600 rounded-lg p-4 text-sm text-cabin-700 dark:text-gray-200 flex justify-between items-center">
        <div>
          <span class="font-medium">{{ formatDate(store.checkIn!) }}</span>
          <span class="mx-2 text-cabin-400 dark:text-gray-500">→</span>
          <span class="font-medium">{{ formatDate(store.checkOut!) }}</span>
        </div>
        <span class="font-semibold text-cabin-600 dark:text-cabin-400">{{ t('book.nights', store.nights) }}</span>
      </div>
      <p v-else class="text-sm text-cabin-400 dark:text-gray-500 text-center mt-2">{{ t('book.clickHint') }}</p>
    </section>

    <!-- Step 2: Guest info -->
    <section class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-cabin-100 dark:border-gray-700 p-6 mb-8">
      <h2 class="text-lg font-semibold text-cabin-800 dark:text-gray-100 mb-4 flex items-center gap-2">
        <span class="bg-cabin-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
        {{ t('book.step2') }}
      </h2>

      <div class="grid md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-cabin-700 dark:text-gray-300 mb-1">{{ t('book.name') }} *</label>
          <input
            v-model="store.guestInfo.name"
            type="text"
            placeholder="Jane Doe"
            class="w-full border border-cabin-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-cabin-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-cabin-400"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-cabin-700 dark:text-gray-300 mb-1">{{ t('book.email') }} *</label>
          <input
            v-model="store.guestInfo.email"
            type="email"
            placeholder="jane@example.com"
            class="w-full border border-cabin-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-cabin-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-cabin-400"
          />
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-cabin-700 dark:text-gray-300 mb-1">{{ t('book.notes') }}</label>
          <textarea
            v-model="store.guestInfo.notes"
            :placeholder="t('book.notesPlaceholder')"
            rows="4"
            class="w-full border border-cabin-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-cabin-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-cabin-400 resize-none"
          />
        </div>
      </div>
    </section>

    <p v-if="error" class="text-red-500 text-sm mb-4">{{ error }}</p>

    <button
      @click="submit"
      class="w-full bg-cabin-600 hover:bg-cabin-700 text-white font-semibold py-3 rounded-xl transition-colors text-lg"
    >
      {{ t('book.reviewBtn') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useBookingStore } from '../stores/booking'
import { useDarkMode } from '../composables/useDarkMode'

const store = useBookingStore()
const router = useRouter()
const { t, locale } = useI18n()
const { isDark } = useDarkMode()
const today = new Date()

// --- Responsive calendar layout ---
const isMobile = ref(window.innerWidth < 768)
window.addEventListener('resize', () => { isMobile.value = window.innerWidth < 768 })
const calColumns = computed(() => isMobile.value ? 1 : 3)
const calRows = computed(() => isMobile.value ? 2 : 2)

onMounted(() => store.fetchBookings())

// --- Navigation ---
const pickerRef = ref<{ moveBy: (n: number) => void } | null>(null)
const currentOffset = ref(0)

const canGoBack = computed(() => currentOffset.value > 0)

async function skipMonths(n: number) {
  if (n < 0 && !canGoBack.value) return
  await pickerRef.value?.moveBy(n)
  currentOffset.value += n
}

// Parse "YYYY-MM-DD" in local timezone (not UTC)
function localDate(str: string): Date {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// --- Disabled dates (blocks selection) ---
// Disabled range = (check_in + 1) to (check_out - 1), i.e. only the interior nights.
// This lets check_in be selected as a checkout for a prior booking, and
// check_out be selected as a check-in for a following booking (back-to-back).
const disabledDates = computed(() =>
  store.bookedPeriods.map((p) => {
    const start = localDate(p.check_in)
    start.setDate(start.getDate() + 1)
    const end = localDate(p.check_out)
    end.setDate(end.getDate() - 1)
    return { start, end }
  })
)

// --- Weekend dates ---
function getWeekendDates(): Date[] {
  const dates: Date[] = []
  const cursor = new Date(today.getFullYear(), today.getMonth(), 1)
  const limit = new Date(today.getFullYear() + 2, today.getMonth(), 1)
  while (cursor <= limit) {
    const day = cursor.getDay()
    if (day === 0 || day === 6) dates.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return dates
}

const weekendDates = getWeekendDates()

function firstNameOf(name: string) {
  return name.split(' ')[0]
}

// --- Per-person color assignment (stable, keyed by email) ---
const PALETTE: string[] = ['blue', 'purple', 'teal', 'green', 'orange', 'pink', 'indigo', 'red']

const SWATCH: Record<string, string> = {
  blue:   'bg-blue-200 border-blue-400',
  purple: 'bg-purple-200 border-purple-400',
  teal:   'bg-teal-200 border-teal-400',
  green:  'bg-green-200 border-green-400',
  orange: 'bg-orange-200 border-orange-400',
  pink:   'bg-pink-200 border-pink-400',
  indigo: 'bg-indigo-200 border-indigo-400',
  red:    'bg-red-200 border-red-400',
}

const personColors = computed(() => {
  const map = new Map<string, string>()
  store.bookedPeriods.forEach((p) => {
    if (!map.has(p.email)) {
      map.set(p.email, PALETTE[map.size % PALETTE.length])
    }
  })
  return map
})

const legend = computed(() =>
  [...personColors.value.entries()].map(([email, color]) => {
    const booking = store.bookedPeriods.find((p) => p.email === email)!
    return { email, color, name: firstNameOf(booking.name) }
  })
)

const hasPendingBookings = computed(() =>
  store.bookedPeriods.some((p) => p.status === 'pending')
)

const PENDING_STYLE = {
  backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(0,0,0,0.12) 3px, rgba(0,0,0,0.12) 6px)',
}

// --- Attributes ---
const calendarAttributes = computed(() => [
  {
    key: 'weekends',
    content: { class: 'font-bold' },
    dates: weekendDates,
  },
  ...store.bookedPeriods.flatMap((p) => {
    const color = personColors.value.get(p.email) ?? 'red'
    const isPending = p.status === 'pending'
    return [
      {
        // Range from check_in to check_out (inclusive).
        // v-calendar renders the start day as a right-half cap and the end day as a
        // left-half cap, so boundary days naturally look like "half a day" is booked.
        // On back-to-back bookings the shared day shows both halves in different colors.
        key: `${p.id}-highlight`,
        highlight: isPending
          ? { color, fillMode: 'light', style: PENDING_STYLE }
          : { color, fillMode: 'light' },
        dates: { start: localDate(p.check_in), end: localDate(p.check_out) },
      },
      {
        // Check-in label + popover (no extra dot — highlight cap already marks the day)
        key: `${p.id}-checkin`,
        label: firstNameOf(p.name),
        popover: {
          label: `${p.name} checks in${isPending ? ' (pending)' : ''}`,
          visibility: 'hover',
        },
        dates: localDate(p.check_in),
      },
      {
        // Check-out popover only — highlight end-cap already gives the visual
        key: `${p.id}-checkout`,
        popover: {
          label: `${firstNameOf(p.name)} checks out`,
          visibility: 'hover',
        },
        dates: localDate(p.check_out),
      },
    ]
  }),
])

// --- Date range binding ---
// Computed so the calendar always reflects store state (e.g. on back-navigation).
const dateRange = computed(() => ({ start: store.checkIn, end: store.checkOut }))

function onRangeUpdate(val: { start: Date; end: Date } | null) {
  if (val?.start && val?.end) {
    store.setDates(val.start, val.end)
  } else {
    store.clearDates()
  }
}

// --- Form ---
const error = ref('')

function formatDate(d: Date) {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function submit() {
  error.value = ''
  if (!store.isDateRangeSelected) {
    error.value = t('book.errors.noDates')
    return
  }
  const minStay = parseInt(import.meta.env.VITE_MIN_STAY ?? '2', 10)
  if (store.nights < minStay) {
    error.value = t('book.errors.minStay', { n: minStay })
    return
  }
  if (!store.guestInfo.name.trim()) {
    error.value = t('book.errors.noName')
    return
  }
  if (!store.guestInfo.email.trim() || !store.guestInfo.email.includes('@')) {
    error.value = t('book.errors.noEmail')
    return
  }
  router.push('/confirm')
}
</script>
