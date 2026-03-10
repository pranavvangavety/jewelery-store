import axiosInstance from "./axiosInstance.js";

export const loginUser = (email, password) => {
    return axiosInstance.post('/auth/login', {email, password})
}

export const registerUser = (firstName, lastName, email, password) => {
    return axiosInstance.post(`/auth/register`, {firstName, lastName, email, password})
}