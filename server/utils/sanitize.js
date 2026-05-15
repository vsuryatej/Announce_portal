function sanitizeUser(user) {
  if (!user) return null
  const { password, ...safe } = user
  return safe
}

function formatAnnouncement(announcement, userId) {
  const read = announcement.reads?.[0]
  const ack = announcement.acknowledgments?.[0]
  const { reads, acknowledgments, ...rest } = announcement
  return {
    ...rest,
    author: rest.author ? sanitizeUser(rest.author) : rest.author,
    hasRead: Boolean(read),
    readAt: read?.readAt ?? null,
    hasAcked: Boolean(ack),
    acknowledgedAt: ack?.acknowledgedAt ?? null,
  }
}

module.exports = { sanitizeUser, formatAnnouncement }
