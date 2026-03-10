import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { placeOrder } from "../api/orderApi.js"

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

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

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
        <div>
            <h2>Checkout</h2>
            {error && <p>{error}</p>}
            <form onSubmit={handleSubmit}>
                <h3>Contact</h3>
                <input name="firstName" placeholder="First Name" value={form.firstName} onChange={handleChange} required />
                <input name="lastName" placeholder="Last Name" value={form.lastName} onChange={handleChange} required />
                <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
                <input name="phone" placeholder="Phone (optional)" value={form.phone} onChange={handleChange} />

                <h3>Shipping Address</h3>
                <input name="shippingStreet" placeholder="Street" value={form.shippingStreet} onChange={handleChange} />
                <input name="shippingCity" placeholder="City" value={form.shippingCity} onChange={handleChange} />
                <input name="shippingState" placeholder="State" value={form.shippingState} onChange={handleChange} />
                <input name="shippingZipCode" placeholder="Zip Code" value={form.shippingZipCode} onChange={handleChange} />
                <input name="shippingCountry" placeholder="Country" value={form.shippingCountry} onChange={handleChange} />

                <button type="submit" disabled={loading}>
                    {loading ? 'Placing order...' : 'Place Order'}
                </button>
            </form>
        </div>
    )
}