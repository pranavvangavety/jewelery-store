import { useAuth } from "../context/AuthContext.jsx"
import { Navigate } from "react-router-dom"

export default function AdminRoute({ children }) {
    const { user } = useAuth()

    if (!user || user.role !== 'ADMIN') {
        return <Navigate to="/login" replace />
    }

    return children
}