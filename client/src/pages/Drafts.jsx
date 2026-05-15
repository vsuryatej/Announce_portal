import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { api } from "../api/client"
import { formatCategory, formatDate } from "../utils/format"
import { Badge, EmptyState, LoadingCards, PageHeader } from "../components/ui"

export default function Drafts() {
  const [drafts, setDrafts] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    api
      .getDrafts()
      .then(setDrafts)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleDelete = async (id) => {
    if (!confirm("Delete this draft permanently?")) return
    await api.deleteAnnouncement(id)
    load()
  }

  const handlePublish = async (id) => {
    if (!confirm("Publish this announcement to all employees?")) return
    await api.publishAnnouncement(id)
    load()
  }

  return (
    <section>
      <PageHeader
        title="My drafts"
        subtitle="Only you can see these until you publish."
        action={
          <Link to="/new" className="btn-primary">
            + New draft
          </Link>
        }
      />

      {loading ? (
        <LoadingCards count={2} />
      ) : drafts.length === 0 ? (
        <EmptyState
          icon="✏️"
          title="No drafts yet"
          description="Start writing an announcement and save it as a draft before publishing."
          action={
            <Link to="/new" className="btn-primary">
              Create announcement
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {drafts.map((d) => (
            <li key={d.id} className="card card-hover flex flex-wrap items-center justify-between gap-4 p-5">
              <span className="block min-w-0 flex-1">
                <Link
                  to={`/edit/${d.id}`}
                  className="font-semibold text-indigo-700 hover:underline"
                >
                  {d.title}
                </Link>
                <p className="mt-1 flex flex-wrap gap-2 text-sm text-slate-500">
                  <Badge variant="draft">Draft</Badge>
                  <Badge variant="category">{formatCategory(d.category)}</Badge>
                  <span>Updated {formatDate(d.updatedAt)}</span>
                </p>
              </span>
              <span className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => handlePublish(d.id)}
                  className="btn-primary !py-2"
                >
                  Publish
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(d.id)}
                  className="btn-danger !py-2"
                >
                  Delete
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
