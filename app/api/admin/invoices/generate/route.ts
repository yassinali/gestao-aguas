import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Decimal } from "@prisma/client/runtime/library"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { meterReadingId } = body

    if (!meterReadingId) {
      return NextResponse.json({ error: "Missing meterReadingId" }, { status: 400 })
    }

    // Busca o reading com meter e client
    const reading = await prisma.meterReading.findUnique({
      where: { id: meterReadingId },
      include: { meter: true, client: true },
    })

    if (!reading) {
      return NextResponse.json({ error: "Meter reading not found" }, { status: 404 })
    }

    // Busca dados da empresa para calcular cobrança
    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId! },
    })

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    // Converte valores para Decimal
    const readingValue = reading.reading           // Decimal
    const previousValue = reading.previousReading // Decimal
    const baseCharge = new Decimal(company.minimumCharge)
    const unitPrice = new Decimal(company.pricePerCubicMeter)
    const minCubicMeters = new Decimal(company.minimumCubicMeters)

    // Calcula consumo e totalAmount usando Decimal
    const consumption = readingValue.minus(previousValue)
    const totalAmount = Decimal.max(consumption, minCubicMeters)
  .mul(unitPrice)
  .add(baseCharge)

    // Gera invoice
    const invoice = await prisma.invoice.create({
      data: {
        companyId: session.user.companyId!,
        clientId: reading.clientId,
        meterId: reading.meterId,
        invoiceNumber: `INV-${Date.now()}`, // você pode criar uma lógica melhor
        previousReading: previousValue,
        currentReading: readingValue,
        consumption,
        baseCharge,
        unitPrice,
        totalAmount,
        dueDate: new Date(new Date().setDate(new Date().getDate() + 15)), // 15 dias para pagamento
        issuedById: session.user.id,
      },
    })

    return NextResponse.json({ invoice })
  } catch (error) {
    console.error("Failed to generate invoice:", error)
    return NextResponse.json({ error: "Failed to generate invoice" }, { status: 500 })
  }
}
