import {useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import {addToCart} from "../api/cartApi.js";
import {getProductById} from "../api/productApi.js";

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

    if(loading) return <p>Loading...</p>
    if (error) return <p>{error}</p>
    if (!product) return null

    const images = selectedVariant?.images ?? []
    const primaryImage = images.find(img => img.primary) ?? images[0]
    const displayImage = images[selectedImageIndex] ?? primaryImage

    return (
        <div>
            <div>
                <img
                    src={displayImage?.url || 'https://placehold.co/500x500?text=No+Image'}
                    alt={displayImage?.altText || product.name}/>
                <div>
                    {images.map((img, index) => (
                        <img
                            key = {img.id}
                            src = {img.url}
                            alt={img.altText || product.name}
                            onClick={() => setSelectedImageIndex(index)}
                            style={{opacity: index === selectedImageIndex ? 1 : 0.5, cursor: 'pointer'}}
                        />
                    ))}
                </div>
            </div>

            <div>
                <p>{product.category.name}</p>
                <h1>{product.name}</h1>
                <p>{product.material}</p>
                <p>{product.description}</p>

                <div>
                    <label>Variant</label>
                    <select
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

                    {selectedVariant && <p>${selectedVariant.price}</p>}

                    <div>
                        <button
                            onClick={() => setQuantity(q => Math.max(1, q-1))}
                            disabled={quantity <= 1}
                        >
                        -
                        </button>
                        <span>{quantity}</span>
                        <button onClick={() => setQuantity(q => q +1)}>+</button>
                    </div>

                    <button onClick={handleAddToCart} disabled={!selectedVariant}>Add to cart</button>

                    {cartStatus === 'success' && <p>Added to cart!</p>}
                    {cartStatus === 'error' && <p>Failed to add to cart. Try again</p>}
                </div>
            </div>
        </div>
    )
}