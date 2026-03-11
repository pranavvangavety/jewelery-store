import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { placeOrder } from "../api/orderApi.js"
import { getCart } from "../api/cartApi.js"
import { getMyProfile, addAddress } from "../api/userApi.js"
import { useAuth } from "../context/AuthContext.jsx"
import "./CheckoutPage.css"

export default function CheckoutPage() {
    const navigate = useNavigate()
    const { user } = useAuth()

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
    const [savedAddresses, setSavedAddresses] = useState([])
    const [selectedAddressId, setSelectedAddressId] = useState(null)
    const [saveAddress, setSaveAddress] = useState(false)
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

    useEffect(() => {
        if (!user) return
        const fetchProfile = async () => {
            try {
                const response = await getMyProfile()
                const profile = response.data
                setForm(prev => ({
                    ...prev,
                    firstName: profile.firstName || '',
                    lastName: profile.lastName || '',
                    email: profile.email || '',
                    phone: profile.phone || '',
                }))
                setSavedAddresses(profile.addresses || [])

                const defaultAddr = profile.addresses?.find(a => a.defaultAddress)
                if (defaultAddr) setSelectedAddressId(defaultAddr.id)
            } catch (err) {
                // nothing
            }
        }
        fetchProfile()
    }, [user])

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {

            if (user && saveAddress && !selectedAddressId) {
                await addAddress({
                    street: form.shippingStreet,
                    city: form.shippingCity,
                    state: form.shippingState,
                    zipCode: form.shippingZipCode,
                    country: form.shippingCountry,
                    defaultAddress: savedAddresses.length === 0,
                })
            }

            const orderPayload = selectedAddressId
                ? {
                    firstName: form.firstName,
                    lastName: form.lastName,
                    email: form.email,
                    phone: form.phone,
                    addressId: selectedAddressId,
                }
                : { ...form }

            const response = await placeOrder(orderPayload)
            navigate(`/orders/confirmation/${response.data.id}`)
        } catch (err) {
            setError('Failed to place order. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const isNewAddress = !selectedAddressId
    const selectedAddress = savedAddresses.find(a => a.id === selectedAddressId)

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

                        {savedAddresses.length > 0 && (
                            <div className="checkout-saved-addresses">
                                {savedAddresses.map(addr => (
                                    <div
                                        key={addr.id}
                                        className={`checkout-address-card ${selectedAddressId === addr.id ? 'active' : ''}`}
                                        onClick={() => setSelectedAddressId(addr.id)}
                                    >
                                        <p className="checkout-address-line">{addr.street}</p>
                                        <p className="checkout-address-line">{addr.city}, {addr.state} {addr.zipCode}</p>
                                        <p className="checkout-address-line">{addr.country}</p>
                                        {addr.defaultAddress && (
                                            <span className="checkout-address-default">Default</span>
                                        )}
                                    </div>
                                ))}
                                <div
                                    className={`checkout-address-card ${isNewAddress ? 'active' : ''}`}
                                    onClick={() => setSelectedAddressId(null)}
                                >
                                    <p className="checkout-address-line">+ Enter a new address</p>
                                </div>
                            </div>
                        )}

                        {isNewAddress && (
                            <>
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
                                {user && (
                                    <label className="checkout-save-label">
                                        <input
                                            type="checkbox"
                                            checked={saveAddress}
                                            onChange={(e) => setSaveAddress(e.target.checked)}
                                        />
                                        Save this address
                                    </label>
                                )}
                            </>
                        )}
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
                                                src={item.imageUrl || 'https://placehold.co/56x70?text=No+Image'}
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