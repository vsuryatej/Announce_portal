const express = require("express")
const prisma = require("../prismaClient")
const authMiddleware = require("../middleware/authMiddleware")
const authorMiddleware = require("../middleware/authorMiddleware")
const { CATEGORIES, DEFAULT_PAGE_SIZE } = require("../utils/constants")
const { trimRequired, validateCategory, parseId } = require("../utils/validation")
const { formatAnnouncement } = require("../utils/sanitize")

const router = express.Router()

const authorSelect = { select: { id: true, email: true } }

const userEngagementInclude = (userId) => ({
  author: authorSelect,
  reads: { where: { userId }, select: { readAt: true } },
  acknowledgments: { where: { userId }, select: { acknowledgedAt: true } },
})

function canViewAnnouncement(announcement, userId) {
  if (announcement.status === "DRAFT") {
    return announcement.authorId === userId
  }
  return true
}

function buildListWhere(req) {
  const userId = req.user.id
  const {
    status = "PUBLISHED",
    category,
    requiresAck,
    unread,
    unacknowledged,
    search,
  } = req.query

  const where = {}

  if (status === "ARCHIVED") {
    where.status = "ARCHIVED"
  } else if (status === "ALL") {
    where.status = { in: ["PUBLISHED", "ARCHIVED"] }
  } else {
    where.status = "PUBLISHED"
  }

  if (category) {
    if (!CATEGORIES.includes(category)) {
      return { error: `Invalid category. Use one of: ${CATEGORIES.join(", ")}` }
    }
    where.category = category
  }

  if (requiresAck === "true") where.requiresAck = true
  if (requiresAck === "false") where.requiresAck = false

  if (unread === "true") {
    where.reads = { none: { userId } }
  }

  if (unacknowledged === "true") {
    where.requiresAck = true
    where.acknowledgments = { none: { userId } }
  }

  return { where }
}

function buildOrderBy(req) {
  const sortBy = req.query.sortBy === "title" ? "title" : "publishedAt"
  const sortOrder = req.query.sortOrder === "asc" ? "asc" : "desc"

  return [{ pinned: "desc" }, { [sortBy]: sortOrder }]
}

/** Case-insensitive title substring search (AC15). Respects list status filter. */
async function findIdsByTitleSearch(search, statusParam = "PUBLISHED") {
  const term = `%${search.toLowerCase()}%`

  if (statusParam === "ARCHIVED") {
    return prisma.$queryRaw`
      SELECT id FROM Announcement
      WHERE LOWER(title) LIKE ${term} AND status = 'ARCHIVED'
    `
  }
  if (statusParam === "ALL") {
    return prisma.$queryRaw`
      SELECT id FROM Announcement
      WHERE LOWER(title) LIKE ${term}
      AND status IN ('PUBLISHED', 'ARCHIVED')
    `
  }
  return prisma.$queryRaw`
    SELECT id FROM Announcement
    WHERE LOWER(title) LIKE ${term} AND status = 'PUBLISHED'
  `
}

router.get("/meta/categories", authMiddleware, (req, res) => {
  res.json({ categories: CATEGORIES })
})

