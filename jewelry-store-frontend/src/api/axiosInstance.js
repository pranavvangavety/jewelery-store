import axios from "axios";

const axiosInstance = axios.create({
    baseURL: '/api',
    withCredentials: true
})

axiosInstance.interceptors.request.use((config) => {
    const user = JSON.parse(localStorage.getItem('user'))
    const sessionId = localStorage.getItem('sessionId')

    const publicAuthPaths = [
        '/auth/login',
        '/auth/register',
        '/auth/forgot-password',
        '/auth/reset-password',
        '/auth/verify-email',
        '/auth/resend-verification',
    ]
    const isPublicAuth = publicAuthPaths.some(p => config.url?.startsWith(p))

    // logged-in requests rely on the httpOnly cookie now
    if(!(user?.token && !isPublicAuth) && sessionId) {
        config.headers['X-Session-Id'] = sessionId
    }

    return config
})

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        const url = error.config?.url || ''
        if(error.response?.status === 401 && !url.includes('/auth/')) {
            localStorage.removeItem('user')
            window.location.href = "/login"
        }
        return Promise.reject(error)
    }
)

export default axiosInstance