<template>
  <div class="max-w-7xl mx-auto px-6 py-12">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-serif text-cabin-800 dark:text-gray-100">{{ t('admin.title') }}</h1>
        <p class="text-cabin-500 dark:text-gray-400 text-sm mt-1">{{ t('admin.bookingsCount', bookings.length) }} total</p>
      </div>
      <div class="flex items-center gap-3">
        <!-- iCal feed URL -->
        <div v-if="calendarUrl" class="flex items-center gap-2 bg-cabin-50 dark:bg-gray-700 border border-cabin-200 dark:border-gray-600 rounded-lg px-3 py-1.5">
          <span class="text-xs text-cabin-500 dark:text-gray-400">{{ t('admin.calendarSubscribe') }}</span>
          <svg class="w-4 h-4 text-cabin-400 dark:text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          <span class="text-xs text-cabin-500 dark:text-gray-400 font-mono max-w-[260px] truncate">{{ calendarUrl }}</span>
          <button @click="copyCalendarUrl" class="text-cabin-400 dark:text-gray-400 hover:text-cabin-700 dark:hover:text-gray-200 transition-colors" :title="t('admin.calendarCopy')">
            <svg v-if="!copied" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
            <svg v-else class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
          </button>
        </div>
        <button
          @click="auth.logout(); router.push('/')"
          class="text-sm text-cabin-500 dark:text-gray-400 hover:text-cabin-700 dark:hover:text-gray-200 border border-cabin-200 dark:border-gray-600 px-3 py-1.5 rounded-lg transition-colors"
        >
          {{ t('admin.signOut') }}
        </button>
      </div>
    </div>

    <!-- Bookings table -->
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-cabin-100 dark:border-gray-700 overflow-hidden">
      <div v-if="loading" class="p-12 text-center text-cabin-400 dark:text-gray-500">{{ t('admin.loading') }}</div>
      <div v-else-if="bookings.length === 0" class="p-12 text-center text-cabin-400 dark:text-gray-500">{{ t('admin.noBookings') }}</div>
      <div v-else class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-cabin-50 dark:bg-gray-700 text-cabin-500 dark:text-gray-400 uppercase text-xs tracking-wider">
          <tr>
            <th class="px-4 py-3 text-left">{{ t('admin.colName') }}</th>
            <th class="px-4 py-3 text-left">{{ t('admin.colEmail') }}</th>
            <th class="px-4 py-3 text-left">{{ t('admin.colCheckIn') }}</th>
            <th class="px-4 py-3 text-left">{{ t('admin.colCheckOut') }}</th>
            <th class="px-4 py-3 text-center">{{ t('admin.colGuests') }}</th>
            <th class="px-4 py-3 text-left">{{ t('admin.colNotes') }}</th>
            <th class="px-4 py-3 text-left">{{ t('admin.colBookedOn') }}</th>
            <th class="px-4 py-3 text-left">{{ t('admin.colStatus') }}</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-cabin-50 dark:divide-gray-700">
          <tr v-for="b in bookings" :key="b.id" class="hover:bg-cabin-50 dark:hover:bg-gray-700 transition-colors">
            <td class="px-4 py-3 font-medium text-cabin-800 dark:text-gray-100">{{ b.name }}</td>
            <td class="px-4 py-3 text-cabin-600 dark:text-gray-300">{{ b.email }}</td>
            <td class="px-4 py-3 dark:text-gray-300">{{ formatDate(b.check_in) }}</td>
            <td class="px-4 py-3 dark:text-gray-300">{{ formatDate(b.check_out) }}</td>
            <td class="px-4 py-3 text-center dark:text-gray-300">{{ b.guests }}</td>
            <td class="px-4 py-3 text-cabin-500 dark:text-gray-400 italic">{{ b.notes || '—' }}</td>
            <td class="px-4 py-3 text-cabin-400 dark:text-gray-500 text-xs">{{ formatDateTime(b.created_at) }}</td>
            <td class="px-4 py-3">
              <span
                :class="b.status === 'pending'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                  : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'"
                class="px-2 py-0.5 rounded-full text-xs font-medium"
              >
                {{ b.status === 'pending' ? t('admin.statusPending') : t('admin.statusConfirmed') }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="flex gap-2 justify-end">
                <button
                  v-if="b.status === 'pending'"
                  @click="approveBooking(b)"
                  class="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 px-2 py-1 rounded hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
                >
                  {{ t('admin.approve') }}
                </button>
                <button
                  v-if="b.status === 'pending'"
                  @click="openDecline(b)"
                  class="text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                >
                  {{ t('admin.decline') }}
                </button>
                <button
                  @click="openEdit(b)"
                  class="text-cabin-500 dark:text-gray-400 hover:text-cabin-700 dark:hover:text-gray-200 px-2 py-1 rounded hover:bg-cabin-100 dark:hover:bg-gray-600 transition-colors"
                >
                  {{ t('admin.edit') }}
                </button>
                <button
                  @click="confirmDelete(b)"
                  class="text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                >
                  {{ t('admin.delete') }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>

    <!-- Edit modal -->
    <div v-if="editTarget" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 class="text-xl font-serif text-cabin-800 dark:text-gray-100 mb-5">{{ t('admin.editTitle') }}</h2>
        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-2">
            <label class="block text-xs font-medium text-cabin-600 dark:text-gray-400 mb-1">{{ t('admin.colName') }}</label>
            <input v-model="editForm.name" class="w-full border border-cabin-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-cabin-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-cabin-400 text-sm" />
          </div>
          <div class="col-span-2">
            <label class="block text-xs font-medium text-cabin-600 dark:text-gray-400 mb-1">{{ t('admin.colEmail') }}</label>
            <input v-model="editForm.email" type="email" class="w-full border border-cabin-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-cabin-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-cabin-400 text-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium text-cabin-600 dark:text-gray-400 mb-1">{{ t('admin.colCheckIn') }}</label>
            <input v-model="editForm.check_in" type="date" class="w-full border border-cabin-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-cabin-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-cabin-400 text-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium text-cabin-600 dark:text-gray-400 mb-1">{{ t('admin.colCheckOut') }}</label>
            <input v-model="editForm.check_out" type="date" class="w-full border border-cabin-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-cabin-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-cabin-400 text-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium text-cabin-600 dark:text-gray-400 mb-1">{{ t('admin.colGuests') }}</label>
            <select v-model="editForm.guests" class="w-full border border-cabin-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-cabin-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-cabin-400 text-sm">
              <option v-for="n in 4" :key="n" :value="n">{{ n }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-cabin-600 dark:text-gray-400 mb-1">{{ t('admin.colNotes') }}</label>
            <input v-model="editForm.notes" class="w-full border border-cabin-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-cabin-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-cabin-400 text-sm" />
          </div>
        </div>
        <p v-if="editError" class="text-red-500 text-sm mt-3">{{ editError }}</p>
        <div class="flex gap-3 mt-5">
          <button @click="editTarget = null" class="flex-1 border border-cabin-200 dark:border-gray-600 text-cabin-600 dark:text-gray-300 hover:bg-cabin-50 dark:hover:bg-gray-700 py-2 rounded-xl transition-colors">
            {{ t('admin.cancel') }}
          </button>
          <button @click="saveEdit" :disabled="saving" class="flex-1 bg-cabin-600 hover:bg-cabin-700 disabled:bg-cabin-300 text-white font-semibold py-2 rounded-xl transition-colors">
            {{ saving ? t('admin.saving') : t('admin.save') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Decline modal -->
    <div v-if="declineTarget" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 class="text-xl font-serif text-cabin-800 dark:text-gray-100 mb-1">{{ t('admin.declineTitle') }}</h2>
        <p class="text-cabin-500 dark:text-gray-400 text-sm mb-5">
          <strong>{{ declineTarget.name }}</strong> — {{ formatDate(declineTarget.check_in) }} → {{ formatDate(declineTarget.check_out) }}
        </p>
        <label class="block text-xs font-medium text-cabin-600 dark:text-gray-400 mb-1">{{ t('admin.declineReasonLabel') }}</label>
        <textarea
          v-model="declineReason"
          :placeholder="t('admin.declineReasonPlaceholder')"
          rows="3"
          class="w-full border border-cabin-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-cabin-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-400 text-sm resize-none"
        />
        <div class="flex gap-3 mt-5">
          <button @click="declineTarget = null" class="flex-1 border border-cabin-200 dark:border-gray-600 text-cabin-600 dark:text-gray-300 hover:bg-cabin-50 dark:hover:bg-gray-700 py-2 rounded-xl transition-colors">
            {{ t('admin.cancel') }}
          </button>
          <button @click="doDecline" :disabled="saving" class="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-200 text-white font-semibold py-2 rounded-xl transition-colors">
            {{ saving ? t('admin.declining') : t('admin.declineConfirm') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete confirmation modal -->
    <div v-if="deleteTarget" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
        <h2 class="text-xl font-serif text-cabin-800 dark:text-gray-100 mb-2">{{ t('admin.deleteTitle') }}</h2>
        <p class="text-cabin-500 dark:text-gray-400 text-sm mb-6">
          <strong>{{ deleteTarget.name }}</strong> — {{ formatDate(deleteTarget.check_in) }} → {{ formatDate(deleteTarget.check_out) }}
        </p>
        <div class="flex gap-3">
          <button @click="deleteTarget = null" class="flex-1 border border-cabin-200 dark:border-gray-600 text-cabin-600 dark:text-gray-300 hover:bg-cabin-50 dark:hover:bg-gray-700 py-2 rounded-xl transition-colors">
            {{ t('admin.cancel') }}
          </button>
          <button @click="doDelete" :disabled="saving" class="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-200 text-white font-semibold py-2 rounded-xl transition-colors">
            {{ saving ? t('admin.deleting') : t('admin.delete') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'

interface Booking {
  id: number
  name: string
  email: string
  guests: number
  notes: string
  check_in: string
  check_out: string
  created_at: string
  status: string
}

const { t } = useI18n()
const auth = useAuthStore()
const router = useRouter()
const bookings = ref<Booking[]>([])
const loading = ref(true)
const saving = ref(false)
const calendarUrl = ref('')
const copied = ref(false)

const editTarget = ref<Booking | null>(null)
const editError = ref('')
const editForm = reactive({ name: '', email: '', guests: 2, notes: '', check_in: '', check_out: '' })

const deleteTarget = ref<Booking | null>(null)
const declineTarget = ref<Booking | null>(null)
const declineReason = ref('')

async function fetchBookings() {
  loading.value = true
  const res = await fetch('/api/bookings', { headers: auth.authHeaders() })
  bookings.value = await res.json()
  loading.value = false
}

async function fetchCalendarUrl() {
  const res = await fetch('/api/calendar.ics/url', { headers: auth.authHeaders() })
  if (res.ok) {
    const data = await res.json()
    calendarUrl.value = data.url
  }
}

async function copyCalendarUrl() {
  try {
    await navigator.clipboard.writeText(calendarUrl.value)
  } catch {
    // Fallback for HTTP (no clipboard API)
    const el = document.createElement('textarea')
    el.value = calendarUrl.value
    el.style.position = 'fixed'
    el.style.opacity = '0'
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
  }
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

onMounted(() => {
  fetchBookings()
  fetchCalendarUrl()
})

function formatDate(str: string) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDateTime(str: string) {
  return new Date(str).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function openEdit(b: Booking) {
  editTarget.value = b
  editError.value = ''
  Object.assign(editForm, { name: b.name, email: b.email, guests: b.guests, notes: b.notes, check_in: b.check_in, check_out: b.check_out })
}

async function saveEdit() {
  editError.value = ''
  saving.value = true
  const res = await fetch(`/api/bookings/${editTarget.value!.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...auth.authHeaders() },
    body: JSON.stringify(editForm),
  })
  saving.value = false
  if (!res.ok) {
    const body = await res.json()
    editError.value = body.error ?? 'Save failed'
    return
  }
  editTarget.value = null
  await fetchBookings()
}

function confirmDelete(b: Booking) {
  deleteTarget.value = b
}

function openDecline(b: Booking) {
  declineTarget.value = b
  declineReason.value = ''
}

async function doDecline() {
  saving.value = true
  await fetch(`/api/bookings/${declineTarget.value!.id}/decline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth.authHeaders() },
    body: JSON.stringify({ reason: declineReason.value }),
  })
  saving.value = false
  declineTarget.value = null
  await fetchBookings()
}

async function approveBooking(b: Booking) {
  saving.value = true
  await fetch(`/api/bookings/${b.id}/confirm`, {
    method: 'POST',
    headers: auth.authHeaders(),
  })
  saving.value = false
  await fetchBookings()
}

async function doDelete() {
  saving.value = true
  await fetch(`/api/bookings/${deleteTarget.value!.id}`, {
    method: 'DELETE',
    headers: auth.authHeaders(),
  })
  saving.value = false
  deleteTarget.value = null
  await fetchBookings()
}
</script>
