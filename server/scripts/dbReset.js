const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

const serverDir = path.join(__dirname, "..")
const dbPath = path.join(serverDir, "prisma", "dev.db")

process.chdir(serverDir)

if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath)
  console.log("Removed old database")
}

console.log("Running migrations…")
execSync("npx prisma migrate deploy", { stdio: "inherit" })

console.log("Seeding…")
execSync("node prisma/seed.js", { stdio: "inherit" })

console.log("Database reset complete.")
