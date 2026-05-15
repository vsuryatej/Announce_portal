module.exports = (req, res, next) => {
  if (req.user.role !== "AUTHOR") {
    return res.status(403).json({
      message: "Only authors can perform this action",
    })
  }
  next()
}
