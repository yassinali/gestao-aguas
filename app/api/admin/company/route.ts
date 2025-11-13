import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Decimal } from "@prisma/client/runtime/library"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "CASHIER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Buscar company
    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId! },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Somar receita apenas das faturas pagas
    const paidInvoices = await prisma.invoice.findMany({
      where: {
        companyId: company.id,
        status: "PAID",
      },
      select: {
        totalAmount: true,
      },
    });

    const totalPaidRevenue = paidInvoices.reduce(
      (sum, inv) => sum + Number(inv.totalAmount),
      0
    );

    return NextResponse.json({ company: { ...company, totalPaidRevenue } });
  } catch (error) {
    console.error("[v0] Error fetching company:", error);
    return NextResponse.json({ error: "Failed to fetch company" }, { status: 500 });
  }
}


export async function PUT(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session || session.user.role !== "ADMIN" && session.user.role !== "CASHIER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Validation
    if (!body.name || !body.taxId || !body.email || !body.phone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (body.acceptBankTransfer && (!body.bankName || !body.bankAccount)) {
      return NextResponse.json({ error: "Bank details required for bank transfers" }, { status: 400 })
    }

    const company = await prisma.company.update({
      where: { id: session.user.companyId! },
      data: {
        name: body.name,
        taxId: body.taxId,
        email: body.email,
        phone: body.phone,
        address: body.address,
        city: body.city,
        province: body.province,
        minimumCharge: new Decimal(body.minimumCharge),
        minimumCubicMeters: body.minimumCubicMeters,
        pricePerCubicMeter: new Decimal(body.pricePerCubicMeter),
        acceptCash: body.acceptCash,
        acceptCard: body.acceptCard,
        acceptBankTransfer: body.acceptBankTransfer,
        acceptEmola: body.acceptEmola,
        acceptMpesa: body.acceptMpesa,
        bankName: body.bankName || null,
        bankAccount: body.bankAccount || null,
        bankCode: body.bankCode || null,
      },
    })

    return NextResponse.json({ company })
  } catch (error) {
    console.error("[v0] Error updating company:", error)
    return NextResponse.json({ error: "Failed to update company" }, { status: 500 })
  }
}
