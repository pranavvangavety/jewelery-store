import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { registerUser } from "../api/authApi.js"
import { useAuth } from "../context/AuthContext.jsx"
import "./Auth.css"

export default function RegisterPage() {
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)

    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        try {
            const response = await registerUser(firstName, lastName, email, password)
            login(response.data)
            navigate('/')
        } catch (err) {
            setError('Unable to create account')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">

                <div className="auth-header">
                    <h1 className="auth-title">Create Account</h1>
                    <p className="auth-subtitle">Join us today</p>
                </div>

                <div className="auth-form">
                    {error && <p className="auth-error">{error}</p>}

                    <div className="auth-name-row">
                        <input
                            className="auth-input"
                            type="text"
                            placeholder="First Name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                        />
                        <input
                            className="auth-input"
                            type="text"
                            placeholder="Last Name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                        />
                    </div>

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
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </div>

                <p className="auth-footer">
                    Already have an account? <Link to="/login">Sign in</Link>
                </p>

            </div>
        </div>
    )
}