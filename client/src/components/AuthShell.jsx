import { Link } from "react-router-dom"
import ThemeToggle from "./ThemeToggle"

export default function AuthShell({ title, subtitle, children }) {
  return (
    <span className="app-shell flex min-h-screen">
      <span className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-indigo-700 via-violet-700 to-purple-800 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <span className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 text-lg font-bold text-white backdrop-blur">
            AP
          </span>
          <span className="font-display text-xl font-bold text-white">
            Announce Portal
          </span>
        </span>
        <blockquote className="max-w-md">
          <p className="font-display text-3xl font-semibold leading-snug text-white">
            One place for every company announcement.
          </p>
          <p className="mt-4 text-indigo-100/90">
            Read, acknowledge, and track what matters — so important messages
            never get lost in email or chat.
          </p>
        </blockquote>
        <p className="text-sm text-indigo-200/70">
          Secure · Role-based · Acknowledgment tracking
        </p>
        <span className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <span className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-purple-400/20 blur-3xl" />
      </span>

      <span className="relative flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <span className="absolute right-6 top-6">
          <ThemeToggle />
        </span>
        <span className="mx-auto w-full max-w-md animate-fade-in">
          <h1 className="font-display text-3xl font-bold text-heading lg:hidden">
            Announce Portal
          </h1>
          <h2 className="mt-8 font-display text-2xl font-bold text-heading">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-2 text-sm text-muted">{subtitle}</p>
          )}
          <span className="mt-8 block">{children}</span>
        </span>
      </span>
    </span>
  )
}

export function DemoAccounts() {
  return (
    <aside className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-4 text-xs text-muted dark:border-slate-600 dark:bg-slate-800/50">
      <p className="font-semibold text-body">Demo accounts</p>
      <ul className="mt-2 space-y-1 font-mono">
        <li>author@company.com · password123</li>
        <li>reader@company.com · password123</li>
      </ul>
    </aside>
  )
}
