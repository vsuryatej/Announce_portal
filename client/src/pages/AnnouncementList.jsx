import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { api } from "../api/client"
import { formatCategory, formatDate } from "../utils/format"
import {
  Alert,
  Badge,
  EmptyState,
  LoadingCards,
  PageHeader,
  StatCard,
} from "../components/ui"

const emptyFilters = {
  category: "",
  requiresAck: "",
  unread: false,
  unacknowledged: false,
  search: "",
  status: "PUBLISHED",
  sortBy: "publishedAt",
  sortOrder: "desc",
  page: 1,
}

export default function AnnouncementList() {
  const [categories, setCategories] = useState([])
  const [filters, setFilters] = useState(emptyFilters)
  const [applied, setApplied] = useState(emptyFilters)
  const [data, setData] = useState([])
  const [stats, setStats] = useState({ total: 0, unread: 0, pendingAck: 0 })
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filtersOpen, setFiltersOpen] = useState(true)

  useEffect(() => {
    api.getCategories().then((r) => setCategories(r.categories))
    Promise.all([
      api.listAnnouncements({ unread: "true", pageSize: 1 }),
      api.listAnnouncements({ unacknowledged: "true", pageSize: 1 }),
    ]).then(([u, a]) =>
      setStats((s) => ({
        ...s,
        unread: u.pagination.total,
        pendingAck: a.pagination.total,
      }))
    )
  }, [])

  // AC15: debounced title search — updates list as you type; empty search restores full list
  useEffect(() => {
    const timer = setTimeout(() => {
      setApplied((prev) => {
        if (prev.search === filters.search) return prev
        return { ...prev, search: filters.search, page: 1 }
      })
    }, 400)
    return () => clearTimeout(timer)
  }, [filters.search])

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const params = {
        page: applied.page,
        sortBy: applied.sortBy,
        sortOrder: applied.sortOrder,
        status: applied.status,
      }
      if (applied.category) params.category = applied.category
      if (applied.requiresAck) params.requiresAck = applied.requiresAck
      if (applied.unread) params.unread = "true"
      if (applied.unacknowledged) params.unacknowledged = "true"
      if (applied.search.trim()) params.search = applied.search.trim()

      const res = await api.listAnnouncements(params)
      setData(res.data)
      setPagination(res.pagination)
      setStats((s) => ({ ...s, total: res.pagination.total }))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [applied])

  useEffect(() => {
    load()
  }, [load])

  const applyFilters = (e) => {
    e?.preventDefault()
    setApplied({ ...filters, page: 1 })
  }

  const quickFilter = (patch) => {
    const next = { ...filters, ...patch, page: 1 }
    setFilters(next)
    setApplied(next)
  }

  const clearFilters = () => {
    setFilters(emptyFilters)
    setApplied(emptyFilters)
  }

  const clearSearch = () => {
    setFilters((f) => ({ ...f, search: "" }))
    setApplied((p) => ({ ...p, search: "", page: 1 }))
  }

  return (
    <section>
      <PageHeader
        title="Announcement feed"
        subtitle="Stay on top of company news, HR updates, and items that need your acknowledgment."
        action={
          <button
            type="button"
            onClick={() => setFiltersOpen((o) => !o)}
            className="btn-secondary"
          >
            {filtersOpen ? "Hide filters" : "Show filters"}
          </button>
        }
      />

      {/* AC15: dedicated title search with clear */}
      <form
        className="search-bar mb-4 animate-fade-in"
        onSubmit={(e) => {
          e.preventDefault()
          setApplied((p) => ({ ...p, search: filters.search, page: 1 }))
        }}
      >
        <span className="text-lg" aria-hidden>
          🔍
        </span>
        <input
          type="search"
          value={filters.search}
          onChange={(e) =>
            setFilters((f) => ({ ...f, search: e.target.value }))
          }
          className="input !mt-0 flex-1 border-0 bg-transparent !shadow-none !ring-0 focus:!ring-0"
          placeholder="Search by title (case-insensitive)…"
          aria-label="Search announcements by title"
        />
        {filters.search && (
          <button
            type="button"
            onClick={clearSearch}
            className="btn-secondary shrink-0 !py-2 text-xs"
            title="Clear search and show all announcements"
          >
            Clear search
          </button>
        )}
        <button type="submit" className="btn-primary shrink-0 !py-2">
          Search
        </button>
      </form>

      {applied.search.trim() && (
        <p className="mb-4 flex flex-wrap items-center gap-2">
          <span className="chip chip-indigo">
            Title contains: &ldquo;{applied.search.trim()}&rdquo;
          </span>
          <button type="button" onClick={clearSearch} className="text-xs text-indigo-600 hover:underline dark:text-indigo-400">
            Remove filter
          </button>
        </p>
      )}

      <ul className="mb-8 grid gap-4 sm:grid-cols-3">
        <li>
          <StatCard
            label="Published posts"
            value={stats.total}
            hint={applied.search.trim() ? "Matching search" : "Matching filters"}
            accent="indigo"
          />
        </li>
        <li>
          <StatCard
            label="Unread"
            value={stats.unread}
            hint="All published"
            accent="amber"
          />
        </li>
        <li>
          <StatCard
            label="Awaiting your ack"
            value={stats.pendingAck}
            hint="Requires acknowledgment"
            accent="rose"
          />
        </li>
      </ul>

      <p className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => quickFilter({ unread: true, unacknowledged: false })}
          className="chip chip-amber"
        >
          My unread
        </button>
        <button
          type="button"
          onClick={() => quickFilter({ unacknowledged: true, unread: false })}
          className="chip chip-rose"
        >
          Needs acknowledgment
        </button>
        <button type="button" onClick={clearFilters} className="chip chip-slate">
          Clear all filters
        </button>
      </p>

      {filtersOpen && (
        <form
          onSubmit={applyFilters}
          className="card mb-8 grid gap-4 p-5 md:grid-cols-2 lg:grid-cols-4 animate-fade-in"
        >
          <label className="block text-sm lg:col-span-2">
            <span className="text-label">Search title</span>
            <input
              value={filters.search}
              onChange={(e) =>
                setFilters((f) => ({ ...f, search: e.target.value }))
              }
              className="input"
              placeholder="Same as search bar above…"
            />
          </label>
          <label className="block text-sm">
            <span className="text-label">Category</span>
            <select
              value={filters.category}
              onChange={(e) =>
                setFilters((f) => ({ ...f, category: e.target.value }))
              }
              className="input"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {formatCategory(c)}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-label">Ack required</span>
            <select
              value={filters.requiresAck}
              onChange={(e) =>
                setFilters((f) => ({ ...f, requiresAck: e.target.value }))
              }
              className="input"
            >
              <option value="">Any</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-label">Status</span>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((f) => ({ ...f, status: e.target.value }))
              }
              className="input"
            >
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
              <option value="ALL">Published + Archived</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-body">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 dark:border-slate-600"
              checked={filters.unread}
              onChange={(e) =>
                setFilters((f) => ({ ...f, unread: e.target.checked }))
              }
            />
            My unread only
          </label>
          <label className="flex items-center gap-2 text-sm text-body">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 dark:border-slate-600"
              checked={filters.unacknowledged}
              onChange={(e) =>
                setFilters((f) => ({ ...f, unacknowledged: e.target.checked }))
              }
            />
            Awaiting my acknowledgment
          </label>
          <label className="block text-sm">
            <span className="text-label">Sort</span>
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split("-")
                setFilters((f) => ({ ...f, sortBy, sortOrder }))
              }}
              className="input"
            >
              <option value="publishedAt-desc">Newest first</option>
              <option value="publishedAt-asc">Oldest first</option>
              <option value="title-asc">Title A–Z</option>
              <option value="title-desc">Title Z–A</option>
            </select>
          </label>
          <p className="flex items-end gap-2 md:col-span-2">
            <button type="submit" className="btn-primary">
              Apply filters
            </button>
            <button type="button" onClick={clearFilters} className="btn-secondary">
              Reset all
            </button>
          </p>
        </form>
      )}

      {error && (
        <p className="mb-4">
          <Alert>{error}</Alert>
        </p>
      )}

      {loading ? (
        <LoadingCards />
      ) : data.length === 0 ? (
        <EmptyState
          icon="📭"
          title={applied.search.trim() ? "No matching titles" : "No announcements found"}
          description={
            applied.search.trim()
              ? `Nothing matches "${applied.search.trim()}". Clear search to see all announcements.`
              : "Try adjusting your filters or check back later for new posts."
          }
          action={
            applied.search.trim() ? (
              <button type="button" onClick={clearSearch} className="btn-primary">
                Clear search
              </button>
            ) : null
          }
        />
      ) : (
        <ul className="space-y-3">
          {data.map((a, i) => (
            <li
              key={a.id}
              className="card card-hover animate-fade-in p-0"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <Link to={`/announcements/${a.id}`} className="block p-5">
                <header className="flex flex-wrap items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold text-heading">
                    {!a.hasRead && (
                      <span
                        className="mr-2 inline-block h-2 w-2 rounded-full bg-indigo-500 align-middle dark:bg-indigo-400"
                        title="Unread"
                      />
                    )}
                    {a.title}
                  </h2>
                  <Badge variant="category">{formatCategory(a.category)}</Badge>
                </header>
                <p className="mt-2 text-sm text-muted">
                  <span className="font-medium text-body">{a.author?.email}</span>
                  {" · "}
                  {formatDate(a.publishedAt)}
                </p>
                <p className="mt-3 flex flex-wrap gap-2">
                  {a.pinned && <Badge variant="pinned">📌 Pinned</Badge>}
                  {a.requiresAck && <Badge variant="ack">Ack required</Badge>}
                  <Badge variant={a.hasRead ? "read" : "unread"}>
                    {a.hasRead ? "✓ Read" : "Unread"}
                  </Badge>
                  {a.requiresAck && (
                    <Badge variant={a.hasAcked ? "read" : "pending"}>
                      {a.hasAcked ? "✓ Acknowledged" : "Action needed"}
                    </Badge>
                  )}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {pagination.totalPages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={pagination.page <= 1}
            onClick={() => setApplied((p) => ({ ...p, page: p.page - 1 }))}
            className="btn-secondary disabled:opacity-40"
          >
            ← Previous
          </button>
          <span className="pagination-pill">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => setApplied((p) => ({ ...p, page: p.page + 1 }))}
            className="btn-secondary disabled:opacity-40"
          >
            Next →
          </button>
        </nav>
      )}
    </section>
  )
}
