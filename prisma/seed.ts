import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  const email = "admin@zenflow.local"
  const password = "Admin1234!"

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log(`User already exists: ${email}`)
    return
  }

  const hash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: {
      name: "Admin User",
      email,
      password_hash: hash,
      role: "SUPER_ADMIN",
    },
  })

  console.log(`✓ Created admin user`)
  console.log(`  Email:    ${email}`)
  console.log(`  Password: ${password}`)
  console.log(`  ID:       ${user.id}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
