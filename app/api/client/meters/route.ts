import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session || (session.user.role !== "ADMIN"))  {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const meters = await prisma.meter.findMany({
      where: {
        client: {
          createdById: session.user.id,
        },
      },
      select: {
        id: true,
        meterNumber: true,
        serialNumber: true,
        status: true,
        lastReading: true,
        lastReadingDate: true,
        installationDate: true,
      },
      orderBy: {
        meterNumber: "asc",
      },
    })

    return NextResponse.json({ meters })
  } catch (error) {
    console.error("Error fetching meters:", error)
    return NextResponse.json({ error: "Failed to fetch meters" }, { status: 500 })
  }
}
