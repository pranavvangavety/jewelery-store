import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getAllProducts, getAllCategories } from "../api/productApi.js";
import ProductCard from "../components/ProductCard.jsx";
import "./ProductsPage.css";

export default function ProductsPage() {
    const [products,   setProducts]   = useState([])
    const [categories, setCategories] = useState([])
    const [loading,    setLoading]    = useState(true)
    const [error, setError] = useState(null)

    const [searchParams] = useSearchParams()

    const [filterCategory, setFilterCategory] = useState('ALL')
    const [search, setSearch]= useState('')
    const [sortBy, setSortBy] = useState('default')

    useEffect(() => {
        setFilterCategory(searchParams.get('categoryId') || 'ALL')
        setSearch(searchParams.get('search') || '')
    }, [searchParams])

    useEffect(() => {
        async function fetchData() {
            setLoading(true)
            setError(null)
            try {
                const [productsRes, categoriesRes] = await Promise.all([
                    getAllProducts(),
                    getAllCategories(),
                ])
                setProducts(productsRes.data)
                setCategories(categoriesRes.data)
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load products')
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const displayedProducts = products
        .filter(p => filterCategory === 'ALL' || String(p.category?.id) === filterCategory)
        .filter(p => {
            if (!search) return true
            return p.name.toLowerCase().includes(search.toLowerCase())
        })
        .sort((a, b) => {
            const aPrice = a.variants?.[0]?.price ?? 0
            const bPrice = b.variants?.[0]?.price ?? 0
            if (sortBy === 'price-asc')  return aPrice - bPrice
            if (sortBy === 'price-desc') return bPrice - aPrice
            if (sortBy === 'name-asc')   return a.name.localeCompare(b.name)
            if (sortBy === 'name-desc')  return b.name.localeCompare(a.name)
            return 0
        })

    if (loading) return <div className="products-loading">Loading collection...</div>
    if (error)   return <div className="products-error">{error}</div>

    const activeCategory = categories.find(c => String(c.id) === filterCategory)

    return (
        <div className="products-page">
            <div className="products-header">
                <h1 className="products-title">
                    {activeCategory ? activeCategory.name : search ? `"${search}"` : 'All Products'}
                </h1>
                <div className="products-header-bottom">
                    <p className="products-count">{displayedProducts.length} of {products.length} products</p>
                    <select
                        className="products-select"
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value)}
                    >
                        <option value="default">Sort By</option>
                        <option value="price-asc">Price: Low → High</option>
                        <option value="price-desc">Price: High → Low</option>
                        <option value="name-asc">Name: A → Z</option>
                        <option value="name-desc">Name: Z → A</option>
                    </select>
                </div>
            </div>

            {displayedProducts.length === 0 ? (
                <div className="products-empty">No products found</div>
            ) : (
                <div className="products-grid">
                    {displayedProducts.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}
        </div>
    )
}