import {useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import {addToCart} from "../api/cartApi.js";
import {getProductById} from "../api/productApi.js";
import "./ProductDetailsPage.css"

export default function ProductDetailsPage() {
    const {id} = useParams()

    const [product, setProduct] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const [selectedVariant, setSelectedVariant] = useState(null)
    const [selectedImageIndex, setSelectedImageIndex] = useState(0)
    const [quantity, setQuantity] = useState(1)
    const [cartStatus, setCartStatus] = useState(null)

    useEffect(() => {
        const fetchProduct = async () => {
            try{
                const response = await getProductById(id)
                setProduct(response.data)
                setSelectedVariant(response.data.variants[0] ?? null)
            } catch (err) {
                setError('Failed to load product')
            } finally {
                setLoading(false)
            }
        }
        fetchProduct()
    }, [id])

    useEffect(() => {
        setSelectedImageIndex(0)
    }, [selectedVariant])

    const handleAddToCart = async () => {
        if(!selectedVariant) return
        setCartStatus(null)
        try{
            await addToCart(selectedVariant.id, quantity)
            setCartStatus('success')
        } catch (err) {
            setCartStatus('error')
        }
    }

    if(loading) return <div className="pdp-loading">Loading...</div>
    if (error) return <div className="pdp-error">{error}</div>
    if (!product) return null

    const images = selectedVariant?.images ?? []
    const primaryImage = images.find(img => img.primary) ?? images[0]
    const displayImage = images[selectedImageIndex] ?? primaryImage

    return (
        <div className="pdp-page">

            <div className="pdp-gallery">
                <div className="pdp-main-image">
                    <img
                        src={displayImage?.url || '/placeholder.jpg'}
                        alt={displayImage?.altText || product.name}
                    />
                </div>
                {images.length > 1 && (
                    <div className="pdp-thumbnails">
                        {images.map((img, index) => (
                            <div
                                key={img.id}
                                className={`pdp-thumb ${index === selectedImageIndex ? 'active' : ''}`}
                                onClick={() => setSelectedImageIndex(index)}
                            >
                                <img src={img.url} alt={img.altText || product.name} />
                            </div>
                        ))}
                    </div>
                )}
            </div>


            <div className="pdp-info">
                <div className="pdp-category">{product.category.name}</div>
                <h1 className="pdp-name">{product.name}</h1>
                <div className="pdp-material">{product.material.replace(/_/g, ' ')}</div>
                <p className="pdp-description">{product.description}</p>

                {selectedVariant && (
                    <div className="pdp-price">${selectedVariant.price}</div>
                )}

                <div className="pdp-section-label">Select Variant</div>
                <select
                    className="pdp-select"
                    value={selectedVariant?.id ?? ''}
                    onChange={(e) => {
                        const variant = product.variants.find(v => v.id === Number(e.target.value))
                        setSelectedVariant(variant)
                    }}
                >
                    {product.variants.map(v => (
                        <option key={v.id} value={v.id}>
                            {[v.color, v.size].filter(Boolean).join(' / ')} — ${v.price}
                        </option>
                    ))}
                </select>

                <div className="pdp-section-label">Quantity</div>
                <div className="pdp-quantity">
                    <button
                        className="pdp-qty-btn"
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                    >−</button>
                    <span className="pdp-qty-value">{quantity}</span>
                    <button
                        className="pdp-qty-btn"
                        onClick={() => setQuantity(q => q + 1)}
                    >+</button>
                </div>

                <button
                    className="pdp-add-btn"
                    onClick={handleAddToCart}
                    disabled={!selectedVariant}
                >
                    Add to Cart
                </button>

                {cartStatus === 'success' && (
                    <div className="pdp-cart-success">Added to your cart</div>
                )}
                {cartStatus === 'error' && (
                    <div className="pdp-cart-error">Failed to add to cart. Try again.</div>
                )}
            </div>
        </div>
    )
}