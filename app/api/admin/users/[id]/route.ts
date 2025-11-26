import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse, NextRequest } from "next/server"

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // params agora é uma Promise → precisamos usar await
    const { id } = await context.params

    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const { name, email, role } = body

    // Validação opcional
    if (!name || !email || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const user = await prisma.user.update({
      where: { id },
      data: { name, email, role }, // PUT = atualiza tudo
    })

    return NextResponse.json({ user })
  } catch (error: any) {
    console.error("Error updating user:", error)

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    )
  }
}
