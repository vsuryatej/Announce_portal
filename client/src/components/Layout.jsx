import { Link, NavLink, Outlet, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Badge } from "./ui"
import ThemeToggle from "./ThemeToggle"

export default function Layout() {
  const { user, logout, isAuthor } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const navClass = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive
        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
    }`

  return (
    <span className="app-shell block min-h-screen">
      <header className="header-bar">
        <span className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-bold text-white shadow-md shadow-indigo-200 dark:shadow-indigo-950/50">
              AP
            </span>
            <span>
              <span className="font-display block text-lg font-bold leading-tight text-heading">
                Announce
              </span>
              <span className="block text-[10px] font-medium uppercase tracking-wider text-muted">
                Internal Portal
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <NavLink to="/" end className={navClass}>
              Feed
            </NavLink>
            {isAuthor && (
              <>
                <NavLink to="/drafts" className={navClass}>
                  Drafts
                </NavLink>
                <NavLink
                  to="/new"
                  className="ml-1 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                >
                  + New post
                </NavLink>
              </>
            )}
          </nav>

          <span className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <span className="hidden text-right sm:block">
              <span className="block text-sm font-medium text-body">
                {user?.email}
              </span>
              <Badge variant={isAuthor ? "category" : "unread"}>
                {user?.role}
              </Badge>
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="btn-secondary !py-2 !text-xs"
            >
              Sign out
            </button>
          </span>
        </span>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </span>
  )
}
