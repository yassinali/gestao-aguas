import { PrismaClient } from "@prisma/client"
import {  Decimal } from "@prisma/client/runtime/library"

const prisma = new PrismaClient()

async function main() {
  console.log("[v0] Starting database initialization...")

  try {
    // Create sample company
    const company = await prisma.company.create({
      data: {
        name: "Water Supply Company",
        taxId: "TAX-001",
        email: "admin@watersupply.com",
        phone: "+1234567890",
        address: "123 Main St",
        city: "City",
        province: "Province",
        minimumCharge: new Decimal(300),
        minimumCubicMeters: 5,
        pricePerCubicMeter: new Decimal(100),
        acceptCash: true,
        acceptBankTransfer: true,
        acceptCard: false,
        acceptEmola: false,
        acceptMpesa: false,
        bankName: "National Bank",
        bankAccount: "1234567890",
        bankCode: "NB001",
      },
    })

    console.log("[v0] ✓ Company created:", company.id)

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: "admin@watersupply.com",
        emailVerified: true,
        name: "Administrator",
        role: "ADMIN",
        companyId: company.id,
      },
    })

    console.log("[v0] ✓ Admin user created:", adminUser.id)

    console.log("[v0] Database initialization complete!")
  } catch (error) {
    console.error("[v0] Error initializing database:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
