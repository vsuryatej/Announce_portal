import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { AuthProvider, useAuth } from "./context/AuthContext"
import { ThemeProvider } from "./context/ThemeContext"
import Layout from "./components/Layout"
import ProtectedRoute from "./components/ProtectedRoute"
import Login from "./pages/Login"
import Register from "./pages/Register"
import AnnouncementList from "./pages/AnnouncementList"
import AnnouncementDetail from "./pages/AnnouncementDetail"
import AnnouncementForm from "./pages/AnnouncementForm"
import Drafts from "./pages/Drafts"
import Analytics from "./pages/Analytics"

function GuestOnly({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <p className="py-20 text-center text-slate-500">Loading…</p>
  if (user) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <GuestOnly>
                <Login />
              </GuestOnly>
            }
          />
          <Route
            path="/register"
            element={
              <GuestOnly>
                <Register />
              </GuestOnly>
            }
          />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AnnouncementList />} />
            <Route path="announcements/:id" element={<AnnouncementDetail />} />
            <Route
              path="announcements/:id/analytics"
              element={
                <ProtectedRoute authorOnly>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="drafts"
              element={
                <ProtectedRoute authorOnly>
                  <Drafts />
                </ProtectedRoute>
              }
            />
            <Route
              path="new"
              element={
                <ProtectedRoute authorOnly>
                  <AnnouncementForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="edit/:id"
              element={
                <ProtectedRoute authorOnly>
                  <AnnouncementForm />
                </ProtectedRoute>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  )
}
