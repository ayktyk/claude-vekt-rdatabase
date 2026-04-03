import axios from 'axios'
import { toast } from 'sonner'

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // httpOnly cookie'leri her istekte gönder
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }

  return config
})

let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: unknown) => void
  reject: (reason?: unknown) => void
}> = []

function processQueue(error: unknown) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(undefined)
  })
  failedQueue = []
}

// Response interceptor — merkezi hata yönetimi
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // 401: Token süresi dolmuş — refresh dene
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Login veya refresh endpoint'lerinde 401 alırsa döngüye girme
      if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        await axios.post('/api/auth/refresh', {}, { withCredentials: true })
        processQueue(null)
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError)
        // Refresh başarısız — login'e yönlendir
        if (window.location.pathname !== '/login') {
          toast.error('Oturum süresi doldu. Tekrar giriş yapın.')
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // 403: Yetki yok
    if (error.response?.status === 403) {
      toast.error('Bu işlem için yetkiniz bulunmuyor.')
    }

    // 422: Validasyon hatası — form'a bırak, global toast yok
    if (error.response?.status === 422) {
      return Promise.reject(error)
    }

    // 500+: Sunucu hatası
    if (error.response?.status >= 500) {
      toast.error('Sunucu hatası oluştu. Lütfen tekrar deneyin.')
    }

    // Ağ hatası
    if (!error.response) {
      toast.error('Bağlantı hatası. İnternet bağlantınızı kontrol edin.')
    }

    return Promise.reject(error)
  }
)

export default api
