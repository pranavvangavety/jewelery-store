import axiosInstance from './axiosInstance.js'

//Categories

export const adminGetAllCategories = () =>
    axiosInstance.get('/categories')

export const adminCreateCategory = (data) =>
    axiosInstance.post('/categories', data)
// data: { name, description }

export const adminDeleteCategory = (id) =>
    axiosInstance.delete(`/categories/${id}`)


// Products

export const adminGetAllProducts = () =>
    axiosInstance.get('/products/all')

export const adminGetProductById = (id) =>
    axiosInstance.get(`/products/all/${id}`)

export const adminCreateProduct = (data) =>
    axiosInstance.post('/products', data)
// data: { name, description, basePrice, categoryId, status }

export const adminUpdateProduct = (id, data) =>
    axiosInstance.put(`/products/${id}`, data)

export const adminUpdateProductStatus = (id, status) =>
    axiosInstance.patch(`/products/${id}/status`, null, { params: { status } })
// status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED'


// Variants

export const adminAddVariant = (productId, data) =>
    axiosInstance.post(`/products/${productId}/variants`, data)
// data: { sku, material, price, additionalInfo }

export const adminUpdateVariant = (productId, variantId, data) =>
    axiosInstance.put(`/products/${productId}/variants/${variantId}`, data)

export const adminDeleteVariant = (productId, variantId) =>
    axiosInstance.delete(`/products/${productId}/variants/${variantId}`)


// Images
export const adminAddImage = (productId, data) =>
    axiosInstance.post(`/products/${productId}/images`, data)
// data: { imageUrl, altText, displayOrder, primary }

export const adminDeleteImage = (productId, imageId) =>
    axiosInstance.delete(`/products/${productId}/images/${imageId}`)

export const adminSetPrimaryImage = (productId, imageId) =>
    axiosInstance.patch(`/products/${productId}/images/${imageId}/primary`)


// INVENTORY


export const adminGetAllInventory = () =>
    axiosInstance.get('/inventory')

export const adminGetInventoryByVariant = (variantId) =>
    axiosInstance.get(`/inventory/${variantId}`)

export const adminCreateInventory = (data) =>
    axiosInstance.post('/inventory', data)
// data: { variantId, quantityAvailable }

export const adminUpdateInventory = (variantId, data) =>
    axiosInstance.put(`/inventory/${variantId}`, data)
// data: { quantityAvailable }



// ORDERS


export const adminGetAllOrders = () =>
    axiosInstance.get('/orders/all')

export const adminGetOrderById = (orderId) =>
    axiosInstance.get(`/orders/${orderId}`)