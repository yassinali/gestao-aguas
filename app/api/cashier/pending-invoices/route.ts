import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session || (session.user.role !== "CASHIER" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const invoices = await prisma.invoice.findMany({
      where: {
        companyId: session.user.companyId,
        status: "PENDING",
      },
      select: {
        id: true,
        invoiceNumber: true,
        totalAmount: true,
        client: {
          select: { name: true },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
    })

    const formattedInvoices = invoices.map((i) => ({
      ...i,
      clientName: i.client.name,
      client: undefined,
    }))

    return NextResponse.json({ invoices: formattedInvoices })
  } catch (error) {
    console.error("[v0] Error fetching pending invoices:", error)
    return NextResponse.json({ error: "Failed to fetch pending invoices" }, { status: 500 })
  }
}
