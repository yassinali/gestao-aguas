import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Decimal } from "@prisma/client/runtime/library"
import { NextResponse } from "next/server"

function generateInvoiceNumber(companyId: string, count: number): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  return `INV-${companyId.substring(0, 4)}-${year}${month}-${String(count + 1).padStart(5, "0")}`
}

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
      },
      select: {
        id: true,
        invoiceNumber: true,
        consumption: true,
        totalAmount: true,
        status: true,
        issuanceDate: true,
        dueDate: true,
        client: {
          select: { name: true, phone: true },
        },
      },
      orderBy: {
        issuanceDate: "desc",
      },
    })

    const formattedInvoices = invoices.map((i) => ({
      ...i,
      clientName: i.client.name,
      clientPhone: i.client.phone,
      client: undefined,
    }))

    return NextResponse.json({ invoices: formattedInvoices })
  } catch (error) {
    console.error("[v0] Error fetching invoices:", error)
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 })
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
    if (!body.readingId) {
      return NextResponse.json({ error: "readingId is required" }, { status: 400 })
    }

    // Get company pricing
    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId! },
      select: {
        minimumCharge: true,
        minimumCubicMeters: true,
        pricePerCubicMeter: true,
      },
    })

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    // Get the meter reading
    const reading = await prisma.meterReading.findUnique({
      where: { id: body.readingId },
      include: {
        meter: {
          include: { client: true },
        },
      },
    })

    if (!reading) {
      return NextResponse.json({ error: "Reading not found" }, { status: 404 })
    }

    // Verify ownership
    if (reading.companyId !== session.user.companyId) {
      return NextResponse.json({ error: "Unauthorized - reading not in your company" }, { status: 403 })
    }

    // Check if invoice already exists for this reading
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        meterId: body.readingId,
      },
    })

    if (existingInvoice) {
      return NextResponse.json({ error: "Invoice already exists for this reading" }, { status: 400 })
    }

    // Calculate charges
    const consumption = reading.consumption
    let totalAmount: Decimal

    if (consumption.lte(company.minimumCubicMeters)) {
      totalAmount = company.minimumCharge
    } else {
      totalAmount = company.minimumCharge.plus(
        consumption.minus(company.minimumCubicMeters).times(company.pricePerCubicMeter),
      )
    }

    // Generate invoice number
    const invoiceCount = await prisma.invoice.count({
      where: { companyId: session.user.companyId! },
    })
    const invoiceNumber = generateInvoiceNumber(session.user.companyId!, invoiceCount)

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        companyId: session.user.companyId!,
        invoiceNumber,
        clientId: reading.meter.clientId,
        meterId: reading.meterId,
       // meterReadingId: reading.id,
        previousReading: reading.previousReading,
        currentReading: reading.reading,
        consumption: reading.consumption,
        baseCharge: company.minimumCharge,
        unitPrice: company.pricePerCubicMeter,
        totalAmount,
        issuedById: session.user.id,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    })

    console.log(`[v0] Invoice created: ${invoiceNumber} for client ${reading.meter.clientId}`)

    return NextResponse.json({ invoice }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating invoice:", error)
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 })
  }
}
