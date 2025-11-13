import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse, NextRequest } from "next/server"

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params // 👈 Agora é assíncrono

    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { status } = body

    if (!status || !["ACTIVE", "DAMAGED", "REPLACED", "INACTIVE"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const meter = await prisma.meter.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json({ meter })
  } catch (error) {
    console.error("[v0] Error updating meter:", error)
    return NextResponse.json({ error: "Failed to update meter" }, { status: 500 })
  }
}
