import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { api } from "../api/client"
import { Alert, PageHeader, StatCard } from "../components/ui"

export default function Analytics() {
  const { id } = useParams()
  const [stats, setStats] = useState(null)
  const [error, setError] = useState("")

  useEffect(() => {
    api
      .getAnalytics(id)
      .then(setStats)
      .catch((err) => setError(err.message))
  }, [id])

  if (error) return <Alert>{error}</Alert>
  if (!stats) {
    return (
      <p className="text-slate-500 animate-pulse">Loading engagement data…</p>
    )
  }

  const totalForAck =
    stats.acknowledgmentCount + (stats.pendingAcknowledgment?.count || 0)
  const ackRate =
    stats.requiresAck && totalForAck > 0
      ? Math.round((stats.acknowledgmentCount / totalForAck) * 100)
      : null

  return (
    <section className="animate-fade-in">
      <Link
        to={`/announcements/${id}`}
        className="mb-6 inline-flex text-sm font-medium text-indigo-600 hover:underline"
      >
        ← Back to announcement
      </Link>

      <PageHeader
        title="Engagement analytics"
        subtitle="Track who has read and acknowledged this announcement. Only visible to you as the author."
      />

      <ul className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <li>
          <StatCard
            label="Total reads"
            value={stats.readCount}
            accent="indigo"
          />
        </li>
        {stats.requiresAck && (
          <>
            <li>
              <StatCard
                label="Acknowledged"
                value={stats.acknowledgmentCount}
                accent="emerald"
              />
            </li>
            <li>
              <StatCard
                label="Still pending"
                value={stats.pendingAcknowledgment.count}
                accent="rose"
              />
            </li>
          </>
        )}
      </ul>

      {stats.requiresAck && ackRate !== null && (
        <section className="card mb-8 p-6">
          <h2 className="text-sm font-semibold text-slate-700">
            Acknowledgment progress
          </h2>
          <span className="mt-3 block h-4 overflow-hidden rounded-full bg-slate-100">
            <span
              className="block h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
              style={{ width: `${ackRate}%` }}
            />
          </span>
          <p className="mt-2 text-2xl font-bold text-slate-900">{ackRate}%</p>
          <p className="text-sm text-slate-500">
            {stats.acknowledgmentCount} of {totalForAck} employees
          </p>
        </section>
      )}

      {stats.requiresAck && (
        <section className="card p-6">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            Pending acknowledgment
            <span className="ml-2 text-base font-normal text-slate-400">
              ({stats.pendingAcknowledgment.count})
            </span>
          </h2>
          {stats.pendingAcknowledgment.users.length === 0 ? (
            <p className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
              🎉 Everyone has acknowledged this announcement.
            </p>
          ) : (
            <ul className="mt-4 max-h-72 divide-y divide-slate-100 overflow-y-auto">
              {stats.pendingAcknowledgment.users.map((u) => (
                <li
                  key={u.id}
                  className="flex items-center gap-3 py-3 text-sm"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-700">
                    {u.email[0].toUpperCase()}
                  </span>
                  {u.email}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </section>
  )
}
