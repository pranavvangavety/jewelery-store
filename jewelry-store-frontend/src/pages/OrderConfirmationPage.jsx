import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { getOrderById } from "../api/orderApi.js"
import "./OrderConfirmationPage.css"

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

    if (loading) return <div className="ocp-loading">Loading...</div>
    if (error) return <div className="ocp-error">{error}</div>
    if (!order) return null

    return (
        <div className="ocp-page">
            <div className="ocp-header">
                <div className="ocp-check">✦</div>
                <h1 className="ocp-title">Order Confirmed</h1>
                <p className="ocp-order-number">Order #{order.id}</p>
                <div className="ocp-badges">
                    <span className="ocp-badge gold">{order.orderStatus}</span>
                    <span className="ocp-badge gold">{order.paymentStatus}</span>
                    {order.transactionId && (
                        <span className="ocp-badge">{order.transactionId}</span>
                    )}
                </div>
            </div>


            <div className="ocp-body">
                <div>
                    <p className="ocp-section-label">Items Ordered</p>
                    <div className="ocp-items">
                        {order.items.map(item => (
                            <div key={item.variantId} className="ocp-item">
                                <div className="ocp-item-img-wrap">
                                    <img
                                        src={item.imageUrl || '/placeholder.jpg'}
                                        alt={item.productName}
                                        className="ocp-item-img"
                                    />
                                </div>
                                <div>
                                    <p className="ocp-item-name">{item.productName}</p>
                                    <p className="ocp-item-variant">
                                        {[item.color, item.size].filter(Boolean).join(' / ')}
                                    </p>
                                    <p className="ocp-item-qty">Qty: {item.quantity}</p>
                                </div>
                                <span className="ocp-item-total">${item.itemTotal}</span>
                            </div>
                        ))}
                    </div>
                </div>


                <div>
                    <p className="ocp-section-label">Shipping To</p>
                    <p className="ocp-shipping-name">{order.firstName} {order.lastName}</p>
                    <p className="ocp-shipping-line">{order.shippingStreet}</p>
                    <p className="ocp-shipping-line">{order.shippingCity}, {order.shippingState} {order.shippingZipCode}</p>
                    <p className="ocp-shipping-line">{order.shippingCountry}</p>
                </div>

            </div>


            <div className="ocp-footer">
                <div className="ocp-total-row">
                    <span className="ocp-total-label">Total</span>
                    <span className="ocp-total-value">${order.totalAmount}</span>
                </div>
                <button className="ocp-continue-btn" onClick={() => navigate('/products')}>
                    Continue Shopping
                </button>
            </div>

        </div>
    )
}