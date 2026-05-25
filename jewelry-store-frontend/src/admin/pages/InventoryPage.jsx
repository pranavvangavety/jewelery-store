import { useState, useEffect } from 'react'
import { adminGetAllInventory, adminUpdateInventory, adminGetAllProducts } from '../../api/adminApi.js'
import './InventoryPage.css'

function getStockStatus(available) {
    if (available === 0)  return 'out'
    if (available <= 5)   return 'low'
    return 'ok'
}

function getStockLabel(available) {
    if (available === 0)  return 'Out of Stock'
    if (available <= 5)   return 'Low Stock'
    return 'In Stock'
}

export default function InventoryPage() {
    const [rows, setRows]         = useState([])
    const [loading, setLoading]   = useState(true)
    const [error, setError]       = useState(null)
    const [editingId, setEditingId]   = useState(null)
    const [editValue, setEditValue]   = useState('')
    const [saving, setSaving]         = useState(false)
    const [saveError, setSaveError]   = useState(null)
    const [filterStatus,setFilterStatus] = useState('ALL')
    const [search, setSearch] = useState('')
    const [sortBy, setSortBy] = useState('name-asc')
    const [filterCategory, setFilterCategory] = useState('ALL')

    useEffect(() => {
        fetchData()
    }, [])

    const displayedRows = rows
        .filter(r => {
            if (filterStatus === 'out') return r.availableQuantity === 0
            if (filterStatus === 'low') return r.availableQuantity > 0 && r.availableQuantity <= 5
            if (filterStatus === 'ok')  return r.availableQuantity > 5
            return true
        })
        .filter(r => filterCategory === 'ALL' || r.categoryName === filterCategory)
        .filter(r => {
            if (!search) return true
            const q = search.toLowerCase()
            return r.productName.toLowerCase().includes(q) || r.sku.toLowerCase().includes(q)
        })
        .sort((a, b) => {
            if (sortBy === 'name-desc')  return b.productName.localeCompare(a.productName)
            if (sortBy === 'avail-asc')  return a.availableQuantity - b.availableQuantity
            if (sortBy === 'avail-desc')   return b.availableQuantity - a.availableQuantity
            if (sortBy === 'id-asc')       return a.variantId - b.variantId
            if (sortBy === 'id-desc')      return b.variantId - a.variantId
            return a.productName.localeCompare(b.productName)
        })

    async function fetchData() {
        setLoading(true)
        setError(null)
        try {
            const [inventoryRes, productsRes] = await Promise.all([
                adminGetAllInventory(),
                adminGetAllProducts(),
            ])

            const inventoryMap = {}
            inventoryRes.data.forEach(item => {
                inventoryMap[item.variantId] = item
            })

            const enriched = []
            productsRes.data.forEach(product => {
                product.variants?.forEach(variant => {
                    const stock = inventoryMap[variant.id]
                    if (!stock) return
                    enriched.push({
                        variantId: variant.id,
                        sku: variant.sku,
                        productName: product.name,
                        categoryName: product.category?.name || '',
                        quantity: stock.quantity,
                        reservedQuantity: stock.reservedQuantity,
                        availableQuantity: stock.availableQuantity,
                    })
                })
            })

            setRows(enriched)
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load inventory')
        } finally {
            setLoading(false)
        }
    }

    function startEdit(row) {
        setEditingId(row.variantId)
        setEditValue(String(row.quantity))
        setSaveError(null)
    }

    function cancelEdit() {
        setEditingId(null)
        setEditValue('')
        setSaveError(null)
    }

    async function saveEdit(variantId) {
        setSaving(true)
        setSaveError(null)
        try {
            const qty = parseInt(editValue, 10)
            await adminUpdateInventory(variantId, { variantId, quantity: qty })
            setRows(prev => prev.map(r =>
                r.variantId === variantId
                    ? { ...r, quantity: qty, availableQuantity: qty - r.reservedQuantity }
                    : r
            ))
            setEditingId(null)
        } catch (err) {
            setSaveError(err.response?.data?.message || 'Failed to save')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="inv-page">

            <div className="inv-header">
                <p className="inv-eyebrow">Stock Management</p>
                <h1 className="inv-title">Inventory</h1>
            </div>

            {loading && <p className="inv-loading">Loading…</p>}
            {error   && <p className="inv-error">{error}</p>}

            {!loading && !error && (
                <>
                    <p className="inv-count">{displayedRows.length} of {rows.length} variants</p>

                    <div className="cat-filters">
                        <div className="cat-filter-status">
                            {[
                                { value: 'ALL', label: 'All'          },
                                { value: 'ok',  label: 'In Stock'     },
                                { value: 'low', label: 'Low Stock'    },
                                { value: 'out', label: 'Out of Stock' },
                            ].map(({ value, label }) => (
                                <button
                                    key={value}
                                    className={`cat-filter-btn ${filterStatus === value ? 'cat-filter-btn--active' : ''}`}
                                    onClick={() => setFilterStatus(value)}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        <div className="cat-filter-right">
                            <input
                                className="inv-search"
                                type="text"
                                placeholder="Search product or SKU…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                            <select
                                className="cat-filter-select"
                                value={filterCategory}
                                onChange={e => setFilterCategory(e.target.value)}
                            >
                                <option value="ALL">All Categories</option>
                                {[...new Set(rows.map(r => r.categoryName).filter(Boolean))].sort().map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <select
                                className="cat-filter-select"
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                            >
                                <option value="name-asc">Name A → Z</option>
                                <option value="name-desc">Name Z → A</option>
                                <option value="avail-asc">Available: Low → High</option>
                                <option value="avail-desc">Available: High → Low</option>
                                <option value="id-asc">Variant ID: Low → High</option>
                                <option value="id-desc">Variant ID: High → Low</option>
                            </select>
                        </div>
                    </div>

                    <table className="inv-table">
                        <thead>
                        <tr>
                            <th>Product</th>
                            <th>SKU</th>
                            <th>Variant ID</th>
                            <th>Total</th>
                            <th>Reserved</th>
                            <th>Available</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                        </thead>
                        <tbody>
                        {displayedRows.map(row => {
                            const isEditing = editingId === row.variantId
                            const status    = getStockStatus(row.availableQuantity)
                            return (
                                <tr key={row.variantId}>
                                    <td className="inv-td-name">{row.productName}</td>
                                    <td className="inv-td-muted">{row.sku}</td>
                                    <td className="inv-td-muted">#{row.variantId}</td>

                                    <td>
                                        {isEditing ? (
                                            <input
                                                className="inv-qty-input"
                                                type="number"
                                                min="0"
                                                value={editValue}
                                                onChange={e => setEditValue(e.target.value)}
                                            />
                                        ) : (
                                            row.quantity
                                        )}
                                    </td>

                                    <td className="inv-td-muted">{row.reservedQuantity}</td>
                                    <td className="inv-td-muted">{row.availableQuantity}</td>

                                    <td>
                                            <span className={`inv-badge inv-badge--${status}`}>
                                                {getStockLabel(row.availableQuantity)}
                                            </span>
                                    </td>

                                    <td>
                                        {isEditing ? (
                                            <div className="inv-actions">
                                                <button
                                                    className="inv-btn inv-btn--save"
                                                    onClick={() => saveEdit(row.variantId)}
                                                    disabled={saving}
                                                >
                                                    {saving ? '…' : 'Save'}
                                                </button>
                                                <button
                                                    className="inv-btn inv-btn--cancel"
                                                    onClick={cancelEdit}
                                                    disabled={saving}
                                                >
                                                    Cancel
                                                </button>
                                                {saveError && <span className="inv-save-error">{saveError}</span>}
                                            </div>
                                        ) : (
                                            <button
                                                className="inv-btn inv-btn--edit"
                                                onClick={() => startEdit(row)}
                                            >
                                                Edit
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                        </tbody>
                    </table>
                </>
            )}

        </div>
    )
}