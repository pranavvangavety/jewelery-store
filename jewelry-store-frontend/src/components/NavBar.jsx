import {useAuth} from "../context/AuthContext.jsx";
import {Link} from "react-router-dom";
import {useEffect, useState} from "react";
import {getAllCategories} from "../api/productApi.js";


export default function NavBar() {
    const {user, logout} = useAuth()
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
        <nav>
            <div className="nav-top">
                <Link to="/" className="nav-logo">Jewelry Store</Link>

                <div className="nav-right">
                    {user ? (
                        <>
                            <span>Hi, {user.firstName}</span>
                            <Link to="/orders">My Orders</Link>
                            <button onClick={logout}>Logout</button>
                        </>
                    ) : (
                        <Link to="/login">Login</Link>
                    )}
                    <Link to="/cart">Cart</Link>
                </div>
            </div>

            <div className="nav-categories">
                {categories.map(category => (
                    <Link key={category.id} to={`/products?categoryId=${category.id}`}>
                        {category.name}
                    </Link>
                ))}
            </div>
        </nav>
    )

}