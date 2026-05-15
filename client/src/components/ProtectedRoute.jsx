import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function ProtectedRoute({ children, authorOnly = false }) {
  const { user, loading, isAuthor } = useAuth()

  if (loading) {
    return <p className="py-20 text-center text-slate-500">Loading…</p>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (authorOnly && !isAuthor) {
    return <Navigate to="/" replace />
  }

  return children
}
