import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session || (session.user.role !== "CASHIER" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const statusParam = searchParams.get("status")
    const pageParam = searchParams.get("page")
    const page = pageParam ? Number.parseInt(pageParam, 10) : 1
    const limit = 10
    const skip = (page - 1) * limit

    const whereClause: any = {
      companyId: session.user.companyId!,
    }
    if (statusParam && statusParam !== "ALL") {
      whereClause.status = statusParam
    }

    const [invoices, totalCount] = await Promise.all([
      prisma.invoice.findMany({
        where: whereClause,
        include: {
          client: true,
          meter: true,
          issuedBy: { select: { name: true } },
          payments: { select: { amount: true } },
        },
        orderBy: { issuanceDate: "desc" },
        skip,
        take: limit,
      }),
      prisma.invoice.count({
        where: whereClause,
      }),
    ])

    const now = new Date()
    const invoicesWithStatus = invoices.map((invoice) => {
      const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0)
      const remainingAmount = Number(invoice.totalAmount) - totalPaid
      const isOverdue = invoice.status === "PENDING" && invoice.dueDate < now

      return {
        ...invoice,
        remainingAmount,
        isOverdue,
      }
    })

    const totalPages = Math.ceil(totalCount / limit)
    return NextResponse.json({
      invoices: invoicesWithStatus,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
      },
    })
  } catch (error) {
    console.error("Error fetching invoices:", error)
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 })
  }
}
