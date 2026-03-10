import axiosInstance from "./axiosInstance.js";

export const placeOrder = (orderData) => {
    return axiosInstance.post(`/orders`, orderData)
}

export const getOrderById = (orderId) => {
    return axiosInstance.get(`/orders/${orderId}`)
}

export const getOrdersByUser = () => {
    return axiosInstance.get(`/orders/history`)
}