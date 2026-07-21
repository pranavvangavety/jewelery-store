import axiosInstance from "./axiosInstance.js";

export const loginUser = (email, password) => {
    return axiosInstance.post('/auth/login', {email, password})
}

export const registerUser = (firstName, lastName, email, password) => {
    return axiosInstance.post(`/auth/register`, {firstName, lastName, email, password})
}

export const verifyEmail = (token) => {
    return axiosInstance.get('/auth/verify-email', { params: { token } })
}

export const forgotPassword = (email) => {
    return axiosInstance.post('/auth/forgot-password', { email })
}

export const resetPassword = (token, newPassword) => {
    return axiosInstance.post('/auth/reset-password', { token, newPassword })
}

export const changePassword = (currentPassword, newPassword) => {
    return axiosInstance.post('/auth/change-password', { currentPassword, newPassword })
}

export const resendVerification = (email) => {
    return axiosInstance.post('/auth/resend-verification', { email })
}

export const logoutUser = () => {
    return axiosInstance.post('/auth/logout')
}