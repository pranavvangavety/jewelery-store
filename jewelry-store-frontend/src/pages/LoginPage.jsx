import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext.jsx"
import { Link, useNavigate } from "react-router-dom"
import {loginUser, resendVerification} from "../api/authApi.js"
import "./Auth.css"
import {mergeCart} from "../api/cartApi.js";

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const { setCurrentUser,sessionId, setCartCount, user } = useAuth()
    const navigate = useNavigate()

    const [needsVerification, setNeedsVerification] = useState(false)
    const [resendStatus, setResendStatus] = useState(null)

    useEffect(() => {
        if (user) {
            user.role === 'ADMIN' ? navigate('/admin') : navigate('/')
        }
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setNeedsVerification(false)
        setResendStatus(null)
        try {
            const response = await loginUser(email, password)
            setCurrentUser(response.data)
            try {
                const mergeResponse = await mergeCart(sessionId)
                setCartCount(mergeResponse.data.totalItems)
            } catch (err) {
                // nothing?
            }
            response.data.role === 'ADMIN' ? navigate('/admin') : navigate('/')
        } catch (err) {
            if (!err.response || err.response.status >= 500) {
                setError('Unable to connect. Please try again later.')
            } else if (err.response.status === 403) {
                setError('Please verify your email before signing in.')
                setNeedsVerification(true)
            }
            else {
                setError('Invalid email or password')
            }
        } finally {
            setLoading(false)
        }
    }

    const handleResend = async () => {
        setResendStatus('sending')
        try {
            await resendVerification(email)
        } catch (err) {
            // resend is fire-and-forget; always show sent
        } finally {
            setResendStatus('sent')
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">

                <div className="auth-header">
                    <h1 className="auth-title">Welcome Back</h1>
                    <p className="auth-subtitle">Sign in to your account</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {error && <p className="auth-error">{error}</p>}
                    {needsVerification && resendStatus !== 'sent' && (
                        <p className="auth-footer">
                            <button
                                type="button"
                                className="auth-link-btn"
                                onClick={handleResend}
                                disabled={resendStatus === 'sending'}
                            >
                                {resendStatus === 'sending' ? 'Sending...' : 'Resend verification email'}
                            </button>
                        </p>
                    )}
                    {resendStatus === 'sent' && (
                        <p className="auth-footer">Verification email sent. Check your inbox.</p>
                    )}

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
                        type="submit"
                        className="auth-submit-btn"
                        disabled={loading}
                    >
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                <p className="auth-footer">
                    <Link to="/forgot-password">Forgot password?</Link>
                </p>

                <p className="auth-footer">
                    Don't have an account? <Link to="/register">Create one</Link>
                </p>

            </div>
        </div>
    )
}