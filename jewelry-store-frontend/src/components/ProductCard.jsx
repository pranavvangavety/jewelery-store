import { useNavigate } from "react-router-dom";
import "./ProductCard.css";

export default function ProductCard({ product }) {
    const navigate = useNavigate()

    const primaryImage = product.variants
        ?.flatMap(v => v.images)
        ?.find(img => img.primary)?.url

    const lowestPrice = Math.min(...product.variants.map(v => v.price))

    return (
        <div className="product-card" onClick={() => navigate(`/products/${product.id}`)}>
            <div className="card-img-wrap">
                <img
                    className="card-img"
                    src={primaryImage || '/placeholder.jpg'}
                    alt={product.name}
                />
            </div>
            <div className="card-body">
                <div className="card-material">{product.material.replace(/_/g, ' ')}</div>
                <div className="card-name">{product.name}</div>
                <div className="card-footer">
                    <div className="card-price">
                        <span className="card-price-label">from</span>
                        ${lowestPrice.toLocaleString()}
                    </div>
                </div>
            </div>
        </div>
    )
}