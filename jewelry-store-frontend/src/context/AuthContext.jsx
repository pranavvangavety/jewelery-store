import {createContext, useContext, useState} from "react";
import {logoutUser} from "../api/authApi.js";

const AuthContext = createContext(null)

export function AuthProvider({children}) {
    const [user, setUser] = useState(
        () => {
            const stored = localStorage.getItem('user')
            return stored ? JSON.parse(stored) : null
        }
    )

    const [cartCount, setCartCount] = useState(0)


    const [sessionId] = useState(
        () => {
            const existing = localStorage.getItem('sessionId')
            if(existing){
                return existing
            }
            const newSessionId = crypto.randomUUID()
            localStorage.setItem('sessionId', newSessionId)
            return newSessionId
        }
    )

    const setCurrentUser = (userData) => {
        setUser(userData)
        localStorage.setItem('user', JSON.stringify(userData))
    }

    const logout = async () => {
        try {
            await logoutUser()
        } catch (e) {
            // proceed with local cleanup even if the call fails
        }
        setUser(null)
        localStorage.removeItem('user')
        window.location.href = '/'
    }

    return (
        <AuthContext.Provider value={{user, setCurrentUser, logout, sessionId, cartCount, setCartCount}}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}