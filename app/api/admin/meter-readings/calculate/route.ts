import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

      if (!session || (session.user.role !== "CASHIER" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!session.user.companyId) {
      return NextResponse.json({ error: "Company not assigned" }, { status: 400 })
    }

    const body = await request.json()
    const { consumption } = body

    // Get company pricing configuration
    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      select: {
        minimumCharge: true,
        minimumCubicMeters: true,
        pricePerCubicMeter: true,
      },
    })

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    // Calculate charge
    let totalAmount = Number(company.minimumCharge)
    const baseCharge = Number(company.minimumCharge)

    if (consumption > Number(company.minimumCubicMeters)) {
      const excessConsumption = consumption - Number(company.minimumCubicMeters)
      const excessCharge = excessConsumption * Number(company.pricePerCubicMeter)
      totalAmount = Number(company.minimumCharge) + excessCharge
    }

    return NextResponse.json({
      consumption,
      baseCharge,
      totalAmount,
    })
  } catch (error) {
    console.error("[v0] Error calculating values:", error)
    return NextResponse.json({ error: "Failed to calculate values" }, { status: 500 })
  }
}
