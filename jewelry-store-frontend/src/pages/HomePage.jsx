import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getProductById } from "../api/productApi.js"
import ProductCard from "../components/ProductCard.jsx"
import "./HomePage.css"

const CATEGORIES = [
    {
        id: 1,
        name: "Rings",
        tagline: "Symbols of eternal devotion",
        description: "From solitaire diamonds to intricate bands, each ring is crafted to mark life's most precious moments.",
        image: "https://rusticandmain.com/cdn/shop/files/Oval-Lab-Diamond-Engagement-Ring-Pave-Band-The-Chloe-Rustic-And-Main_2_c461c610-8aa2-45b0-85a0-e111a0a170b0.jpg?v=1726152200",
        fade: "fade-right"
    },
    {
        id: 2,
        name: "Necklaces",
        tagline: "Grace, close to the heart",
        description: "Delicate chains and pendant necklaces designed to complement every occasion with understated elegance.",
        image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1400&q=80",
        fade: "fade-left"
    },
    {
        id: 3,
        name: "Earrings",
        tagline: "Frame your natural beauty",
        description: "From subtle studs to statement drops, our earrings are designed to move with you through every moment.",
        image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1400&q=80",
        fade: "fade-right"
    },
    {
        id: 4,
        name: "Bracelets",
        tagline: "Worn close, remembered always",
        description: "Refined bracelets that layer beautifully or stand alone as a quiet declaration of personal style.",
        image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=1400&q=80",
        fade: "fade-left"
    }
]

const FEATURED_IDS = [1,2,3]

export default function HomePage() {
    const [featuredProducts, setFeaturedProducts] = useState([])

    useEffect(() => {
        const fetchFeatured = async () => {
            try {
                const results = await Promise.all(
                    FEATURED_IDS.map(id => getProductById(id))
                )
                setFeaturedProducts(results.map(r => r.data))
            } catch (err) {
                console.error('Failed to load featured products', err)
            }
        }
        fetchFeatured()
    }, [])

    return (
        <div className="hp-page">

            <section className="hp-hero">
                <img
                    className="hp-hero-img"
                    src="https://rusticandmain.com/cdn/shop/files/Oval-Lab-Diamond-Engagement-Ring-Pave-Band-The-Chloe-Rustic-And-Main_2_c461c610-8aa2-45b0-85a0-e111a0a170b0.jpg?v=1726152200"
                    alt="Hero"
                />
                <div className="hp-hero-content">
                    <p className="hp-hero-eyebrow">New Collection 2026</p>
                    <h1 className="hp-hero-title">Crafted for<br />the Extraordinary</h1>
                    <p className="hp-hero-subtitle">Fine jewellery for life's defining moments</p>
                    <Link className="hp-hero-btn" to="/products">Explore Collection</Link>
                </div>
            </section>

            <section className={`hp-category ${CATEGORIES[0].fade}`}>
                <img className="hp-category-img" src={CATEGORIES[0].image} alt="Rings" />
                <div className="hp-category-content">
                    <p className="hp-category-eyebrow">Collection</p>
                    <h2 className="hp-category-title">{CATEGORIES[0].name}</h2>
                    <p className="hp-category-desc">{CATEGORIES[0].description}</p>
                    <Link className="hp-category-btn" to={`/products?categoryId=${CATEGORIES[0].id}`}>
                        Shop Rings
                    </Link>
                </div>
            </section>

            {featuredProducts.length > 0 && (
                <section className="hp-featured">
                    <p className="hp-featured-label">✦ &nbsp; Featured Pieces &nbsp; ✦</p>
                    <div className="hp-featured-grid">
                        {featuredProducts.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </section>
            )}

            <section className={`hp-category ${CATEGORIES[1].fade}`}>
                <img className="hp-category-img" src={CATEGORIES[1].image} alt="Necklaces" />
                <div className="hp-category-content">
                    <p className="hp-category-eyebrow">Collection</p>
                    <h2 className="hp-category-title">{CATEGORIES[1].name}</h2>
                    <p className="hp-category-desc">{CATEGORIES[1].description}</p>
                    <Link className="hp-category-btn" to={`/products?categoryId=${CATEGORIES[1].id}`}>
                        Shop Necklaces
                    </Link>
                </div>
            </section>

            <section className={`hp-category ${CATEGORIES[2].fade}`}>
                <img className="hp-category-img" src={CATEGORIES[2].image} alt="Earrings" />
                <div className="hp-category-content">
                    <p className="hp-category-eyebrow">Collection</p>
                    <h2 className="hp-category-title">{CATEGORIES[2].name}</h2>
                    <p className="hp-category-desc">{CATEGORIES[2].description}</p>
                    <Link className="hp-category-btn" to={`/products?categoryId=${CATEGORIES[2].id}`}>
                        Shop Earrings
                    </Link>
                </div>
            </section>

            <section className={`hp-category ${CATEGORIES[3].fade}`}>
                <img className="hp-category-img" src={CATEGORIES[3].image} alt="Bracelets" />
                <div className="hp-category-content">
                    <p className="hp-category-eyebrow">Collection</p>
                    <h2 className="hp-category-title">{CATEGORIES[3].name}</h2>
                    <p className="hp-category-desc">{CATEGORIES[3].description}</p>
                    <Link className="hp-category-btn" to={`/products?categoryId=${CATEGORIES[3].id}`}>
                        Shop Bracelets
                    </Link>
                </div>
            </section>

            <section className="hp-story">
                <p className="hp-story-flourish">✦ ✦ ✦</p>
                <h2 className="hp-story-title">A Legacy of<br />Fine Craftsmanship</h2>
                <p className="hp-story-text">
                    Every piece in our collection is a testament to the art of jewellery making;
                    where timeless design meets exceptional materials. We believe that fine jewellery
                    is not merely an accessory, but a story worn close to the skin.
                </p>
                <Link className="hp-story-btn" to="/products">Discover the Collection</Link>
            </section>

        </div>
    )
}