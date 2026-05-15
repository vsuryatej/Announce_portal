const { CATEGORIES } = require("./constants")

function isValidEmail(email) {
  if (!email || typeof email !== "string") return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

function trimRequired(value, fieldName) {
  if (value === undefined || value === null) {
    return { error: `${fieldName} is required` }
  }
  if (typeof value !== "string" || !value.trim()) {
    return { error: `${fieldName} cannot be empty or whitespace only` }
  }
  return { value: value.trim() }
}

function validateCategory(category) {
  if (!category || !CATEGORIES.includes(category)) {
    return {
      error: `Category must be one of: ${CATEGORIES.join(", ")}`,
    }
  }
  return { value: category }
}

function parseId(param) {
  const id = parseInt(param, 10)
  if (Number.isNaN(id) || id < 1) return null
  return id
}

module.exports = { isValidEmail, trimRequired, validateCategory, parseId }
