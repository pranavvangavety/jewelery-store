import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getAllProducts } from "../api/productApi.js";
import ProductCard from "../components/ProductCard.jsx";
import "./ProductsPage.css";

export default function ProductsPage() {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const [searchParams] = useSearchParams()
    const categoryId = searchParams.get('categoryId')

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true)
            setError(null)
            try {
                const response = await getAllProducts(categoryId)
                setProducts(response.data)
            } catch (err) {
                setError('Failed to load products')
            } finally {
                setLoading(false)
            }
        }
        fetchProducts()
    }, [categoryId])

    if (loading) return <div className="products-loading">Loading collection...</div>
    if (error) return <div className="products-error">{error}</div>

    return (
        <div className="products-page">
            <div className="products-header">
                <h1 className="products-title">
                    {categoryId ? 'Collection' : 'All Products'}
                </h1>
                <p className="products-count">{products.length} products</p>
            </div>

            {products.length === 0 ? (
                <div className="products-empty">No products found</div>
            ) : (
                <div className="products-grid">
                    {products.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}
        </div>
    )
}