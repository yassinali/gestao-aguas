import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session || session.user.role !== "ADMIN")  {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const invoices = await prisma.invoice.findMany({
      where: {
        client: {
          createdById: session.user.id,
        },
      },
      select: {
        id: true,
        invoiceNumber: true,
        currentReading: true,
        consumption: true,
        totalAmount: true,
        status: true,
        issuanceDate: true,
        dueDate: true,
      },
      orderBy: {
        issuanceDate: "desc",
      },
    })

    return NextResponse.json({ invoices })
  } catch (error) {
    console.error("[v0] Error fetching invoices:", error)
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 })
  }
}
