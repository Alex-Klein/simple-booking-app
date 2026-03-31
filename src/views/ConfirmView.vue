<template>
  <div class="max-w-xl mx-auto px-6 py-12">

    <!-- Success state -->
    <div v-if="confirmed" class="text-center">
      <div class="text-6xl mb-4">{{ bookingStatus === 'pending' ? '🕐' : '🎉' }}</div>
      <h1 class="text-3xl font-serif text-cabin-800 dark:text-gray-100 mb-3">
        {{ bookingStatus === 'pending' ? t('confirm.pendingTitle') : t('confirm.successTitle') }}
      </h1>
      <p class="text-cabin-600 dark:text-gray-400 mb-6">
        {{ bookingStatus === 'pending' ? t('confirm.pendingBody') : t('confirm.successBody') }}
        <strong>{{ store.guestInfo.email }}</strong>.
      </p>
      <RouterLink
        to="/"
        @click="store.reset()"
        class="bg-cabin-600 hover:bg-cabin-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors inline-block"
      >
        {{ t('confirm.backHome') }}
      </RouterLink>
    </div>

    <!-- Review state -->
    <div v-else>
      <h1 class="text-3xl font-serif text-cabin-800 dark:text-gray-100 mb-2">{{ t('confirm.title') }}</h1>
      <p class="text-cabin-500 dark:text-gray-400 mb-8 text-sm">{{ t('confirm.subtitle') }}</p>

      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-cabin-100 dark:border-gray-700 shadow-sm divide-y divide-cabin-50 dark:divide-gray-700">
        <div class="p-5">
          <h3 class="text-xs font-semibold uppercase tracking-widest text-cabin-400 dark:text-gray-500 mb-3">{{ t('confirm.stay') }}</h3>
          <div class="flex justify-between text-cabin-700 dark:text-gray-200">
            <div>
              <div class="text-xs text-cabin-400 dark:text-gray-500 mb-0.5">{{ t('confirm.checkIn') }}</div>
              <div class="font-semibold">{{ formatDate(store.checkIn!) }}</div>
            </div>
            <div class="text-cabin-300 dark:text-gray-600 text-xl self-center">→</div>
            <div class="text-right">
              <div class="text-xs text-cabin-400 dark:text-gray-500 mb-0.5">{{ t('confirm.checkOut') }}</div>
              <div class="font-semibold">{{ formatDate(store.checkOut!) }}</div>
            </div>
          </div>
          <p class="text-sm text-cabin-500 dark:text-gray-400 mt-3">{{ t('book.nights', store.nights) }}</p>
        </div>

        <div class="p-5">
          <h3 class="text-xs font-semibold uppercase tracking-widest text-cabin-400 dark:text-gray-500 mb-3">{{ t('confirm.guest') }}</h3>
          <div class="text-cabin-700 dark:text-gray-200 space-y-1">
            <div class="font-semibold">{{ store.guestInfo.name }}</div>
            <div class="text-sm">{{ store.guestInfo.email }}</div>
            <div v-if="store.guestInfo.notes" class="text-sm text-cabin-500 dark:text-gray-400 italic">"{{ store.guestInfo.notes }}"</div>
          </div>
        </div>
      </div>

      <p v-if="error" class="mt-4 text-red-500 text-sm">{{ error }}</p>

      <div class="flex gap-3 mt-4">
        <RouterLink
          to="/book"
          class="flex-1 text-center border border-cabin-300 dark:border-gray-600 text-cabin-700 dark:text-gray-300 hover:bg-cabin-100 dark:hover:bg-gray-700 font-semibold py-3 rounded-xl transition-colors"
        >
          {{ t('confirm.editBtn') }}
        </RouterLink>
        <button
          @click="confirm"
          :disabled="submitting"
          class="flex-1 bg-cabin-600 hover:bg-cabin-700 disabled:bg-cabin-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {{ submitting ? t('confirm.confirming') : t('confirm.confirmBtn') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useBookingStore } from '../stores/booking'

const { t } = useI18n()
const store = useBookingStore()
const router = useRouter()
const confirmed = ref(false)
const bookingStatus = ref<string>('confirmed')
const submitting = ref(false)
const error = ref('')

if (!store.isDateRangeSelected || !store.guestInfo.name) {
  router.push('/book')
}

function formatDate(d: Date) {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

async function confirm() {
  submitting.value = true
  error.value = ''
  const result = await store.createBooking()
  submitting.value = false
  if (result.ok) {
    bookingStatus.value = result.status ?? 'confirmed'
    confirmed.value = true
  } else {
    error.value = result.error ?? 'Something went wrong.'
  }
}
</script>
