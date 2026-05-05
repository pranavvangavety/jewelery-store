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

    useEffect(() => {
        fetchData()
    }, [])

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
                        variantId:         variant.id,
                        sku:               variant.sku,
                        productName:       product.name,
                        quantity:          stock.quantity,
                        reservedQuantity:  stock.reservedQuantity,
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
                    <p className="inv-count">{rows.length} variants</p>

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
                        {rows.map(row => {
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