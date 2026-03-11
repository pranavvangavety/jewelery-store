import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { getOrdersByUser } from "../api/orderApi.js"
import "./OrderHistory.css"

const statusClass = (status) => {
    switch (status) {
        case 'CONFIRMED':      return 'status-confirmed'
        case 'SHIPPED':        return 'status-shipped'
        case 'DELIVERED':      return 'status-delivered'
        case 'PENDING_PAYMENT': return 'status-pending'
        case 'FAILED':         return 'status-failed'
        case 'CANCELLED':      return 'status-cancelled'
        default:               return ''
    }
}

const formatStatus = (status) => {
    return status?.replace('_', ' ') ?? ''
}

export default function OrderHistoryPage() {
    const navigate = useNavigate()
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await getOrdersByUser()
                setOrders(response.data)
            } catch (err) {
                setError('Failed to load orders')
            } finally {
                setLoading(false)
            }
        }
        fetchOrders()
    }, [])

    if (loading) return <div className="oh-loading">Loading...</div>
    if (error) return <div className="oh-error">{error}</div>

    return (
        <div className="oh-page">

            <div className="oh-header">
                <h1 className="oh-title">My Orders</h1>
            </div>

            {orders.length === 0 ? (
                <div className="oh-empty">You have no orders yet.</div>
            ) : (
                <div className="oh-list">
                    {orders.map(order => {
                        const firstItem = order.items[0]
                        const extraCount = order.items.length - 1
                        const totalItems = order.items.reduce((sum, i) => sum + i.quantity, 0)

                        return (
                            <div key={order.id} className="oh-card">

                                <div className="oh-card-top">
                                    <div>
                                        <p className="oh-order-number">Order #{order.id}</p>
                                        <p className="oh-order-date">
                                            {new Date(order.createdAt).toLocaleDateString('en-US', {
                                                year: 'numeric', month: 'long', day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                    <span className={`oh-badge ${statusClass(order.orderStatus)}`}>
                                        {formatStatus(order.orderStatus)}
                                    </span>
                                </div>

                                <div className="oh-card-body">
                                    <div className="oh-img-wrap">
                                        <img
                                            src={firstItem?.imageUrl || '/placeholder.jpg'}
                                            alt={firstItem?.productName}
                                            className="oh-img"
                                        />
                                    </div>
                                    <div className="oh-item-info">
                                        <p className="oh-item-count">{totalItems} {totalItems === 1 ? 'item' : 'items'}</p>
                                        <p className="oh-item-name">{firstItem?.productName}</p>
                                        {extraCount > 0 && <p className="oh-item-more">+{extraCount} more</p>}
                                    </div>
                                    <div className="oh-card-right">
                                        <span className="oh-total">${order.totalAmount}</span>
                                        <button
                                            className="oh-view-btn"
                                            onClick={() => navigate(`/orders/confirmation/${order.id}`)}
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </div>

                            </div>
                        )
                    })}
                </div>
            )}

        </div>
    )
}