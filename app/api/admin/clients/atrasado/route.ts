import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()

    // Get clients with overdue invoices
    const delinquentClients = await prisma.client.findMany({
      where: {
        companyId: session.user.companyId!,
        invoices: {
          some: {
            status: "PENDING",
            dueDate: {
              lt: now,
            },
          },
        },
      },
      include: {
        invoices: {
          where: {
            status: "PENDING",
            dueDate: {
              lt: now,
            },
          },
          include: {
            payments: {
              select: { amount: true },
            },
          },
        },
      },
    })

    // Calculate total debt for each client
    const clientsWithDebt = delinquentClients.map((client) => {
      const totalDebt = client.invoices.reduce((sum, invoice) => {
        const totalPaid = invoice.payments.reduce((paid, p) => paid + Number(p.amount), 0)
        return sum + (Number(invoice.totalAmount) - totalPaid)
      }, 0)

      return {
        ...client,
        totalDebt,
        overdueInvoices: client.invoices.length,
      }
    })

    return NextResponse.json({ clients: clientsWithDebt })
  } catch (error) {
    console.error("[v0] Error fetching delinquent clients:", error)
    return NextResponse.json({ error: "Failed to fetch delinquent clients" }, { status: 500 })
  }
}
