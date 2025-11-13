import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const pageParam = searchParams.get("page")
    const search = searchParams.get("search") || ""
    const pageSize = 7

    // Garante que page é um número válido
    const page = Number.isNaN(Number(pageParam)) || !pageParam ? 1 : Number(pageParam)

    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "CASHIER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchFilter = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            ...(Number.isInteger(Number.parseInt(search)) ? [{ nrContrato: Number.parseInt(search) }] : []),
          ],
        }
      : undefined

    // Total de clientes
    const total = await prisma.client.count({
      where: searchFilter,
    })

    // Paginação segura
    const clients = await prisma.client.findMany({
      where: searchFilter,
      include: {
        meters: {
          orderBy: { installationDate: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize, // agora garante que é sempre número
      take: pageSize,
    })

    const totalPages = Math.ceil(total / pageSize)

    return NextResponse.json({
      clients,
      page,
      pageSize,
      total,
      totalPages,
    })
  } catch (error) {
    console.error("Error fetching clients:", error)
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 })
  }
}

async function generateUniqueContractNumber(): Promise<number> {
  let unique = false;
  let nrContrato = 0;

  while (!unique) {
    // Gera um número aleatório de 6 dígitos
    nrContrato = Math.floor(100000 + Math.random() * 900000);

    // Verifica se já existe no banco
    const existing = await prisma.client.findUnique({
      where: { nrContrato },
    });

    if (!existing) {
      unique = true;
    }
  }

  return nrContrato;
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "CASHIER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.user.companyId) {
      return NextResponse.json({ error: "Company not assigned" }, { status: 400 });
    }

    const body = await request.json();
    const { name, email, phone, address, meterNumber, serialNumber } = body;

    // Validate client fields
    if (!name || !email || !phone || !address) {
      return NextResponse.json({ error: "Missing required client fields" }, { status: 400 });
    }

    // Gera número de contrato único
    const nrContrato = await generateUniqueContractNumber();

    const client = await prisma.client.create({
      data: {
        name,
        email,
        phone,
        address,
        nrContrato, // adiciona aqui
        companyId: session.user.companyId,
        createdById: session.user.id,
        meters:
          meterNumber && serialNumber
            ? {
                create: {
                  meterNumber,
                  serialNumber,
                  companyId: session.user.companyId,
                  status: "ACTIVE",
                  isCurrentMeter: true,
                  installationDate: new Date(),
                },
              }
            : undefined,
      },
      include: {
        meters: true,
      },
    });

    await prisma.log.create({
    data: {
      companyId: session.user.companyId,
      userId: session.user.id,
      action: "CREATE_CLIENT",
      entity: "Client",
      entityId: client.id,
      description: `Cliente "${client.name}" criado com o número de contrato ${client.nrContrato}.`,
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    },
  })


    return NextResponse.json({ client });
  } catch (error) {
    console.error("Error creating client:", error);

    // Handle unique constraint violations
    if ((error as any).code === "P2002") {
      return NextResponse.json({ error: "Email ou número de contador já existe" }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}

