import { useState, useEffect, useRef } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { verifyEmail } from "../api/authApi.js"
import "./Auth.css"

export default function VerifyEmailPage() {
    const [searchParams] = useSearchParams()
    const [status, setStatus] = useState('verifying')
    const hasRun = useRef(false)

    useEffect(() => {
        if (hasRun.current) return
        hasRun.current = true

        const token = searchParams.get('token')
        if (!token) {
            setStatus('error')
            return
        }

        verifyEmail(token)
            .then(() => setStatus('success'))
            .catch(() => setStatus('error'))
    }, [searchParams])

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    {status === 'verifying' && (
                        <>
                            <h1 className="auth-title">Verifying…</h1>
                            <p className="auth-subtitle">Just a moment</p>
                        </>
                    )}
                    {status === 'success' && (
                        <>
                            <h1 className="auth-title">Email Verified</h1>
                            <p className="auth-subtitle">Your account is ready. You can sign in now.</p>
                        </>
                    )}
                    {status === 'error' && (
                        <>
                            <h1 className="auth-title">Verification Failed</h1>
                            <p className="auth-subtitle">This link is invalid or has expired.</p>
                        </>
                    )}
                </div>

                {status !== 'verifying' && (
                    <div className="auth-form">
                        <Link to="/login" className="auth-submit-btn">Go to Sign In</Link>
                    </div>
                )}
            </div>
        </div>
    )
}