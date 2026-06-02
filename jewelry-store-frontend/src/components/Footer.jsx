import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
    const year = new Date().getFullYear()

    return (
        <footer className="footer">
            <div className="footer-inner">

                <div className="footer-brand">
                    <p className="footer-brand-name">Trinket Story</p>
                    <p className="footer-tagline">Crafted with intention. Worn with meaning.</p>
                </div>

                <nav className="footer-links">
                    <Link to="/" className="footer-link">Home</Link>
                    <Link to="/products" className="footer-link">Collections</Link>
                    <Link to="/cart" className="footer-link">Cart</Link>
                    <Link to="/orders" className="footer-link">My Orders</Link>
                </nav>

            </div>

            <div className="footer-bottom">
                <p className="footer-copy">© {year} Trinket Story. All rights reserved.</p>
            </div>
        </footer>
    )
}