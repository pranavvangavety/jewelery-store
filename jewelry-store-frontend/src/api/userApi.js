import axiosInstance from "./axiosInstance.js";

export const getMyProfile = () => {
    return axiosInstance.get('/users/me')
}

export const addAddress = (addressData) => {
    return axiosInstance.post('/users/me/addresses', addressData)
}

export const updateProfile = (profileData) => {
    return axiosInstance.put('/users/me', profileData)
}

export const deleteAddress = (addressId) => {
    return axiosInstance.delete(`/users/me/addresses/${addressId}`)
}

export const setDefaultAddress = (addressId) => {
    return axiosInstance.patch(`/users/me/addresses/${addressId}/default`)
}