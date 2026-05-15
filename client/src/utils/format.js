export function formatDate(dateStr) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleString()
}

export function formatCategory(cat) {
  return cat?.replace(/_/g, " ") ?? ""
}
