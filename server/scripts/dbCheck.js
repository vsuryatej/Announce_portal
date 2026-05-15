require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") })
const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

async function main() {
  const count = await prisma.user.count()
  console.log("OK — connected. Users in database:", count)
}

main()
  .catch((e) => {
    console.error("DATABASE ERROR:", e.message)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
