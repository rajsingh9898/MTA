/* eslint-disable no-console */
const bcrypt = require("bcryptjs")
const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

async function main() {
  const username = process.env.ADMIN_USERNAME
  const password = process.env.ADMIN_PASSWORD

  if (!username || !password) {
    console.error("Missing ADMIN_USERNAME or ADMIN_PASSWORD environment variable.")
    process.exit(1)
  }

  const passwordHash = await bcrypt.hash(password, 12)

  await prisma.adminCredential.upsert({
    where: { username },
    update: {
      passwordHash,
      isActive: true,
    },
    create: {
      username,
      passwordHash,
      isActive: true,
    },
  })

  console.log("Admin credentials stored in Supabase successfully.")
}

main()
  .catch((error) => {
    console.error("Failed to store admin credentials:", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
