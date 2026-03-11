import axiosInstance from "./axiosInstance.js";

export const getMyProfile = () => {
    return axiosInstance.get('/users/me')
}

export const addAddress = (addressData) => {
    return axiosInstance.post('/users/me/addresses', addressData)
}