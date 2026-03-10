import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { getOrderById } from "../api/orderApi.js"

export default function OrderConfirmationPage() {
    const { orderId } = useParams()
    const navigate = useNavigate()
    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const response = await getOrderById(orderId)
                setOrder(response.data)
            } catch (err) {
                setError('Failed to load order')
            } finally {
                setLoading(false)
            }
        }
        fetchOrder()
    }, [orderId])

    if (loading) return <p>Loading...</p>
    if (error) return <p>{error}</p>
    if (!order) return null

    return (
        <div>
            <h2>Order Confirmed!</h2>
            <p>Order #{order.id}</p>
            <p>Status: {order.orderStatus}</p>
            <p>Payment: {order.paymentStatus}</p>
            <p>Transaction ID: {order.transactionId}</p>

            <h3>Items</h3>
            {order.items.map(item => (
                <div key={item.variantId}>
                    <p>{item.productName} — {[item.color, item.size].filter(Boolean).join(' / ')}</p>
                    <p>Qty: {item.quantity} × ${item.price} = ${item.itemTotal}</p>
                </div>
            ))}

            <p>Total: ${order.totalAmount}</p>

            <h3>Shipping To</h3>
            <p>{order.firstName} {order.lastName}</p>
            <p>{order.shippingStreet}, {order.shippingCity}, {order.shippingState} {order.shippingZipCode}, {order.shippingCountry}</p>

            <button onClick={() => navigate('/products')}>Continue Shopping</button>
        </div>
    )
}