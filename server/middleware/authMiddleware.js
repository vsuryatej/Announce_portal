const jwt = require("jsonwebtoken")

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production"

function extractToken(header) {
  if (!header) return null
  if (header.startsWith("Bearer ")) return header.slice(7)
  return header
}

module.exports = (req, res, next) => {
  const token = extractToken(req.headers.authorization)

  if (!token) {
    return res.status(401).json({ message: "Unauthorized — please sign in" })
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ message: "Invalid or expired session — please sign in again" })
  }
}

module.exports.JWT_SECRET = JWT_SECRET
