import { ref } from 'vue'

const prefersDark = window.matchMedia('(prefers-color-scheme: dark)')
const saved = localStorage.getItem('darkMode')
const isDark = ref(saved !== null ? saved === 'true' : prefersDark.matches)

function applyDark(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark)
  localStorage.setItem('darkMode', String(dark))
}

// Apply on load
applyDark(isDark.value)

// Follow system changes only if user hasn't manually set a preference
prefersDark.addEventListener('change', (e) => {
  if (localStorage.getItem('darkMode') === null) {
    isDark.value = e.matches
    applyDark(e.matches)
  }
})

export function useDarkMode() {
  function toggle() {
    isDark.value = !isDark.value
    applyDark(isDark.value)
  }
  return { isDark, toggle }
}
