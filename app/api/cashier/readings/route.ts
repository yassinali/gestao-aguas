import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Decimal } from "@prisma/client/runtime/library"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    // 1️⃣ Autenticação
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session || (session.user.role !== "CASHIER" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2️⃣ Receber dados da requisição
    const body = await request.json()

    if (!body.meterId || body.reading === undefined) {
      return NextResponse.json({ error: "meterId and reading are required" }, { status: 400 })
    }

    if (isNaN(Number(body.reading)) || Number(body.reading) < 0) {
      return NextResponse.json({ error: "reading must be a positive number" }, { status: 400 })
    }

    // 3️⃣ Buscar medidor + contrato
    const meter = await prisma.meter.findUnique({
      where: { id: body.meterId },
      select: {
        lastReading: true,
        status: true,
        companyId: true,
        contract: {
          select: {
            id: true,
            clientId: true,
          },
        },
      },
    })

    if (!meter) {
      return NextResponse.json({ error: "Meter not found" }, { status: 404 })
    }

    // 4️⃣ Verificar se o medidor pertence à empresa do usuário
    if (meter.companyId !== session.user.companyId) {
      return NextResponse.json({ error: "Unauthorized - meter not in your company" }, { status: 403 })
    }

    // 5️⃣ Verificar status do medidor
    if (meter.status !== "ACTIVE") {
      return NextResponse.json({ error: "Cannot record readings for inactive meters" }, { status: 400 })
    }

    const newReading = new Decimal(body.reading)

    // 6️⃣ Validar leitura não retrocedendo
    if (newReading.lt(meter.lastReading)) {
      return NextResponse.json({ error: "New reading cannot be less than previous reading" }, { status: 400 })
    }

    // 7️⃣ Calcular consumo
    const consumption = newReading.minus(meter.lastReading)

    // 8️⃣ Criar registro de leitura
    const reading = await prisma.meterReading.create({
      data: {
        companyId: session.user.companyId!,
        meterId: body.meterId,
        contractId: meter.contract.id,
        reading: newReading,
        previousReading: meter.lastReading,
        consumption: consumption,
        recordedById: session.user.id,
        notes: body.notes || null,
      },
    })

    // 9️⃣ Atualizar último valor do medidor
    await prisma.meter.update({
      where: { id: body.meterId },
      data: {
        lastReading: newReading,
        lastReadingDate: new Date(),
      },
    })


    return NextResponse.json({ reading }, { status: 201 })
  } catch (error) {
    console.error("Error creating reading:", error)
    return NextResponse.json({ error: "Failed to create reading" }, { status: 500 })
  }
}
