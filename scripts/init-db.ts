import { PrismaClient } from "@prisma/client"
import {  Decimal } from "@prisma/client/runtime/library"

const prisma = new PrismaClient()

async function main() {
  console.log("Starting database initialization...")

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

  } catch (error) {
    console.error("Error initializing database:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
