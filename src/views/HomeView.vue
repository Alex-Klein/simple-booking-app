<template>
  <div>
    <!-- Hero -->
    <section class="relative h-screen bg-cabin-900 flex items-center justify-center overflow-hidden">
      <div class="absolute inset-0 bg-cover bg-center opacity-50" :style="{ backgroundImage: 'url(/bg.jpg)' }" />
      <div class="relative text-center text-white px-4">
        <h1 class="text-5xl font-serif mb-4 drop-shadow-lg">{{ appName }}</h1>
        <p class="text-xl text-cabin-100 mb-8 drop-shadow">{{ t('home.subtitle') }}</p>
        <RouterLink
          to="/book"
          class="bg-cabin-500 hover:bg-cabin-600 text-white font-semibold px-8 py-3 rounded-lg transition-colors shadow-lg text-lg"
        >
          {{ t('home.cta') }}
        </RouterLink>
      </div>
    </section>

    <!-- CTA -->
    <section class="bg-cabin-800 text-white text-center py-12 px-6">
      <h2 class="text-3xl font-serif mb-3">{{ t('home.ctaSection') }}</h2>
      <p class="text-cabin-100 mb-8">{{ t('home.ctaBody') }}</p>
      <RouterLink
        to="/book"
        class="bg-cabin-500 hover:bg-cabin-600 text-white font-semibold px-10 py-3 rounded-lg transition-colors text-lg"
      >
        {{ t('home.ctaButton') }}
      </RouterLink>
    </section>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const appName = import.meta.env.VITE_APP_NAME ?? 'Simple Booking App'
</script>
