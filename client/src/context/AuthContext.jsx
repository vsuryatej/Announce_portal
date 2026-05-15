import { createContext, useContext, useEffect, useState } from "react"
import { api } from "../api/client"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      setLoading(false)
      return
    }
    api
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => {
        localStorage.removeItem("token")
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const { token, user } = await api.login(email, password)
    localStorage.setItem("token", token)
    setUser(user)
    return user
  }

  const register = async (email, password) => {
    const { token, user } = await api.register(email, password)
    localStorage.setItem("token", token)
    setUser(user)
    return user
  }

  const logout = () => {
    localStorage.removeItem("token")
    setUser(null)
  }

  const isAuthor = user?.role === "AUTHOR"

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, isAuthor }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
