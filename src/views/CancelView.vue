<template>
  <div class="max-w-md mx-auto px-6 py-16 text-center">

    <!-- Loading -->
    <div v-if="state === 'loading'" class="text-cabin-400 dark:text-gray-500">
      <div class="text-4xl mb-4">⏳</div>
      <p>Loading your reservation…</p>
    </div>

    <!-- Not found -->
    <div v-else-if="state === 'notfound'">
      <div class="text-4xl mb-4">🤔</div>
      <h1 class="text-2xl font-serif text-cabin-800 dark:text-gray-100 mb-3">Reservation not found</h1>
      <p class="text-cabin-500 dark:text-gray-400 mb-8">This link may have already been used or has expired.</p>
      <RouterLink to="/" class="bg-cabin-600 hover:bg-cabin-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors inline-block">
        Back to Home
      </RouterLink>
    </div>

    <!-- Confirm cancellation -->
    <div v-else-if="state === 'confirm' && booking">
      <div class="text-4xl mb-4">🏔️</div>
      <h1 class="text-2xl font-serif text-cabin-800 dark:text-gray-100 mb-2">Cancel your reservation?</h1>
      <p class="text-cabin-500 dark:text-gray-400 text-sm mb-6">This cannot be undone.</p>

      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-cabin-100 dark:border-gray-700 p-5 mb-8 text-left">
        <div class="text-cabin-700 dark:text-gray-200 space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-cabin-400 dark:text-gray-500">Name</span>
            <span class="font-medium">{{ booking.name }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-cabin-400 dark:text-gray-500">Check-in</span>
            <span class="font-medium">{{ formatDate(booking.check_in) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-cabin-400 dark:text-gray-500">Check-out</span>
            <span class="font-medium">{{ formatDate(booking.check_out) }}</span>
          </div>
        </div>
      </div>

      <div class="flex gap-3">
        <RouterLink to="/" class="flex-1 border border-cabin-200 dark:border-gray-600 text-cabin-700 dark:text-gray-300 hover:bg-cabin-50 dark:hover:bg-gray-700 font-semibold py-3 rounded-xl transition-colors">
          Keep it
        </RouterLink>
        <button
          @click="cancel"
          :disabled="cancelling"
          class="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {{ cancelling ? 'Cancelling…' : 'Yes, cancel' }}
        </button>
      </div>
    </div>

    <!-- Success -->
    <div v-else-if="state === 'cancelled'">
      <div class="text-4xl mb-4">✅</div>
      <h1 class="text-2xl font-serif text-cabin-800 dark:text-gray-100 mb-3">Reservation cancelled</h1>
      <p class="text-cabin-500 dark:text-gray-400 mb-8">Your reservation has been removed. The dates are now free for others.</p>
      <RouterLink to="/" class="bg-cabin-600 hover:bg-cabin-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors inline-block">
        Back to Home
      </RouterLink>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()
const token = route.query.token as string

type State = 'loading' | 'notfound' | 'confirm' | 'cancelled'
const state = ref<State>('loading')
const cancelling = ref(false)
const booking = ref<{ name: string; check_in: string; check_out: string } | null>(null)

onMounted(async () => {
  if (!token) { state.value = 'notfound'; return }
  const res = await fetch(`/api/cancel/${token}`)
  if (!res.ok) { state.value = 'notfound'; return }
  booking.value = await res.json()
  state.value = 'confirm'
})

function formatDate(str: string) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

async function cancel() {
  cancelling.value = true
  const res = await fetch(`/api/cancel/${token}`, { method: 'DELETE' })
  cancelling.value = false
  state.value = res.ok ? 'cancelled' : 'notfound'
}
</script>
