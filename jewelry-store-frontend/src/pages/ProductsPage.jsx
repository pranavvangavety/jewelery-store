import {useEffect, useState} from "react";
import {useSearchParams} from "react-router-dom";
import {getAllProducts} from "../api/productApi.js";
import ProductCard from "../components/ProductCard.jsx";

export default function ProductsPage() {

    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const [searchParams] = useSearchParams()
    const category = searchParams.get('category')

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true)
            setError(null)

            try {
                const response = await getAllProducts(category)
                setProducts(response.data)
            } catch(err) {
                setError('Failed to load products')
            } finally {
                setLoading(false)
            }
        }

        fetchProducts()
    }, [category])

    if (loading) return <p>Loading..,</p>
    if(error) return <p>{error}</p>

    return (
        <div>
            <h2>{category ? category : 'All Products'}</h2>
            <div>
                {products.map(product => (
                    <ProductCard key={product.id} product={product}/>
                ))}
            </div>
        </div>
    )
}