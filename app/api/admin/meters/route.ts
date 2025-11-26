import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (
      !session ||
      (session.user.role !== "ADMIN" && session.user.role !== "CASHIER")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const meters = await prisma.meter.findMany({
      include: {
        contract: {
          select: {
            client: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { installationDate: "desc" },
    });

    console.log("Fetched meters:", JSON.stringify(meters, null, 2));

    return NextResponse.json({ meters });
  } catch (error) {
    console.error(" Error fetching meters:", error);
    return NextResponse.json(
      { error: "Failed to fetch meters" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (
      !session ||
      (session.user.role !== "ADMIN" && session.user.role !== "CASHIER")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      clientId,
      meterNumber,
      serialNumber,
      replacedMeterId,
    } = body;

    if (!clientId || !meterNumber || !serialNumber) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("Creating meter with data:", replacedMeterId);

   if (replacedMeterId) {
  try {
    // Atualiza o contador que está a ser substituído
    const contadorTeste = await prisma.meter.update({
      where: { id: replacedMeterId },
      data: {
        status: "REPLACED",
        isCurrentMeter: false,
        replacedAt: new Date(),
        replacedByUserId: session.user.id,
        replacementReason: "Routine replacement",
        // Mantemos replacedById, que é a forma correta de linkar à relação
        replacedById: undefined, // ainda não existe o novo contador, será atualizado depois
      },
    });

    console.log("Dados gravados no contador substituído:", contadorTeste);

  } catch (err) {
    console.error("Erro ao atualizar contador substituído:", err);

    return NextResponse.json(
      { error: "Failed to update replaced meter", details: err },
      { status: 500 }
    );
  }
}


   

    const contract = await prisma.contract.findFirst({
      where: {
        clientId,
        companyId: session.user.companyId,
      },
    });

    const meter = await prisma.meter.create({
      data: {
        meterNumber,
        serialNumber,
        contractId: contract?.id,
        companyId: session.user.companyId,
        status: "ACTIVE",
        isCurrentMeter: true,
        installationDate: new Date(),

        ...(replacedMeterId && { replacedById: replacedMeterId }),
      },
      include: {
        contract: {
          select: {
            client: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(meter, { status: 201 });
  } catch (error) {
    console.error(" Error creating meter:", error);

    if ((error as any).code === "P2002") {
      return NextResponse.json(
        { error: "Número de contador ou série já existe" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create meter" },
      { status: 500 }
    );
  }
}
