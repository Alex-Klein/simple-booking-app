<template>
  <div class="min-h-[70vh] flex items-center justify-center px-4">
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-cabin-100 dark:border-gray-700 p-8 w-full max-w-sm">
      <h1 class="text-2xl font-serif text-cabin-800 dark:text-gray-100 mb-1">{{ t('login.title') }}</h1>
      <p class="text-sm text-cabin-500 dark:text-gray-400 mb-6">{{ t('login.subtitle') }}</p>

      <form @submit.prevent="submit">
        <label class="block text-sm font-medium text-cabin-700 dark:text-gray-300 mb-1">{{ t('login.password') }}</label>
        <input
          v-model="password"
          type="password"
          placeholder="••••••••"
          autofocus
          class="w-full border border-cabin-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-cabin-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-cabin-400 mb-4"
        />
        <p v-if="error" class="text-red-500 text-sm mb-3">{{ error }}</p>
        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-cabin-600 hover:bg-cabin-700 disabled:bg-cabin-300 text-white font-semibold py-2.5 rounded-xl transition-colors"
        >
          {{ loading ? t('login.signingIn') : t('login.signIn') }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'

const { t } = useI18n()
const auth = useAuthStore()
const router = useRouter()
const password = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  const result = await auth.login(password.value)
  loading.value = false
  if (result.ok) {
    router.push('/admin')
  } else {
    error.value = result.error ?? 'Login failed'
  }
}
</script>
