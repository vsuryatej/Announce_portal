import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import AuthShell from "../components/AuthShell"
import { Alert } from "../components/ui"

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await register(email, password)
      navigate("/")
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Join the portal"
      subtitle="Register as a reader. Authors are assigned by your administrator."
    >
      {error && <Alert>{error}</Alert>}
      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Work email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="you@company.com"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Password (min 6 characters)
          </span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />
        </label>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Already registered?{" "}
        <Link to="/login" className="font-semibold text-indigo-600 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
