import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session || session.user.role !== "ADMIN"  && session.user.role !== "CASHIER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const meters = await prisma.meter.findMany({
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { installationDate: "desc" },
    })

    return NextResponse.json({ meters })
  } catch (error) {
    console.error("[v0] Error fetching meters:", error)
    return NextResponse.json({ error: "Failed to fetch meters" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session || session.user.role !== "ADMIN"  && session.user.role !== "CASHIER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { clientId, meterNumber, serialNumber, replacedMeterId, replacementReason } = body

    if (!clientId || !meterNumber || !serialNumber) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (replacedMeterId) {
      await prisma.meter.update({
        where: { id: replacedMeterId },
        data: {
          status: "REPLACED",
          isCurrentMeter: false,
          replacedAt: new Date(),
          replacementReason: replacementReason || "Routine replacement",
        },
      })
    }

    const meter = await prisma.meter.create({
      data: {
        meterNumber,
        serialNumber,
        clientId,
        status: "ACTIVE",
        isCurrentMeter: true,
        installationDate: new Date(),
        // Link to replaced meter if applicable
        ...(replacedMeterId && { replacedById: replacedMeterId }),
      },
      include: {
        client: {
          select: {
            name: true,
          },
        },
      },
    })

    return NextResponse.json({ meter })
  } catch (error) {
    console.error("[v0] Error creating meter:", error)

    if ((error as any).code === "P2002") {
      return NextResponse.json({ error: "Número de contador ou série já existe" }, { status: 400 })
    }

    return NextResponse.json({ error: "Failed to create meter" }, { status: 500 })
  }
}