router.get("/mine/drafts", authMiddleware, authorMiddleware, async (req, res) => {
  try {
    const drafts = await prisma.announcement.findMany({
      where: { authorId: req.user.id, status: "DRAFT" },
      include: userEngagementInclude(req.user.id),
      orderBy: { updatedAt: "desc" },
    })
    res.json(drafts.map((a) => formatAnnouncement(a, req.user.id)))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

router.get("/", authMiddleware, async (req, res) => {
  try {
    const built = buildListWhere(req)
    if (built.error) {
      return res.status(400).json({ message: built.error })
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(req.query.pageSize, 10) || DEFAULT_PAGE_SIZE)
    )
    const skip = (page - 1) * pageSize

    const where = { ...built.where }
    const orderBy = buildOrderBy(req)

    const search = req.query.search?.trim()
    if (search) {
      const matches = await findIdsByTitleSearch(search, req.query.status || "PUBLISHED")
      const ids = matches.map((r) => r.id)
      where.id = { in: ids.length ? ids : [-1] }
    }

    const [total, announcements] = await Promise.all([
      prisma.announcement.count({ where }),
      prisma.announcement.findMany({
        where,
        include: userEngagementInclude(req.user.id),
        orderBy,
        skip,
        take: pageSize,
      }),
    ])

    res.json({
      data: announcements.map((a) => formatAnnouncement(a, req.user.id)),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

router.post("/", authMiddleware, authorMiddleware, async (req, res) => {
  try {
    const titleResult = trimRequired(req.body.title, "Title")
    if (titleResult.error) {
      return res.status(400).json({ message: titleResult.error })
    }

    const bodyResult = trimRequired(req.body.body, "Body")
    if (bodyResult.error) {
      return res.status(400).json({ message: bodyResult.error })
    }

    const categoryResult = validateCategory(req.body.category)
    if (categoryResult.error) {
      return res.status(400).json({ message: categoryResult.error })
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: titleResult.value,
        body: bodyResult.value,
        category: categoryResult.value,
        pinned: Boolean(req.body.pinned),
        requiresAck: Boolean(req.body.requiresAck),
        authorId: req.user.id,
        status: "DRAFT",
      },
      include: { author: authorSelect },
    })

    res.status(201).json(formatAnnouncement(announcement, req.user.id))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

router.get("/:id/analytics", authMiddleware, async (req, res) => {
  try {
    const id = parseId(req.params.id)
    if (!id) return res.status(400).json({ message: "Invalid announcement id" })

    const announcement = await prisma.announcement.findUnique({ where: { id } })

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" })
    }

    if (announcement.authorId !== req.user.id) {
      return res.status(403).json({
        message: "Analytics are only available to the announcement author",
      })
    }

    if (announcement.status === "DRAFT") {
      return res.status(400).json({
        message: "Analytics are available after the announcement is published",
      })
    }

    const [readCount, ackCount, totalUsers, ackUsers] = await Promise.all([
      prisma.read.count({ where: { announcementId: id } }),
      prisma.acknowledgment.count({ where: { announcementId: id } }),
      prisma.user.count(),
      announcement.requiresAck
        ? prisma.acknowledgment.findMany({
            where: { announcementId: id },
            include: { user: { select: { id: true, email: true } } },
          })
        : Promise.resolve([]),
    ])

    let pendingAcknowledgment = { count: 0, users: [] }

    if (announcement.requiresAck) {
      const ackedUserIds = new Set(ackUsers.map((a) => a.userId))
      const pendingUsers = await prisma.user.findMany({
        where: { id: { notIn: [...ackedUserIds] } },
        select: { id: true, email: true },
      })
      pendingAcknowledgment = {
        count: pendingUsers.length,
        users: pendingUsers,
      }
    }

    res.json({
      readCount,
      acknowledgmentCount: ackCount,
      requiresAck: announcement.requiresAck,
      pendingAcknowledgment,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

router.post("/:id/acknowledge", authMiddleware, async (req, res) => {
  try {
    const id = parseId(req.params.id)
    if (!id) return res.status(400).json({ message: "Invalid announcement id" })

    const announcement = await prisma.announcement.findUnique({ where: { id } })

    if (!announcement || announcement.status !== "PUBLISHED") {
      return res.status(404).json({ message: "Announcement not found" })
    }

    if (!announcement.requiresAck) {
      return res.status(400).json({
        message: "This announcement does not require acknowledgment",
      })
    }

    const existing = await prisma.acknowledgment.findUnique({
      where: {
        userId_announcementId: {
          userId: req.user.id,
          announcementId: id,
        },
      },
    })

    if (existing) {
      return res.json({
        message: "Already acknowledged",
        acknowledgedAt: existing.acknowledgedAt,
      })
    }

    await prisma.read.upsert({
      where: {
        userId_announcementId: { userId: req.user.id, announcementId: id },
      },
      create: { userId: req.user.id, announcementId: id },
      update: {},
    })

    const ack = await prisma.acknowledgment.create({
      data: { userId: req.user.id, announcementId: id },
    })

    res.status(201).json({
      message: "Acknowledged",
      acknowledgedAt: ack.acknowledgedAt,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

router.patch("/:id/publish", authMiddleware, authorMiddleware, async (req, res) => {
  try {
    const id = parseId(req.params.id)
    if (!id) return res.status(400).json({ message: "Invalid announcement id" })

    const announcement = await prisma.announcement.findUnique({ where: { id } })

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" })
    }

    if (announcement.authorId !== req.user.id) {
      return res.status(403).json({ message: "Access denied" })
    }

    if (announcement.status !== "DRAFT") {
      return res.status(400).json({
        message: "Only draft announcements can be published",
      })
    }

    const updated = await prisma.announcement.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
      include: userEngagementInclude(req.user.id),
    })

    res.json(formatAnnouncement(updated, req.user.id))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

router.patch("/:id/archive", authMiddleware, authorMiddleware, async (req, res) => {
  try {
    const id = parseId(req.params.id)
    if (!id) return res.status(400).json({ message: "Invalid announcement id" })

    const announcement = await prisma.announcement.findUnique({ where: { id } })

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" })
    }

    if (announcement.authorId !== req.user.id) {
      return res.status(403).json({ message: "Access denied" })
    }

    if (announcement.status !== "PUBLISHED") {
      return res.status(400).json({
        message: "Only published announcements can be archived",
      })
    }

    const updated = await prisma.announcement.update({
      where: { id },
      data: { status: "ARCHIVED" },
      include: userEngagementInclude(req.user.id),
    })

    res.json(formatAnnouncement(updated, req.user.id))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const id = parseId(req.params.id)
    if (!id) return res.status(400).json({ message: "Invalid announcement id" })

    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: userEngagementInclude(req.user.id),
    })

    if (!announcement || !canViewAnnouncement(announcement, req.user.id)) {
      return res.status(404).json({ message: "Announcement not found" })
    }

    if (announcement.status === "PUBLISHED") {
      await prisma.read.upsert({
        where: {
          userId_announcementId: {
            userId: req.user.id,
            announcementId: id,
          },
        },
        create: { userId: req.user.id, announcementId: id },
        update: {},
      })
    }

    const refreshed = await prisma.announcement.findUnique({
      where: { id },
      include: userEngagementInclude(req.user.id),
    })

    res.json(formatAnnouncement(refreshed, req.user.id))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

router.put("/:id", authMiddleware, authorMiddleware, async (req, res) => {
  try {
    const id = parseId(req.params.id)
    if (!id) return res.status(400).json({ message: "Invalid announcement id" })

    const announcement = await prisma.announcement.findUnique({ where: { id } })

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" })
    }

    if (announcement.authorId !== req.user.id) {
      return res.status(403).json({ message: "Access denied" })
    }

    if (announcement.status !== "DRAFT") {
      return res.status(400).json({
        message:
          "Published or archived announcements cannot be edited. Archive and create a new one instead.",
      })
    }

    const titleResult = trimRequired(req.body.title, "Title")
    if (titleResult.error) {
      return res.status(400).json({ message: titleResult.error })
    }

    const bodyResult = trimRequired(req.body.body, "Body")
    if (bodyResult.error) {
      return res.status(400).json({ message: bodyResult.error })
    }

    const categoryResult = validateCategory(req.body.category)
    if (categoryResult.error) {
      return res.status(400).json({ message: categoryResult.error })
    }

    const updated = await prisma.announcement.update({
      where: { id },
      data: {
        title: titleResult.value,
        body: bodyResult.value,
        category: categoryResult.value,
        pinned: Boolean(req.body.pinned),
        requiresAck: Boolean(req.body.requiresAck),
      },
      include: userEngagementInclude(req.user.id),
    })

    res.json(formatAnnouncement(updated, req.user.id))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

router.delete("/:id", authMiddleware, authorMiddleware, async (req, res) => {
  try {
    const id = parseId(req.params.id)
    if (!id) return res.status(400).json({ message: "Invalid announcement id" })

    const announcement = await prisma.announcement.findUnique({ where: { id } })

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" })
    }

    if (announcement.authorId !== req.user.id) {
      return res.status(403).json({ message: "Access denied" })
    }

    if (announcement.status !== "DRAFT") {
      return res.status(400).json({
        message: "Only draft announcements can be deleted",
      })
    }

    await prisma.announcement.delete({ where: { id } })
    res.json({ message: "Draft deleted" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
