const prisma = require("../prismaClient")
const bcrypt = require("bcryptjs")

async function main() {
  const password = await bcrypt.hash("password123", 10)

  await prisma.user.upsert({
    where: { email: "author@company.com" },
    update: { role: "AUTHOR" },
    create: {
      email: "author@company.com",
      password,
      role: "AUTHOR",
    },
  })

  await prisma.user.upsert({
    where: { email: "reader@company.com" },
    update: {},
    create: {
      email: "reader@company.com",
      password,
      role: "READER",
    },
  })

  console.log("Seed complete:")
  console.log("  author@company.com / password123 (AUTHOR)")
  console.log("  reader@company.com / password123 (READER)")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
