import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('admin_token'))

  const isAdmin = computed(() => !!token.value)

  async function login(password: string): Promise<{ ok: boolean; error?: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (!res.ok) {
      const body = await res.json()
      return { ok: false, error: body.error }
    }
    const { token: t } = await res.json()
    token.value = t
    localStorage.setItem('admin_token', t)
    return { ok: true }
  }

  function logout() {
    token.value = null
    localStorage.removeItem('admin_token')
  }

  function authHeaders() {
    return { Authorization: `Bearer ${token.value}` }
  }

  return { token, isAdmin, login, logout, authHeaders }
})
