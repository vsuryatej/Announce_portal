const BADGE_STYLES = {
  pinned:
    "bg-amber-50 text-amber-800 ring-1 ring-amber-200/60 dark:bg-amber-950/50 dark:text-amber-200 dark:ring-amber-800/60",
  ack: "bg-orange-50 text-orange-800 ring-1 ring-orange-200/60 dark:bg-orange-950/50 dark:text-orange-200 dark:ring-orange-800/60",
  read: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/60 dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-800/60",
  unread:
    "bg-slate-100 text-slate-600 ring-1 ring-slate-200/60 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-600/60",
  pending:
    "bg-rose-50 text-rose-800 ring-1 ring-rose-200/60 dark:bg-rose-950/50 dark:text-rose-200 dark:ring-rose-800/60",
  category:
    "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/60 dark:bg-indigo-950/50 dark:text-indigo-200 dark:ring-indigo-800/60",
  draft:
    "bg-violet-50 text-violet-700 ring-1 ring-violet-200/60 dark:bg-violet-950/50 dark:text-violet-200 dark:ring-violet-800/60",
  archived:
    "bg-slate-100 text-slate-500 ring-1 ring-slate-200/60 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-600/60",
}

export function Badge({ children, variant = "category" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE_STYLES[variant] || BADGE_STYLES.category}`}
    >
      {children}
    </span>
  )
}

export function Alert({ children, type = "error" }) {
  const styles =
    type === "error"
      ? "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200"
      : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
  return (
    <p className={`rounded-xl border px-4 py-3 text-sm ${styles}`} role="alert">
      {children}
    </p>
  )
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4 animate-fade-in">
      <span className="block">
        <h1 className="font-display text-3xl font-bold tracking-tight text-heading">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 max-w-xl text-sm text-muted">{subtitle}</p>
        )}
      </span>
      {action}
    </header>
  )
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <section className="card flex flex-col items-center px-8 py-16 text-center animate-fade-in">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl dark:bg-indigo-950/60">
        {icon}
      </span>
      <h2 className="font-display text-xl font-semibold text-heading">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-muted">{description}</p>
      {action && <p className="mt-6">{action}</p>}
    </section>
  )
}

export function LoadingCards({ count = 4 }) {
  return (
    <ul className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="card p-5">
          <span className="skeleton mb-3 block h-5 w-2/3" />
          <span className="skeleton mb-2 block h-4 w-1/3" />
          <span className="skeleton block h-4 w-1/4" />
        </li>
      ))}
    </ul>
  )
}

export function StatCard({ label, value, hint, accent = "indigo" }) {
  const accents = {
    indigo: "from-indigo-500 to-violet-600",
    amber: "from-amber-500 to-orange-500",
    rose: "from-rose-500 to-pink-600",
    emerald: "from-emerald-500 to-teal-600",
  }
  return (
    <article className="card overflow-hidden p-0 animate-fade-in">
      <span className={`block bg-gradient-to-br ${accents[accent]} px-5 py-1`} />
      <span className="block px-5 py-4">
        <p className="text-3xl font-bold tabular-nums text-heading">{value}</p>
        <p className="mt-0.5 text-sm font-medium text-body">{label}</p>
        {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
      </span>
    </article>
  )
}
