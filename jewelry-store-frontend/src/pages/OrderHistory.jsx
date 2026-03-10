import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext.jsx"
import { getOrdersByUser } from "../api/orderApi.js"

export default function OrderHistoryPage() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!user) {
            navigate('/login')
            return
        }
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
    }, [user, navigate])

    if (loading) return <p>Loading...</p>
    if (error) return <p>{error}</p>
    if (orders.length === 0) return <p>No orders yet.</p>

    return (
        <div>
            <h2>My Orders</h2>
            {orders.map(order => (
                <div key={order.id} onClick={() => navigate(`/orders/confirmation/${order.id}`)} style={{ cursor: 'pointer' }}>
                    <p>Order #{order.id}</p>
                    <p>Status: {order.orderStatus}</p>
                    <p>Payment: {order.paymentStatus}</p>
                    <p>Total: ${order.totalAmount}</p>
                    <p>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                    <div>
                        {order.items.map(item => (
                            <p key={item.variantId}>
                                {item.productName} — {[item.color, item.size].filter(Boolean).join(' / ')} × {item.quantity}
                            </p>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}