import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse, NextRequest } from "next/server"

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params // 👈 Desestruturação assíncrona

    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const user = await prisma.user.update({
      where: { id },
      data: {
        role: body.role,
        name: body.name,
      },
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}
