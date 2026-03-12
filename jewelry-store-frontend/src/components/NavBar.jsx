import {useAuth} from "../context/AuthContext.jsx";
import {Link} from "react-router-dom";
import {useEffect, useState} from "react";
import {getAllCategories} from "../api/productApi.js";
import { ShoppingBag } from "lucide-react";
import "./NavBar.css";


export default function NavBar() {
    const {user, logout, cartCount} = useAuth()
    const [categories, setCategories] = useState([])


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

    return (
        <nav className="navbar">
            <div className="nav-top">
                <Link to="/" className="nav-logo">Jewelry <span>Store</span></Link>

                <div className="nav-right">
                    {user ? (
                        <>
                            {/*<span className="nav-link">Hi, {user.firstName}</span>*/}
                            {/*<div className="nav-divider"/>*/}
                            <Link to="/profile" className="nav-link">Hi, {user.firstName}</Link>
                            <div className="nav-divider"/>
                            <Link to="/orders" className="nav-link">My Orders</Link>
                            <div className="nav-divider"/>
                            <button  className="nav-link gold" onClick={logout}>Sign Out</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login"  className="nav-link">Login</Link>
                            <div className="nav-divider"/>
                            <Link to="/register"  className="nav-link gold">Register</Link>
                        </>

                    )}
                    <Link to="/cart" className="cart-link">
                    <ShoppingBag size={20} strokeWidth={1.5}/>
                    <span className="cart-badge">{cartCount}</span>
                    </Link>
                </div>
            </div>

            <div className="nav-categories">
                {categories.map(category => (
                    <Link className="nav-category" key={category.id} to={`/products?categoryId=${category.id}`}>
                        {category.name}
                    </Link>
                ))}
            </div>
        </nav>
    )

}