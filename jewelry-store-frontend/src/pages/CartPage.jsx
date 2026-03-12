import {useNavigate} from "react-router-dom";
import {getCart, removeCartItem, updateCartItem} from "../api/cartApi.js";
import {useEffect, useState} from "react";
import "./CartPage.css"
import {useAuth} from "../context/AuthContext.jsx";

export default function CartPage(){
    const [cart, setCart] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const navigate = useNavigate()
    const { setCartCount } = useAuth()

    const fetchCart =  async() => {
        try{
            const response = await getCart()
            setCart(response.data)
            setCartCount(response.data.totalItems)
        } catch (err) {
            setError('Failed to load cart')
        } finally{
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCart()
    }, [])

    const handleQuantityChange = async (variantId, newQuantity) => {
        if (newQuantity < 1) return
        try {
            const response = await updateCartItem(variantId, newQuantity)
            setCart(response.data)
            setCartCount(response.data.totalItems)
        } catch(err) {
            alert('Failed to update quantity')
        }
    }

    const handleRemove = async(variantId) => {
        try{
            const response = await removeCartItem(variantId)
            setCart(response.data)
            setCartCount(response.data.totalItems)
        } catch (err) {
            alert('Failed to remove item')
        }
    }

    if(loading) return <div className="cart-loading">Loading...</div>
    if(error) return <div className="cart-error">{error}</div>
    if(!cart || cart.items.length === 0) return <div className="cart-empty">Your cart is empty!</div>

    return (
        <div className="cart-page">

            <div className="cart-header">
                <h1 className="cart-title">Your Cart</h1>
                <p className="cart-count">{cart.totalItems} {cart.totalItems === 1 ? 'item' : 'items'}</p>
            </div>

            <div className="cart-items">
                {cart.items.map(item => (
                    <div key={item.variantId} className="cart-item">

                        <div className="cart-item-img-wrap">
                            <img
                                src={item.imageUrl || '/placeholder.jpg'}
                                alt={item.productName}
                                className="cart-item-img"
                            />
                        </div>

                        <div className="cart-item-details">
                            <p className="cart-item-name">{item.productName}</p>
                            <p className="cart-item-variant">
                                {[item.color, item.size].filter(Boolean).join(' / ')}
                            </p>
                            <p className="cart-item-price">${item.price}</p>
                        </div>

                        <div className="cart-item-qty">
                            <button
                                className="cart-qty-btn"
                                onClick={() => handleQuantityChange(item.variantId, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                            >−</button>
                            <span className="cart-qty-value">{item.quantity}</span>
                            <button
                                className="cart-qty-btn"
                                onClick={() => handleQuantityChange(item.variantId, item.quantity + 1)}
                            >+</button>
                        </div>

                        <div className="cart-item-right">
                            <span className="cart-item-total">${item.itemTotal}</span>
                            <button
                                className="cart-remove-btn"
                                onClick={() => handleRemove(item.variantId)}
                            >Remove</button>
                        </div>

                    </div>
                ))}
            </div>

            <div className="cart-summary">
                <div className="cart-total-row">
                    <span className="cart-total-label">Total</span>
                    <span className="cart-total-value">${cart.totalPrice}</span>
                </div>
                <button className="cart-checkout-btn" onClick={() => navigate('/checkout')}>
                    Proceed to Checkout
                </button>
            </div>

        </div>
    )
}