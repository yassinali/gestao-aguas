import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (
      !session ||
      (session.user.role !== "CASHIER" && session.user.role !== "ADMIN")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { meterId, reading, previousReading, notes } = body;

    console.log("Received data:", body);

    if (
      !meterId ||
      reading === undefined ||
      previousReading === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const readingDecimal = new Decimal(reading);
    const previousDecimal = new Decimal(previousReading);
    const consumption = readingDecimal.minus(previousDecimal);

    if (consumption.lt(0)) {
      return NextResponse.json(
        { error: "Reading cannot be less than previous reading" },
        { status: 400 }
      );
    }

    const meter = await prisma.meter.findUnique({
      where: { id: meterId },
      select: {
        contractId: true,
        companyId: true,
      },
    });

    if (!meter) {
      return NextResponse.json({ error: "Meter not found" }, { status: 404 });
    }

    if (meter.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: "Unauthorized meter access" },
        { status: 403 }
      );
    }

    // Criar o MeterReading
    const meterReading = await prisma.meterReading.create({
      data: {
        meterId,
        contractId: meter.contractId, 
        companyId: session.user.companyId!,
        reading: readingDecimal,
        previousReading: previousDecimal,
        consumption,
        recordedById: session.user.id,
        notes: notes || null,
      },
    });

    // Busca dados da empresa para calcular invoice
    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId! },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const baseCharge = new Decimal(company.minimumCharge);
    const unitPrice = new Decimal(company.pricePerCubicMeter);
    const minCubicMeters = new Decimal(company.minimumCubicMeters);
    const totalAmount = Decimal.max(consumption, minCubicMeters)
      .mul(unitPrice)
      .add(baseCharge);

    // Cria a invoice diretamente
    const invoice = await prisma.invoice.create({
      data: {
        companyId: session.user.companyId!,
        contractId: meterReading.contractId,
        meterId,
        invoiceNumber: `INV-${Date.now()}`,
        previousReading: previousDecimal,
        currentReading: readingDecimal,
        consumption,
        baseCharge,
        unitPrice,
        totalAmount,
        dueDate: new Date(new Date().setDate(new Date().getDate() + 15)),
        issuedById: session.user.id,
      },
    });

    // Atualiza último reading do medidor
    await prisma.meter.update({
      where: { id: meterId },
      data: {
        lastReading: readingDecimal,
        lastReadingDate: new Date(),
      },
    });

    return NextResponse.json({ meterReading, invoice }, { status: 201 });
  } catch (error) {
    console.error("Error creating meter reading and invoice:", error);
    return NextResponse.json(
      { error: "Failed to create meter reading and invoice" },
      { status: 500 }
    );
  }
}
