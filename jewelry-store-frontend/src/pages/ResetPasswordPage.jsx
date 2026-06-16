import { useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { resetPassword } from "../api/authApi.js"
import "./Auth.css"

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams()
    const token = searchParams.get('token')

    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)
    const [done, setDone] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)

        if (password.length < 8) {
            setError('Password must be at least 8 characters')
            return
        }


        if (password !== confirm) {
            setError('Passwords do not match')
            return
        }

        setLoading(true)
        try {
            await resetPassword(token, password)
            setDone(true)
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to reset password')
        } finally {
            setLoading(false)
        }
    }

    if (!token) {
        return (
            <div className="auth-page">
                <div className="auth-card">
                    <div className="auth-header">
                        <h1 className="auth-title">Invalid Link</h1>
                        <p className="auth-subtitle">This reset link is missing or malformed.</p>
                    </div>
                    <div className="auth-form">
                        <Link to="/forgot-password" className="auth-submit-btn">Request a New Link</Link>
                    </div>
                </div>
            </div>
        )
    }

    if (done) {
        return (
            <div className="auth-page">
                <div className="auth-card">
                    <div className="auth-header">
                        <h1 className="auth-title">Password Reset</h1>
                        <p className="auth-subtitle">Your password has been updated. You can sign in now.</p>
                    </div>
                    <div className="auth-form">
                        <Link to="/login" className="auth-submit-btn">Go to Sign In</Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <h1 className="auth-title">New Password</h1>
                    <p className="auth-subtitle">Choose a new password for your account</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {error && <p className="auth-error">{error}</p>}

                    <div className="auth-password-wrap">
                        <input
                            className="auth-input"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="New Password"
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

                    <input
                        className="auth-input"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Confirm New Password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        required
                    />

                    <button
                        type="submit"
                        className="auth-submit-btn"
                        disabled={loading}
                    >
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>
            </div>
        </div>
    )
}