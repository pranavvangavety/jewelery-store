import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    adminGetAllProducts,
    adminGetAllCategories,
    adminUpdateProductStatus,
    adminCreateCategory,
    adminDeleteCategory,
} from '../../api/adminApi.js'
import './CataloguePage.css'

const STATUSES = ['DRAFT', 'ACTIVE', 'INACTIVE', 'DISCONTINUED']

export default function CataloguePage() {
    const navigate = useNavigate()
    const [tab, setTab] = useState('products')

    const [products, setProducts] = useState([])
    const [productsLoading, setProductsLoading] = useState(true)
    const [productsError, setProductsError] = useState(null)

    const [categories, setCategories] = useState([])
    const [catsLoading, setCatsLoading] = useState(true)
    const [catsError, setCatsError] = useState(null)

    const [showCatForm, setShowCatForm] = useState(false)
    const [catName, setCatName] = useState('')
    const [catDesc, setCatDesc] = useState('')
    const [catSaving, setCatSaving] = useState(false)
    const [catFormError, setCatFormError] = useState(null)

    useEffect(() => {
        fetchProducts()
        fetchCategories()
    }, [])

    async function fetchProducts() {
        setProductsLoading(true)
        setProductsError(null)
        try {
            const res = await adminGetAllProducts()
            setProducts(res.data)
        } catch (err) {
            setProductsError(err.response?.data?.message || 'Failed to load products.')
        } finally {
            setProductsLoading(false)
        }
    }

    async function fetchCategories() {
        setCatsLoading(true)
        setCatsError(null)
        try {
            const res = await adminGetAllCategories()
            setCategories(res.data)
        } catch (err) {
            setCatsError(err.response?.data?.message || 'Failed to load categories.')
        } finally {
            setCatsLoading(false)
        }
    }

    async function handleStatusChange(productId, newStatus, currentStatus) {
        if (!confirm(`Change status from ${currentStatus} to ${newStatus}?`)) return
        try {
            const res = await adminUpdateProductStatus(productId, newStatus)
            setProducts(prev => prev.map(p => p.id === productId ? res.data : p))
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update status.')
        }
    }

    async function handleCreateCategory(e) {
        e.preventDefault()
        setCatSaving(true)
        setCatFormError(null)
        try {
            await adminCreateCategory({ name: catName, description: catDesc })
            setCatName('')
            setCatDesc('')
            setShowCatForm(false)
            await fetchCategories()
        } catch (err) {
            setCatFormError(err.response?.data?.message || 'Failed to create category.')
        } finally {
            setCatSaving(false)
        }
    }

    async function handleDeleteCategory(id) {
        if (!confirm('Delete this category? Products in this category will be affected.')) return
        try {
            await adminDeleteCategory(id)
            setCategories(prev => prev.filter(c => c.id !== id))
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete category.')
        }
    }

    return (
        <div className="cat-page">

            <div className="cat-header">
                <p className="cat-eyebrow">Admin</p>
                <h1 className="cat-title">Catalogue</h1>
            </div>

            <div className="cat-tabs">
                <button
                    className={`cat-tab ${tab === 'products' ? 'cat-tab--active' : ''}`}
                    onClick={() => setTab('products')}
                >
                    Products
                </button>
                <button
                    className={`cat-tab ${tab === 'categories' ? 'cat-tab--active' : ''}`}
                    onClick={() => setTab('categories')}
                >
                    Categories
                </button>
            </div>

            {tab === 'products' && (
                <div className="cat-section">
                    <div className="cat-section-header">
                        <p className="cat-count">
                            {productsLoading ? '—' : `${products.length} products`}
                        </p>
                        <button
                            className="cat-btn-primary"
                            onClick={() => navigate('/admin/products/new')}
                        >
                            + New Product
                        </button>
                    </div>

                    {productsLoading && <p className="cat-loading">Loading…</p>}
                    {productsError  && <p className="cat-error">{productsError}</p>}

                    {!productsLoading && !productsError && (
                        <table className="cat-table">
                            <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Material</th>
                                <th>Variants</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {products.map(product => (
                                <tr key={product.id}>
                                    <td className="cat-td-muted">#{product.id}</td>
                                    <td className="cat-td-name">{product.name}</td>
                                    <td className="cat-td-muted">{product.category?.name}</td>
                                    <td className="cat-td-muted">{product.material}</td>
                                    <td className="cat-td-muted">{product.variants?.length ?? 0}</td>
                                    <td>
                                        <select
                                            className={`cat-status-select cat-status--${product.status?.toLowerCase()}`}
                                            value={product.status}
                                            onChange={e => handleStatusChange(product.id, e.target.value, product.status)}
                                        >
                                            {STATUSES.map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td>
                                        <button
                                            className="cat-action-btn"
                                            onClick={() => navigate(`/admin/products/${product.id}/edit`)}
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {tab === 'categories' && (
                <div className="cat-section">
                    <div className="cat-section-header">
                        <p className="cat-count">
                            {catsLoading ? '—' : `${categories.length} categories`}
                        </p>
                        <button
                            className="cat-btn-primary"
                            onClick={() => setShowCatForm(f => !f)}
                        >
                            {showCatForm ? 'Cancel' : '+ New Category'}
                        </button>
                    </div>

                    {showCatForm && (
                        <form className="cat-inline-form" onSubmit={handleCreateCategory}>
                            {catFormError && <p className="cat-error">{catFormError}</p>}
                            <input
                                className="cat-input"
                                placeholder="Category name *"
                                value={catName}
                                onChange={e => setCatName(e.target.value)}
                                required
                            />
                            <input
                                className="cat-input"
                                placeholder="Description (optional)"
                                value={catDesc}
                                onChange={e => setCatDesc(e.target.value)}
                            />
                            <button
                                type="submit"
                                className="cat-btn-primary"
                                disabled={catSaving}
                            >
                                {catSaving ? 'Saving…' : 'Create Category'}
                            </button>
                        </form>
                    )}

                    {catsLoading && <p className="cat-loading">Loading…</p>}
                    {catsError   && <p className="cat-error">{catsError}</p>}

                    {!catsLoading && !catsError && (
                        <table className="cat-table">
                            <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Slug</th>
                                <th>Description</th>
                                <th>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {categories.map(cat => (
                                <tr key={cat.id}>
                                    <td className="cat-td-muted">#{cat.id}</td>
                                    <td className="cat-td-name">{cat.name}</td>
                                    <td className="cat-td-muted">{cat.slug}</td>
                                    <td className="cat-td-muted">{cat.description || '—'}</td>
                                    <td>
                                        <button
                                            className="cat-action-btn cat-action-btn--danger"
                                            onClick={() => handleDeleteCategory(cat.id)}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

        </div>
    )
}