import axios from "axios";

const axiosInstance = axios.create({
    baseURL: '/api'
})

axiosInstance.interceptors.request.use((config) => {
    const user = JSON.parse(localStorage.getItem('user'))
    const sessionId = localStorage.getItem('sessionId')

    if(user?.token) {
        config.headers['Authorization'] = `Bearer ${user.token}`
    } else if(sessionId) {
        config.headers['X-Session-Id'] = sessionId
    }

    return config
})

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if(error.response?.status === 401) {
            localStorage.removeItem('user')
            window.location.href = "/login"
        }
        return Promise.reject(error)
    }
)

export default axiosInstance