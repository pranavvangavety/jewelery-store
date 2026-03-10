import {useNavigate} from "react-router-dom";

export default function ProductCard({product}) {
    const navigate = useNavigate()

    const primaryImage = product.variants
        ?.flatMap(v => v.images)
        ?.find(img => img.primary)?.url

    const lowestPrice = Math.min(...product.variants.map(v => v.price))

    return (
        <div onClick={() => navigate(`/products/${product.id}`)}>
            <img
                src={primaryImage || 'https://placehold.co/300x300?text=No+Image'}
                alt={product.name}
            />
            <h3>{product.name}</h3>
            <p>{product.material}</p>
            <p>From ${lowestPrice}</p>
        </div>
    )
}