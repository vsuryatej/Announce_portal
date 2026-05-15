const express = require("express")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const prisma = require("../prismaClient")
const authMiddleware = require("../middleware/authMiddleware")
const { JWT_SECRET } = require("../middleware/authMiddleware")
const { sanitizeUser } = require("../utils/sanitize")
const { isValidEmail, trimRequired } = require("../utils/validation")

const router = express.Router()

router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: "Please enter a valid email address",
      })
    }

    const passwordCheck = trimRequired(password, "Password")
    if (passwordCheck.error) {
      return res.status(400).json({ message: passwordCheck.error })
    }

    if (passwordCheck.value.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      })
    }

    const normalizedEmail = email.trim().toLowerCase()

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existing) {
      return res.status(400).json({
        message: "An account with this email already exists",
      })
    }

    const hashed = await bcrypt.hash(passwordCheck.value, 10)

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashed,
      },
    })

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    )

    res.status(201).json({
      token,
      user: sanitizeUser(user),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Registration failed — please try again" })
  }
})

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      })
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    })

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" })
    }

    const valid = await bcrypt.compare(password, user.password)

    if (!valid) {
      return res.status(400).json({ message: "Invalid email or password" })
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    )

    res.json({
      token,
      user: sanitizeUser(user),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Sign in failed — please try again" })
  }
})

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    })

    if (!user) {
      return res.status(401).json({ message: "User not found" })
    }

    res.json({ user: sanitizeUser(user) })
  } catch {
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
