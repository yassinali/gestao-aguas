import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    // 🔐 Segurança (NÃO ALTERADA)
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get("clientId")

    if (!clientId) {
      return NextResponse.json({ error: "Missing clientId" }, { status: 400 })
    }

    // 🔹 Busca as faturas do cliente
    const invoices = await prisma.invoice.findMany({
      where: {
        contract:{
          clientId: clientId
        },
        companyId: session.user.companyId!,
      },
      include: {
      //  client: true,
        meter: true,
        issuedBy: { select: { name: true } },
        payments: { select: { amount: true } },
      },
      orderBy: { issuanceDate: "desc" },
    })

    // 🔹 Debug temporário para verificar estrutura
    console.log("Invoices fetched:", invoices.map(i => ({
      id: i.id,
      totalAmount: i.totalAmount,
      payments: i.payments,
      dueDate: i.dueDate,
    })))

    // 🔹 Cálculo seguro (sem NaN)
    const now = new Date()

    const totalEmDivida = invoices.reduce((acc: number, inv) => {
      // Garante que `totalAmount` é número
      const totalAmount = Number(inv.totalAmount) || 0

      // Garante que `payments` existe e soma corretamente
      const totalPago = Array.isArray(inv.payments)
        ? inv.payments.reduce(
            (sum: number, p) => sum + (Number(p.amount) || 0),
            0
          )
        : 0

      const restante = totalAmount - totalPago
      const due = inv.dueDate ? new Date(inv.dueDate) : null

      // Soma se estiver vencida e tiver saldo
      if (restante > 0 && due && due <= now) {
        acc += restante
      }

      return acc
    }, 0)

    // 🔹 Retorno final
    return NextResponse.json({
      invoices,
      totalEmDivida: Number(totalEmDivida.toFixed(2)),
    })
  } catch (error: unknown) {
    console.error("Error fetching client invoices:", error)
    const message =
      error instanceof Error ? error.message : "Failed to fetch invoices"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
