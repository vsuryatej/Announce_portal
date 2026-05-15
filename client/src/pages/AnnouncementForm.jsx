import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { api } from "../api/client"
import { Alert, PageHeader } from "../components/ui"

export default function AnnouncementForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [categories, setCategories] = useState([])
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [category, setCategory] = useState("COMPANY")
  const [pinned, setPinned] = useState(false)
  const [requiresAck, setRequiresAck] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.getCategories().then((r) => {
      setCategories(r.categories)
      if (r.categories.length) setCategory(r.categories[0])
    })
  }, [])

  useEffect(() => {
    if (!isEdit) return
    api
      .getAnnouncement(id)
      .then((a) => {
        if (a.status !== "DRAFT") {
          setError("Only drafts can be edited")
          return
        }
        setTitle(a.title)
        setBody(a.body)
        setCategory(a.category)
        setPinned(a.pinned)
        setRequiresAck(a.requiresAck)
      })
      .catch((err) => setError(err.message))
  }, [id, isEdit])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    const payload = { title, body, category, pinned, requiresAck }
    try {
      if (isEdit) {
        await api.updateAnnouncement(id, payload)
        navigate(`/announcements/${id}`)
      } else {
        const created = await api.createAnnouncement(payload)
        navigate(`/edit/${created.id}`)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async () => {
    try {
      await api.publishAnnouncement(id)
      navigate(`/announcements/${id}`)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section className="max-w-2xl animate-fade-in">
      <PageHeader
        title={isEdit ? "Edit draft" : "Compose announcement"}
        subtitle="Drafts are only visible to you until published. Published posts cannot be edited."
      />

      <form onSubmit={handleSubmit} className="card space-y-5 p-6 md:p-8">
        {error && <Alert>{error}</Alert>}

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Title *</span>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
            placeholder="Clear, scannable headline"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Body *</span>
          <textarea
            required
            rows={10}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="input resize-y"
            placeholder="Write your announcement…"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
          <legend className="px-1 text-sm font-medium text-slate-700">
            Options
          </legend>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded text-indigo-600"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
            />
            <span>
              <span className="block text-sm font-medium text-slate-800">
                Pin to top
              </span>
              <span className="text-xs text-slate-500">
                Pinned posts appear above others in the feed
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded text-indigo-600"
              checked={requiresAck}
              onChange={(e) => setRequiresAck(e.target.checked)}
            />
            <span>
              <span className="block text-sm font-medium text-slate-800">
                Require acknowledgment
              </span>
              <span className="text-xs text-slate-500">
                Readers must explicitly confirm they have read this
              </span>
            </span>
          </label>
        </fieldset>

        <p className="flex flex-wrap gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Saving…" : isEdit ? "Save draft" : "Create draft"}
          </button>
          {isEdit && (
            <button type="button" onClick={handlePublish} className="btn-secondary">
              Publish now →
            </button>
          )}
        </p>
      </form>
    </section>
  )
}
