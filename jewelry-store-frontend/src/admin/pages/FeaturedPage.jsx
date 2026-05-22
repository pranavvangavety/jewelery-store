import { useState, useEffect } from 'react'
import {
    adminGetFeaturedProducts,
    adminGetAllProducts,
    adminAddFeaturedProduct,
    adminRemoveFeaturedProduct,
} from '../../api/adminApi.js'
import './FeaturedPage.css'

const MAX_FEATURED = 6

export default function FeaturedPage() {
    const [featured, setFeatured]   = useState([])
    const [products, setProducts]   = useState([])
    const [loading, setLoading]     = useState(true)
    const [error, setError]         = useState(null)
    const [selectedId, setSelectedId] = useState('')
    const [adding, setAdding]       = useState(false)
    const [actionError, setActionError] = useState(null)

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        setLoading(true)
        setError(null)
        try {
            const [featuredRes, productsRes] = await Promise.all([
                adminGetFeaturedProducts(),
                adminGetAllProducts(),
            ])
            setFeatured(featuredRes.data)
            const active = productsRes.data.filter(p => p.status === 'ACTIVE')
            setProducts(active)
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load data')
        } finally {
            setLoading(false)
        }
    }

    async function handleAdd() {
        if (!selectedId) return
        setAdding(true)
        setActionError(null)
        try {
            await adminAddFeaturedProduct(Number(selectedId))
            setSelectedId('')
            await fetchData()
        } catch (err) {
            setActionError(err.response?.data?.message || 'Failed to add featured product')
        } finally {
            setAdding(false)
        }
    }

    async function handleRemove(productId) {
        setActionError(null)
        try {
            await adminRemoveFeaturedProduct(productId)
            await fetchData()
        } catch (err) {
            setActionError(err.response?.data?.message || 'Failed to remove featured product')
        }
    }

    const featuredIds = new Set(featured.map(p => p.id))
    const available   = products.filter(p => !featuredIds.has(p.id))
    const atCap       = featured.length >= MAX_FEATURED

    return (
        <div className="feat-page">

            <div className="feat-header">
                <p className="feat-eyebrow">Homepage</p>
                <h1 className="feat-title">Featured Products</h1>
            </div>

            {loading && <p className="feat-loading">Loading…</p>}
            {error   && <p className="feat-error">{error}</p>}

            {!loading && !error && (
                <>
                    <div className="feat-add-bar">
                        <p className="feat-count">
                            {featured.length} / {MAX_FEATURED} featured
                        </p>

                        {actionError && <p className="feat-action-error">{actionError}</p>}

                        {!atCap && (
                            <div className="feat-add-row">
                                <select
                                    className="feat-select"
                                    value={selectedId}
                                    onChange={e => setSelectedId(e.target.value)}
                                >
                                    <option value="">— Select a product —</option>
                                    {available.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                                <button
                                    className="feat-btn-primary"
                                    onClick={handleAdd}
                                    disabled={!selectedId || adding}
                                >
                                    {adding ? 'Adding…' : '+ Add'}
                                </button>
                            </div>
                        )}

                        {atCap && (
                            <p className="feat-cap-notice">
                                Maximum reached. Remove a product to add another.
                            </p>
                        )}
                    </div>

                    {featured.length === 0 ? (
                        <p className="feat-empty">No featured products yet.</p>
                    ) : (
                        <table className="feat-table">
                            <thead>
                            <tr>
                                <th>Product</th>
                                <th>Category</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                            </thead>
                            <tbody>
                            {featured.map(product => (
                                <tr key={product.id}>
                                    <td className="feat-td-name">{product.name}</td>
                                    <td className="feat-td-muted">{product.category?.name}</td>
                                    <td>
                                            <span className={`feat-badge feat-badge--${product.status?.toLowerCase()}`}>
                                                {product.status}
                                            </span>
                                    </td>
                                    <td>
                                        <button
                                            className="feat-btn-remove"
                                            onClick={() => handleRemove(product.id)}
                                        >
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </>
            )}
        </div>
    )
}