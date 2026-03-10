import {createContext, useContext, useState} from "react";

const AuthContext = createContext(null)

export function AuthProvider({children}) {
    const [user, setUser] = useState(
        () => {
            const stored = localStorage.getItem('user')
            return stored ? JSON.parse(stored) : null
        }
    )

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

    const login = (userData) => {
        setUser(userData)
        localStorage.setItem('user', JSON.stringify(userData))
    }

    const logout = () => {
        setUser(null)
        localStorage.removeItem('user')
    }

    return (
        <AuthContext.Provider value={{user, login, logout, sessionId}}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}