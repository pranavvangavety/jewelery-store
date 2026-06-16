import { useState } from "react"
import { Link } from "react-router-dom"
import { forgotPassword } from "../api/authApi.js"
import "./Auth.css"

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [submitted, setSubmitted] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            await forgotPassword(email)
        } catch (err) {
            //ignored
        } finally {
            setLoading(false)
            setSubmitted(true)
        }
    }

    if (submitted) {
        return (
            <div className="auth-page">
                <div className="auth-card">
                    <div className="auth-header">
                        <h1 className="auth-title">Check Your Email</h1>
                        <p className="auth-subtitle">
                            If an account exists for that address, a reset link is on its way.
                        </p>
                    </div>
                    <div className="auth-form">
                        <Link to="/login" className="auth-submit-btn">Back to Sign In</Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <h1 className="auth-title">Reset Password</h1>
                    <p className="auth-subtitle">Enter your email to receive a reset link</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <input
                        className="auth-input"
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <button
                        type="submit"
                        className="auth-submit-btn"
                        disabled={loading}
                    >
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>

                <p className="auth-footer">
                    Remembered it? <Link to="/login">Sign in</Link>
                </p>
            </div>
        </div>
    )
}