import axiosInstance from "./axiosInstance.js";

export const addToCart = (variantId, quantity) => {
    return axiosInstance.post('/cart/items', {variantId, quantity})
}

export const getCart = () => {
    return axiosInstance.get('/cart')
}

export const updateCartItem = (variantId, quantity) => {
    return axiosInstance.put(`/cart/items/${variantId}`, {quantity})
}

export const removeCartItem = (variantId) => {
    return axiosInstance.delete(`/cart/items/${variantId}`)
}