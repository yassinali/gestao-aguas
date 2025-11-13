import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Decimal } from "@prisma/client/runtime/library"
import { NextResponse } from "next/server"

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
    if (!body.meterId || body.reading === undefined) {
      return NextResponse.json({ error: "meterId and reading are required" }, { status: 400 })
    }

    if (isNaN(Number(body.reading)) || Number(body.reading) < 0) {
      return NextResponse.json({ error: "reading must be a positive number" }, { status: 400 })
    }

    // Get the meter and its last reading
    const meter = await prisma.meter.findUnique({
      where: { id: body.meterId },
      select: {
        lastReading: true,
        status: true,
        companyId: true,
        clientId: true,
      },
    })

    if (!meter) {
      return NextResponse.json({ error: "Meter not found" }, { status: 404 })
    }

    // Verify ownership
    if (meter.companyId !== session.user.companyId) {
      return NextResponse.json({ error: "Unauthorized - meter not in your company" }, { status: 403 })
    }

    // Check if meter is active
    if (meter.status !== "ACTIVE") {
      return NextResponse.json({ error: "Cannot record readings for inactive meters" }, { status: 400 })
    }

    const newReading = new Decimal(body.reading)

    // Validate reading is not going backwards
    if (newReading.lt(meter.lastReading)) {
      return NextResponse.json({ error: "New reading cannot be less than previous reading" }, { status: 400 })
    }

    // Calculate consumption
    const consumption = newReading.minus(meter.lastReading)

    // Create reading record
    const reading = await prisma.meterReading.create({
      data: {
        companyId: session.user.companyId!,
        meterId: body.meterId,
        reading: newReading,
        previousReading: meter.lastReading,
        consumption: consumption,
        recordedById: session.user.id,
        notes: body.notes || null,
        clientId: meter.clientId,
      },
    })

    // Update meter's last reading
    await prisma.meter.update({
      where: { id: body.meterId },
      data: {
        lastReading: newReading,
        lastReadingDate: new Date(),
      },
    })

    console.log(`[v0] Meter reading recorded: ${body.meterId}, consumption: ${consumption}m³`)

    return NextResponse.json({ reading }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating reading:", error)
    return NextResponse.json({ error: "Failed to create reading" }, { status: 500 })
  }
}
