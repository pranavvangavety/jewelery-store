import React, { useState, useEffect } from 'react'
import { adminGetAllOrders, adminUpdateOrderStatus } from '../../api/adminApi.js'
import './OrdersPage.css'

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
    })
}

function formatCurrency(amount) {
    return `$${Number(amount).toFixed(2)}`
}

const ORDER_STATUS_CLASS = {
    PENDING_PAYMENT: 'pending',
    CONFIRMED:       'confirmed',
    SHIPPED:         'shipped',
    DELIVERED:       'delivered',
    CANCELLED:       'cancelled',
    FAILED:          'failed',
}

const PAYMENT_STATUS_CLASS = {
    PENDING: 'pending',
    PAID:    'paid',
    FAILED:  'failed',
}

export default function OrdersPage() {
    const [orders,  setOrders]  = useState([])
    const [loading, setLoading] = useState(true)
    const [error,   setError]   = useState(null)
    const [expandedId, setExpandedId] = useState(null)
    const [filterStatus, setFilterStatus] = useState('ALL')
    const [sortBy,setSortBy] = useState('date-desc')
    const [pendingStatus, setPendingStatus]   = useState({})
    const [confirmModal, setConfirmModal]     = useState(null)
    const [statusError, setStatusError]       = useState({})

    useEffect(() => {
        async function fetchOrders() {
            try {
                const res = await adminGetAllOrders()
                const sorted = [...res.data].sort(
                    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                )
                setOrders(sorted)
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load orders')
            } finally {
                setLoading(false)
            }
        }
        fetchOrders()
    }, [])

    const displayedOrders = orders
        .filter(o => filterStatus === 'ALL' || o.orderStatus === filterStatus)
        .sort((a, b) => {
            if (sortBy === 'date-asc') return new Date(a.createdAt) - new Date(b.createdAt)
            if (sortBy === 'total-desc') return b.totalAmount - a.totalAmount
            if (sortBy === 'total-asc') return a.totalAmount - b.totalAmount
            return new Date(b.createdAt) - new Date(a.createdAt)
        })

    function toggleExpand(orderId) {
        setExpandedId(prev => prev === orderId ? null : orderId)
    }

    function openConfirm(orderId, status) {
        setConfirmModal({ orderId, status })
    }

    async function handleStatusUpdate() {
        const { orderId, status } = confirmModal
        setConfirmModal(null)
        try {
            const res = await adminUpdateOrderStatus(orderId, status)
            setOrders(prev => prev.map(o => o.id === orderId ? res.data : o))
            setStatusError(prev => ({ ...prev, [orderId]: null }))
        } catch (err) {
            setStatusError(prev => ({
                ...prev,
                [orderId]: err.response?.data?.message || 'Failed to update status'
            }))
        }
    }

    return (
        <div className="ord-page">

            <div className="ord-header">
                <p className="ord-eyebrow">Order Management</p>
                <h1 className="ord-title">Orders</h1>
            </div>

            {loading && <p className="ord-loading">Loading…</p>}
            {error   && <p className="ord-error">{error}</p>}

            {!loading && !error && (
                <>
                    <p className="ord-count">{displayedOrders.length} of {orders.length} orders</p>

                    <div className="cat-filters">
                        <div className="cat-filter-status">
                            {[
                                { value: 'ALL',label: 'All'},
                                { value: 'PENDING_PAYMENT', label: 'Pending Payment'},
                                { value: 'CONFIRMED', label: 'Confirmed'},
                                { value: 'SHIPPED',label: 'Shipped'},
                                { value: 'DELIVERED',label: 'Delivered'},
                                { value: 'CANCELLED',label: 'Cancelled'},
                                { value: 'FAILED', label: 'Failed'},
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
                            <select
                                className="cat-filter-select"
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                            >
                                <option value="date-desc">Newest First</option>
                                <option value="date-asc">Oldest First</option>
                                <option value="total-desc">Total: High → Low</option>
                                <option value="total-asc">Total: Low → High</option>
                            </select>
                        </div>
                    </div>

                    <table className="ord-table">
                        <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Date</th>
                            <th>Order Status</th>
                            <th>Payment</th>
                            <th>Total</th>
                            <th>Action</th>
                        </tr>
                        </thead>
                        <tbody>
                        {displayedOrders.map(order => {
                            const isExpanded = expandedId === order.id
                            return (
                                <React.Fragment key={order.id}>
                                    <tr key={order.id} className={isExpanded ? 'ord-row--expanded' : ''}>
                                        <td className="ord-td-muted">#{order.id}</td>
                                        <td className="ord-td-name">
                                            {order.firstName} {order.lastName}
                                            <span className="ord-td-email">{order.email}</span>
                                        </td>
                                        <td className="ord-td-muted">{formatDate(order.createdAt)}</td>
                                        <td>
                                                <span className={`ord-badge ord-badge--${ORDER_STATUS_CLASS[order.orderStatus]}`}>
                                                    {order.orderStatus.replace('_', ' ')}
                                                </span>
                                        </td>
                                        <td>
                                                <span className={`ord-badge ord-badge--${PAYMENT_STATUS_CLASS[order.paymentStatus]}`}>
                                                    {order.paymentStatus}
                                                </span>
                                        </td>
                                        <td className="ord-td-total">{formatCurrency(order.totalAmount)}</td>
                                        <td>
                                            <button
                                                className="ord-btn-view"
                                                onClick={() => toggleExpand(order.id)}
                                            >
                                                <svg
                                                    className="ord-chevron"
                                                    style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                                                    width="14"
                                                    height="14"
                                                    viewBox="0 0 14 14"
                                                    fill="none"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                >
                                                    <path d="M2 5L7 10L12 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>

                                    {isExpanded && (
                                        <tr key={`${order.id}-detail`} className="ord-detail-row">
                                            <td colSpan={7}>
                                                <div className="ord-detail">

                                                    <div className="ord-detail-left">
                                                        <p className="ord-detail-heading">Shipping Address</p>
                                                        <p className="ord-detail-line">{order.firstName} {order.lastName}</p>
                                                        <p className="ord-detail-line">{order.shippingStreet}</p>
                                                        <p className="ord-detail-line">
                                                            {order.shippingCity}, {order.shippingState} {order.shippingZipCode}
                                                        </p>
                                                        <p className="ord-detail-line">{order.shippingCountry}</p>
                                                        <p className="ord-detail-line">{order.phone}</p>

                                                        {order.transactionId && (
                                                            <div className="ord-transaction">
                                                                <p className="ord-detail-heading" style={{ marginTop: '20px' }}>Transaction</p>
                                                                <p className="ord-detail-line ord-td-muted">{order.transactionId}</p>
                                                            </div>
                                                        )}

                                                        <div className="ord-status-update">
                                                            <p className="ord-detail-heading" style={{ marginTop: '24px' }}>Update Status</p>
                                                            <div className="ord-status-row">
                                                                <select
                                                                    className="cat-filter-select"
                                                                    value={pendingStatus[order.id] ?? order.orderStatus}
                                                                    onChange={e => setPendingStatus(prev => ({ ...prev, [order.id]: e.target.value }))}
                                                                >
                                                                    {['PENDING_PAYMENT','CONFIRMED','SHIPPED','DELIVERED','CANCELLED','FAILED'].map(s => (
                                                                        <option key={s} value={s}>{s.replace('_', ' ')}</option>
                                                                    ))}
                                                                </select>
                                                                <button
                                                                    className="ord-status-btn"
                                                                    onClick={() => openConfirm(order.id, pendingStatus[order.id] ?? order.orderStatus)}
                                                                >
                                                                    Update
                                                                </button>
                                                            </div>
                                                            {statusError[order.id] && (
                                                                <p className="ord-status-error">{statusError[order.id]}</p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="ord-detail-right">
                                                        <p className="ord-detail-heading">Items</p>
                                                        <table className="ord-items-table">
                                                            <thead>
                                                            <tr>
                                                                <th>Product</th>
                                                                <th>SKU</th>
                                                                <th>Qty</th>
                                                                <th>Unit Price</th>
                                                                <th>Item Total</th>
                                                            </tr>
                                                            </thead>
                                                            <tbody>
                                                            {order.items.map(item => (
                                                                <tr key={item.variantId}>
                                                                    <td>{item.productName}</td>
                                                                    <td className="ord-td-muted">{item.sku}</td>
                                                                    <td className="ord-td-muted">{item.quantity}</td>
                                                                    <td className="ord-td-muted">{formatCurrency(item.price)}</td>
                                                                    <td className="ord-td-muted">{formatCurrency(item.itemTotal)}</td>
                                                                </tr>
                                                            ))}
                                                            </tbody>
                                                        </table>
                                                    </div>

                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            )
                        })}
                        </tbody>
                    </table>
                </>
            )}

            {confirmModal && (
                <div className="ord-modal-overlay" onClick={() => setConfirmModal(null)}>
                    <div className="ord-modal" onClick={e => e.stopPropagation()}>
                        <p className="ord-modal-title">Confirm Status Change</p>
                        <p className="ord-modal-body">
                            Change order <span className="ord-modal-highlight">#{confirmModal.orderId}</span> status
                            to <span className="ord-modal-highlight">{confirmModal.status.replace('_', ' ')}</span>?
                        </p>
                        <div className="ord-modal-actions">
                            <button className="ord-modal-btn ord-modal-btn--cancel" onClick={() => setConfirmModal(null)}>
                                Cancel
                            </button>
                            <button className="ord-modal-btn ord-modal-btn--confirm" onClick={handleStatusUpdate}>
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}