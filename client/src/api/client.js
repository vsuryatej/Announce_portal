const API_BASE = "/api"

function getToken() {
  return localStorage.getItem("token")
}

async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  }

  const token = getToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const err = new Error(data.message || "Request failed")
    err.status = res.status
    throw err
  }

  return data
}

export const api = {
  register: (email, password) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  login: (email, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  me: () => request("/auth/me"),

  getCategories: () => request("/announcements/meta/categories"),

  listAnnouncements: (params) => {
    const cleaned = Object.fromEntries(
      Object.entries(params).filter(
        ([, v]) => v !== "" && v !== null && v !== undefined && v !== false
      )
    )
    const qs = new URLSearchParams(cleaned).toString()
    return request(`/announcements?${qs}`)
  },

  getAnnouncement: (id) => request(`/announcements/${id}`),

  getDrafts: () => request("/announcements/mine/drafts"),

  createAnnouncement: (data) =>
    request("/announcements", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateAnnouncement: (id, data) =>
    request(`/announcements/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteAnnouncement: (id) =>
    request(`/announcements/${id}`, { method: "DELETE" }),

  publishAnnouncement: (id) =>
    request(`/announcements/${id}/publish`, { method: "PATCH" }),

  archiveAnnouncement: (id) =>
    request(`/announcements/${id}/archive`, { method: "PATCH" }),

  acknowledgeAnnouncement: (id) =>
    request(`/announcements/${id}/acknowledge`, { method: "POST" }),

  getAnalytics: (id) => request(`/announcements/${id}/analytics`),
}
