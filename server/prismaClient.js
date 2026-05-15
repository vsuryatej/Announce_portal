const path = require("path")

// Always load .env from the server folder (works even when started from project root)
require("dotenv").config({ path: path.join(__dirname, ".env") })

// Resolve SQLite path to server/prisma/dev.db so cwd does not matter
const url = process.env.DATABASE_URL || "file:./dev.db"
if (url.startsWith("file:")) {
  const filePath = url.replace(/^file:/, "")
  if (!path.isAbsolute(filePath)) {
    const dbFile = path.basename(filePath)
    process.env.DATABASE_URL = `file:${path.join(__dirname, "prisma", dbFile)}`
  }
}

const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

module.exports = prisma
