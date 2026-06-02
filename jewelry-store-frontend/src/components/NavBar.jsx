import {useAuth} from "../context/AuthContext.jsx";
import {Link, useNavigate, useLocation} from "react-router-dom";
import {useEffect, useState} from "react";
import {getAllCategories} from "../api/productApi.js";
import { ShoppingBag } from "lucide-react";
import "./NavBar.css";


export default function NavBar() {
    const {user, logout, cartCount} = useAuth()
    const navigate = useNavigate()
    const [categories, setCategories] = useState([])
    const [searchQuery, setSearchQuery] = useState('')

    function handleSearch(e) {
        if (e.key === 'Enter' && searchQuery.trim()) {
            navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
            setSearchQuery('')
        }
    }


    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await getAllCategories()
                setCategories(response.data)
            } catch (err) {
                console.error('Failed to load categories')
            }
        }

        fetchCategories()
    }, [])

    const location = useLocation()
    const params = new URLSearchParams(location.search)
    const activeCategoryId = params.get('categoryId')

    return (
        <nav className="navbar">
            <div className="nav-top">
                <Link to="/" className="nav-logo">Jewelry <span>Store</span></Link>

                <div className="nav-search">
                    <input
                        className="nav-search-input"
                        type="text"
                        placeholder="Search jewellery…"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearch}
                    />
                </div>

                <div className="nav-right">
                    {user ? (
                        <>
                            {user.role === 'ADMIN' ? (
                                <Link to="/admin" className="nav-link gold">Admin Panel</Link>

                            ) : (
                                <>
                                    <Link to="/profile" className="nav-link">Hi, {user.firstName}</Link>
                                    <div className="nav-divider"/>
                                    <Link to="/orders" className="nav-link">My Orders</Link>
                                    <div className="nav-divider"/>
                                </>
                            )}
                            <button className="nav-link gold" onClick={logout}>Sign Out</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="nav-link">Login</Link>
                            <div className="nav-divider"/>
                            <Link to="/register" className="nav-link gold">Register</Link>
                        </>
                    )}
                    {user?.role !== 'ADMIN' && (
                        <Link to="/cart" className="cart-link">
                            <ShoppingBag size={20} strokeWidth={1.5}/>
                            <span className="cart-badge">{cartCount}</span>
                        </Link>
                    )}
                </div>

            </div>

            <div className="nav-categories">
                <Link
                    className={`nav-category ${!activeCategoryId && location.pathname === '/products' ? 'nav-category--active' : ''}`}
                    to="/products"
                >
                    All
                </Link>
                {categories.map(category => (
                    <Link
                        className={`nav-category ${activeCategoryId === String(category.id) ? 'nav-category--active' : ''}`}
                        key={category.id}
                        to={`/products?categoryId=${category.id}`}
                    >
                        {category.name}
                    </Link>
                ))}
            </div>
        </nav>
    )

}