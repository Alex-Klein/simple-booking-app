<template>
  <div class="min-h-screen flex flex-col">
    <header class="bg-cabin-900 text-cabin-50 px-4 py-3 shadow-md">
      <div class="flex items-center justify-between">
        <RouterLink to="/" class="text-xl font-serif tracking-wide hover:text-cabin-100 transition-colors">
          🏔️ {{ appName }}
        </RouterLink>

        <!-- Desktop nav -->
        <nav class="hidden sm:flex gap-6 text-sm font-medium">
          <RouterLink to="/" class="hover:text-cabin-100 transition-colors" active-class="text-cabin-100 underline">
            {{ t('nav.home') }}
          </RouterLink>
          <RouterLink to="/book" class="hover:text-cabin-100 transition-colors" active-class="text-cabin-100 underline">
            {{ t('nav.book') }}
          </RouterLink>
          <RouterLink v-if="auth.isAdmin" to="/admin" class="hover:text-cabin-100 transition-colors" active-class="text-cabin-100 underline">
            {{ t('nav.admin') }}
          </RouterLink>
          <RouterLink v-else to="/login" class="hover:text-cabin-100 transition-colors text-cabin-400">
            {{ t('nav.admin') }}
          </RouterLink>
        </nav>

        <div class="flex items-center gap-2">
          <!-- Dark mode toggle -->
          <button
            @click="toggle()"
            class="px-2.5 py-1 rounded-lg border border-cabin-700 text-cabin-300 hover:text-white transition-colors text-sm"
            :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
          >
            {{ isDark ? '☀️' : '🌙' }}
          </button>

          <!-- Language switcher -->
          <div class="flex items-center gap-0 text-sm border border-cabin-700 rounded-lg overflow-hidden">
            <button
              @click="switchLang('de')"
              :class="locale === 'de' ? 'bg-cabin-700 text-white' : 'text-cabin-400 hover:text-white'"
              class="px-2.5 py-1 transition-colors"
            >DE</button>
            <button
              @click="switchLang('en')"
              :class="locale === 'en' ? 'bg-cabin-700 text-white' : 'text-cabin-400 hover:text-white'"
              class="px-2.5 py-1 transition-colors"
            >EN</button>
          </div>
        </div>
      </div>

      <!-- Mobile nav -->
      <nav class="flex sm:hidden justify-center gap-6 text-sm font-medium mt-2 pt-2 border-t border-cabin-800">
        <RouterLink to="/" class="hover:text-cabin-100 transition-colors" active-class="text-cabin-100 underline">
          {{ t('nav.home') }}
        </RouterLink>
        <RouterLink to="/book" class="hover:text-cabin-100 transition-colors" active-class="text-cabin-100 underline">
          {{ t('nav.book') }}
        </RouterLink>
        <RouterLink v-if="auth.isAdmin" to="/admin" class="hover:text-cabin-100 transition-colors" active-class="text-cabin-100 underline">
          {{ t('nav.admin') }}
        </RouterLink>
        <RouterLink v-else to="/login" class="hover:text-cabin-100 transition-colors text-cabin-400">
          {{ t('nav.admin') }}
        </RouterLink>
      </nav>
    </header>

    <main class="flex-1">
      <RouterView />
    </main>

    <footer class="bg-cabin-900 text-cabin-100 text-center text-sm py-4 mt-auto">
      &copy; {{ new Date().getFullYear() }} {{ appName }}. {{ t('footer') }}
    </footer>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from './stores/auth'
import { setLocale } from './i18n'
import { useDarkMode } from './composables/useDarkMode'

const auth = useAuthStore()
const { t, locale } = useI18n()
const { isDark, toggle } = useDarkMode()

const appName = import.meta.env.VITE_APP_NAME ?? 'Simple Booking App'

function switchLang(lang: 'en' | 'de') {
  setLocale(lang)
}
</script>
