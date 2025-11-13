import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { Decimal } from "@prisma/client/runtime/library"

const VALID_PAYMENT_METHODS = ["CASH", "CARD", "BANK_TRANSFER", "EMOLA", "MPESA"]

function generateReceiptNumber(): string {
  const date = new Date()
  const timestamp = date.getTime().toString().substring(4)
  const random = Math.random().toString(36).substring(2, 7).toUpperCase()
  return `RCP-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}-${random}${timestamp}`
}

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session || (session.user.role !== "CASHIER" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const invoiceId = searchParams.get("invoiceId")

    const where = {
      companyId: session.user.companyId!,
      ...(invoiceId && { invoiceId }),
    }

    const payments = await prisma.payment.findMany({
      where,
      select: {
        id: true,
        receiptNumber: true,
        amount: true,
        paymentMethod: true,
        paymentReference: true,
        paymentDate: true,
        invoice: {
          select: { invoiceNumber: true },
        },
        client:true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ payments })
  } catch (error) {
    console.error("Error fetching payments:", error)
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session || (session.user.role !== "CASHIER" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Validation
    if (!body.invoiceId || !body.amount || !body.paymentMethod) {
      return NextResponse.json({ error: "invoiceId, amount, and paymentMethod are required" }, { status: 400 })
    }

    if (!VALID_PAYMENT_METHODS.includes(body.paymentMethod)) {
      return NextResponse.json(
        { error: `Invalid paymentMethod. Valid methods: ${VALID_PAYMENT_METHODS.join(", ")}` },
        { status: 400 },
      )
    }

    const amount = new Decimal(body.amount)
    if (amount.lte(0)) {
      return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 })
    }

    // Get invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id: body.invoiceId },
      include: { client: true },
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Verify ownership
    if (invoice.companyId !== session.user.companyId) {
      return NextResponse.json({ error: "Unauthorized - invoice not in your company" }, { status: 403 })
    }

    // Check if invoice is already paid
    if (invoice.status === "PAID") {
      return NextResponse.json({ error: "Invoice is already paid" }, { status: 400 })
    }

    // Calculate total paid
    const totalPaid = await prisma.payment.aggregate({
      where: { invoiceId: body.invoiceId },
      _sum: { amount: true },
    })

    const alreadyPaid = totalPaid._sum.amount || new Decimal(0)
    const remainingAmount = invoice.totalAmount.minus(alreadyPaid)

    // Prevent overpayment
    if (amount.gt(remainingAmount)) {
      return NextResponse.json(
        {
          error: `Payment exceeds remaining amount. Remaining: ${remainingAmount}MT, attempted: ${amount}MT`,
        },
        { status: 400 },
      )
    }

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        companyId: session.user.companyId!,
        invoiceId: body.invoiceId,
        clientId: invoice.clientId,
        amount,
        paymentMethod: body.paymentMethod,
        paymentReference: body.paymentReference || null,
        receiptNumber: generateReceiptNumber(),
        recordedById: session.user.id,
        notes: body.notes || null,
      },
    })

    // Update invoice status if fully paid
    const newTotalPaid = alreadyPaid.plus(amount)

    if (newTotalPaid.gte(invoice.totalAmount)) {
      await prisma.invoice.update({
        where: { id: body.invoiceId },
        data: { status: "PAID" },
      })
      console.log(`Invoice ${invoice.invoiceNumber} marked as PAID`)
    } else if (invoice.status === "OVERDUE") {
      // Keep OVERDUE status if still unpaid after due date
      // Status will be updated by a separate job if needed
    }

     await prisma.log.create({
    data: {
      companyId: session.user.companyId,
      userId: session.user.id,
      action: "CREATE_PAYMENT",
      entity: "Client",
      entityId: invoice.clientId,
      description: `Cliente "${invoice.client.name}" Pagamento efectuado com sucesso para factura ${body.invoiceNumber}.`,
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    },
  })

    //console.log(`Payment recorded: ${payment.receiptNumber} for invoice ${invoice.invoiceNumber}`)

    return NextResponse.json({ payment }, { status: 201 })
  } catch (error) {
    console.error("Error creating payment:", error)
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 })
  }
}
