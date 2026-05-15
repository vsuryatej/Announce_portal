const path = require("path")

require("dotenv").config({ path: path.join(__dirname, ".env") })

const express = require("express")
const cors = require("cors")
const prisma = require("./prismaClient")

const authRoutes = require("./routes/authRoutes")
const announcementRoutes = require("./routes/announcementRoutes")
const authMiddleware = require("./middleware/authMiddleware")

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

app.get("/api/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ status: "ok", database: "connected" })
  } catch (err) {
    res.status(503).json({
      status: "error",
      database: "disconnected",
      message: err.message,
    })
  }
})

app.use("/api/auth", authRoutes)
app.use("/api/announcements", announcementRoutes)

app.use("/api", authMiddleware, (req, res) => {
  res.status(404).json({ message: "Not found" })
})

async function start() {
  try {
    await prisma.$connect()
    const users = await prisma.user.count()
    console.log(`Database connected (${users} users)`)
  } catch (err) {
    console.error("\n*** DATABASE NOT READY ***")
    console.error(err.message)
    console.error("\nRun from the server folder:")
    console.error("  cd server")
    console.error("  npx prisma migrate dev")
    console.error("  npm run db:seed")
    console.error("  npm run dev\n")
    process.exit(1)
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

start()
