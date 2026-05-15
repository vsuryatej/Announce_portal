import { useTheme } from "../context/ThemeContext"

export default function ThemeToggle({ className = "" }) {
  const { isDark, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`btn-secondary !px-3 !py-2 ${className}`}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? "☀️ Light" : "🌙 Dark"}
    </button>
  )
}
