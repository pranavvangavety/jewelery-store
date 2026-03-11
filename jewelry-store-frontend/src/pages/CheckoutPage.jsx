import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { placeOrder } from "../api/orderApi.js"
import { getCart } from "../api/cartApi.js"
import "./CheckoutPage.css"

export default function CheckoutPage() {
    const navigate = useNavigate()

    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        shippingStreet: '',
        shippingCity: '',
        shippingState: '',
        shippingZipCode: '',
        shippingCountry: '',
    })

    const [cart, setCart] = useState(null)
    const [cartLoading, setCartLoading] = useState(true)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchCart = async () => {
            try {
                const response = await getCart()
                setCart(response.data)
            } catch (err) {
                // nothing
            } finally {
                setCartLoading(false)
            }
        }
        fetchCart()
    }, [])

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        try {
            const response = await placeOrder(form)
            navigate(`/orders/confirmation/${response.data.id}`)
        } catch (err) {
            setError('Failed to place order. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="checkout-page">

            <div className="checkout-header">
                <h1 className="checkout-title">Checkout</h1>
            </div>

            <div className="checkout-body">

                <form className="checkout-form" onSubmit={handleSubmit}>

                    {error && <p className="checkout-error">{error}</p>}

                    <div className="checkout-section">
                        <p className="checkout-section-label">Contact</p>
                        <div className="checkout-name-row">
                            <input
                                className="checkout-input"
                                name="firstName"
                                placeholder="First Name"
                                value={form.firstName}
                                onChange={handleChange}
                                required
                            />
                            <input
                                className="checkout-input"
                                name="lastName"
                                placeholder="Last Name"
                                value={form.lastName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <input
                            className="checkout-input"
                            name="email"
                            type="email"
                            placeholder="Email"
                            value={form.email}
                            onChange={handleChange}
                            required
                        />
                        <input
                            className="checkout-input"
                            name="phone"
                            placeholder="Phone (optional)"
                            value={form.phone}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="checkout-section">
                        <p className="checkout-section-label">Shipping Address</p>
                        <input
                            className="checkout-input"
                            name="shippingStreet"
                            placeholder="Street"
                            value={form.shippingStreet}
                            onChange={handleChange}
                            required
                        />
                        <input
                            className="checkout-input"
                            name="shippingCity"
                            placeholder="City"
                            value={form.shippingCity}
                            onChange={handleChange}
                            required
                        />
                        <input
                            className="checkout-input"
                            name="shippingState"
                            placeholder="State"
                            value={form.shippingState}
                            onChange={handleChange}
                            required
                        />
                        <input
                            className="checkout-input"
                            name="shippingZipCode"
                            placeholder="Zip Code"
                            value={form.shippingZipCode}
                            onChange={handleChange}
                            required
                        />
                        <input
                            className="checkout-input"
                            name="shippingCountry"
                            placeholder="Country"
                            value={form.shippingCountry}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button
                        className="checkout-submit-btn"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? 'Placing Order...' : 'Place Order'}
                    </button>

                </form>

                <div className="checkout-summary">
                    <p className="checkout-summary-title">Order Summary</p>

                    {cartLoading ? (
                        <p className="checkout-summary-loading">Loading...</p>
                    ) : cart ? (
                        <>
                            <div className="checkout-summary-items">
                                {cart.items.map(item => (
                                    <div key={item.variantId} className="checkout-summary-item">
                                        <div className="checkout-summary-img-wrap">
                                            <img
                                                src={item.imageUrl || '/placeholder.jpg'}
                                                alt={item.productName}
                                                className="checkout-summary-img"
                                            />
                                        </div>
                                        <div>
                                            <p className="checkout-summary-item-name">{item.productName}</p>
                                            <p className="checkout-summary-item-variant">
                                                {[item.color, item.size].filter(Boolean).join(' / ')}
                                            </p>
                                            <p className="checkout-summary-item-qty">Qty: {item.quantity}</p>
                                        </div>
                                        <span className="checkout-summary-item-price">${item.itemTotal}</span>
                                    </div>
                                ))}
                            </div>

                            <hr className="checkout-summary-divider" />

                            <div className="checkout-summary-total-row">
                                <span className="checkout-summary-total-label">Total</span>
                                <span className="checkout-summary-total-value">${cart.totalPrice}</span>
                            </div>
                        </>
                    ) : null}
                </div>

            </div>
        </div>
    )
}