import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { api } from "../api/client"
import { useAuth } from "../context/AuthContext"
import { formatCategory, formatDate } from "../utils/format"
import { Alert, Badge, LoadingCards } from "../components/ui"

export default function AnnouncementDetail() {
  const { id } = useParams()
  const { user, isAuthor } = useAuth()
  const [item, setItem] = useState(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [ackLoading, setAckLoading] = useState(false)

  const load = () => {
    setLoading(true)
    api
      .getAnnouncement(id)
      .then(setItem)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [id])

  const handleAck = async () => {
    setAckLoading(true)
    try {
      await api.acknowledgeAnnouncement(id)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setAckLoading(false)
    }
  }

  const handleArchive = async () => {
    if (!confirm("Archive this announcement? It will leave the default feed.")) return
    try {
      await api.archiveAnnouncement(id)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <LoadingCards count={1} />
  if (error && !item) return <Alert>{error}</Alert>
  if (!item) return null

  const isOwner = user?.id === item.authorId

  return (
    <article className="animate-fade-in">
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
      >
        ← Back to feed
      </Link>

      {error && (
        <p className="mb-4">
          <Alert>{error}</Alert>
        </p>
      )}

      <header className="card overflow-hidden p-0">
        {item.pinned && (
          <span className="block bg-gradient-to-r from-amber-400 to-orange-400 px-5 py-1.5 text-center text-xs font-bold uppercase tracking-wide text-white">
            Pinned announcement
          </span>
        )}
        <span className="block p-6 md:p-8">
          <span className="flex flex-wrap items-center gap-2">
            <Badge variant="category">{formatCategory(item.category)}</Badge>
            <Badge variant={item.status === "ARCHIVED" ? "archived" : "read"}>
              {item.status}
            </Badge>
          </span>
          <h1 className="font-display mt-4 text-3xl font-bold leading-tight text-heading md:text-4xl">
            {item.title}
          </h1>
          <p className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted">
            <span className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                {(item.author?.email || "?")[0].toUpperCase()}
              </span>
              {item.author?.email}
            </span>
            <span>·</span>
            <span>Published {formatDate(item.publishedAt)}</span>
          </p>
          <p className="mt-4 flex flex-wrap gap-2">
            <Badge variant={item.hasRead ? "read" : "unread"}>
              {item.hasRead ? "✓ You read this" : "Not read yet"}
            </Badge>
            {item.requiresAck && (
              <Badge variant={item.hasAcked ? "read" : "pending"}>
                {item.hasAcked
                  ? `✓ Acknowledged ${formatDate(item.acknowledgedAt)}`
                  : "⚠ Acknowledgment required"}
              </Badge>
            )}
          </p>
        </span>
      </header>

      <section className="card mt-6 p-6 md:p-8">
        <p className="whitespace-pre-wrap text-base leading-relaxed text-body">
          {item.body}
        </p>
      </section>

      {item.status === "PUBLISHED" && item.requiresAck && !item.hasAcked && (
        <aside className="card mt-6 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-6 dark:border-orange-800 dark:from-orange-950/40 dark:to-amber-950/30">
          <h2 className="font-display text-lg font-semibold text-orange-900 dark:text-orange-200">
            Action required
          </h2>
          <p className="mt-1 text-sm text-orange-800/80">
            Please confirm you have read and understood this announcement.
          </p>
          <button
            type="button"
            onClick={handleAck}
            disabled={ackLoading}
            className="btn-primary mt-4 !bg-orange-600 !shadow-orange-200 hover:!bg-orange-700"
          >
            {ackLoading ? "Submitting…" : "✓ I acknowledge this announcement"}
          </button>
        </aside>
      )}

      {isAuthor && isOwner && item.status === "PUBLISHED" && (
        <footer className="mt-6 flex flex-wrap gap-3">
          <Link
            to={`/announcements/${id}/analytics`}
            className="btn-primary"
          >
            📊 View analytics
          </Link>
          <button type="button" onClick={handleArchive} className="btn-secondary">
            Archive
          </button>
        </footer>
      )}

      {isAuthor && isOwner && item.status === "DRAFT" && (
        <footer className="mt-6">
          <Link to={`/edit/${id}`} className="btn-primary">
            Edit draft
          </Link>
        </footer>
      )}
    </article>
  )
}
