import axiosInstance from "./axiosInstance.js";


export const getAllCategories = () => {
    return axiosInstance.get('/categories')
}

export const getAllProducts = (categoryId) => {
    const params = categoryId ? {categoryId} : {}
    return axiosInstance.get('/products', {params})
}

export const getProductById = (id) => {
    return axiosInstance.get(`/products/${id}`)
}

export const getVariantDetails = (variantId) => {
    return axiosInstance.get(`/products/variants/${variantId}/details`)
}