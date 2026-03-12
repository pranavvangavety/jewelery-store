import { useState } from "react"
import { useAuth } from "../context/AuthContext.jsx"
import { Link, useNavigate } from "react-router-dom"
import { loginUser } from "../api/authApi.js"
import "./Auth.css"
import {mergeCart} from "../api/cartApi.js";

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const { setCurrentUser,sessionId, setCartCount } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        try {
            const response = await loginUser(email, password)
            setCurrentUser(response.data)
            try {
                const mergeResponse = await mergeCart(sessionId)
                setCartCount(mergeResponse.data.totalItems)
            } catch (err) {
                // nothing?
            }
            navigate('/')
        } catch (err) {
            setError('Invalid email or password')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">

                <div className="auth-header">
                    <h1 className="auth-title">Welcome Back</h1>
                    <p className="auth-subtitle">Sign in to your account</p>
                </div>

                <div className="auth-form">
                    {error && <p className="auth-error">{error}</p>}

                    <input
                        className="auth-input"
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <div className="auth-password-wrap">
                        <input
                            className="auth-input"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            className="auth-show-btn"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? 'Hide' : 'Show'}
                        </button>
                    </div>

                    <button
                        className="auth-submit-btn"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                </div>

                <p className="auth-footer">
                    Don't have an account? <Link to="/register">Create one</Link>
                </p>

            </div>
        </div>
    )
}