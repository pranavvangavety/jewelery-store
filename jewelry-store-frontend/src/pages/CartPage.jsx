import {useNavigate} from "react-router-dom";
import {getCart, removeCartItem, updateCartItem} from "../api/cartApi.js";
import {useEffect, useState} from "react";

export default function CartPage(){
    const [cart, setCart] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const navigate = useNavigate()

    const fetchCart =  async() => {
        try{
            const response = await getCart()
            setCart(response.data)
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
        } catch(err) {
            alert('Failed to update quantity')
        }
    }

    const handleRemove = async(variantId) => {
        try{
            const response = await removeCartItem(variantId)
            setCart(response.data)
        } catch (err) {
            alert('Failed to remove item')
        }
    }

    if(loading) return <p>Loading...</p>
    if(error) return <p>{error}</p>
    if(!cart || cart.items.length === 0) return <p>Your cart is empty.</p>

    return (
        <div>
            <h2>Your Cart</h2>

            {cart.items.map(item => (
                <div key={item.variantId}>
                    <img
                        src={item.imageUrl || 'https://placehold.co/100x100?text=No+Image'}
                        alt={item.productName}
                    />
                    <div>
                        <p>{item.productName}</p>
                        <p>{[item.color, item.size].filter(Boolean).join('/')}</p>
                        <p>${item.price}</p>
                    </div>
                    <div>
                        <button onClick={
                            () => handleQuantityChange(item.variantId, item.quantity - 1)
                        } disabled={item.quantity <= 1}>
                            -
                        </button>
                        <span>{item.quantity}</span>
                        <button onClick={
                            () => handleQuantityChange(item.variantId, item.quantity + 1)
                        }>
                            +
                        </button>
                    </div>
                    <p>{item.itemTotal}</p>
                    <button onClick={() => handleRemove(item.variantId)}>Remove</button>
                </div>
            ))}

            <p>Total: ${cart.totalPrice}</p>
            <button onClick={() => navigate('/checkout')}>Proceed to checkout</button>

        </div>
    )
}