import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

      if (!session || (session.user.role !== "CASHIER" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const meters = await prisma.meter.findMany({
      where: {
        companyId: session.user.companyId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        meterNumber: true,
        lastReading: true,
        lastReadingDate: true,
        client: {
          select: { name: true },
        },
      },
      orderBy: {
        meterNumber: "asc",
      },
    })

    const formattedMeters = meters.map((m) => ({
      ...m,
      clientName: m.client.name,
      client: undefined,
    }))

    return NextResponse.json({ meters: formattedMeters })
  } catch (error) {
    console.error("[v0] Error fetching meters:", error)
    return NextResponse.json({ error: "Failed to fetch meters" }, { status: 500 })
  }
}
