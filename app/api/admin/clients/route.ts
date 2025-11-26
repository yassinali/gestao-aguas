import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get("page");
    const search = searchParams.get("search") || "";
    const pageSize = 7;

    // Garante que page é um número válido
    const page =
      Number.isNaN(Number(pageParam)) || !pageParam ? 1 : Number(pageParam);

    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (
      !session ||
      (session.user.role !== "ADMIN" && session.user.role !== "CASHIER")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchFilter = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            ...(Number.isInteger(Number.parseInt(search))
              ? [{ nrContrato: Number.parseInt(search) }]
              : []),
          ],
        }
      : undefined;

    // Total de clientes
    const total = await prisma.client.count({
      where: searchFilter,
    });

    // Paginação segura
    const clients = await prisma.client.findMany({
      where: searchFilter,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,

      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        createdAt: true,
        isActive:true,

        contracts: {
          select: {
            id: true,
            contractNumber: true,
            isActive: true,
            startDate: true,
            endDate: true,

            meters: {
              select: {
                id: true,
                meterNumber: true,
                serialNumber: true,
                status: true,
                installationDate: true,
                isCurrentMeter: true,
              },
            },
          },
        },
      },
    });

    const totalPages = Math.ceil(total / pageSize);

    console.log("Fetched clients:", clients);

    return NextResponse.json({
      clients,
      page,
      pageSize,
      total,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}

async function generateUniqueContractNumber(companyId: string) {
  let number = 0;
  let exists = true;

  while (exists) {
    number = Math.floor(100000 + Math.random() * 900000);

    const contract = await prisma.contract.findFirst({
      where: { companyId, contractNumber: number },
    });

    exists = !!contract;
  }

  return number;
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    const { name, email, phone, address, meterNumber, serialNumber,currentReading } = data;

    const contractNumber = await generateUniqueContractNumber(
      session.user.companyId
    );

    const client = await prisma.client.create({
      data: {
        companyId: session.user.companyId,
        createdById: session.user.id,
        name,
        email,
        phone,
        address,

        contracts: {
          create: {
            companyId: session.user.companyId,
            contractNumber,
            isActive: true,

            meters: {
              create: {
                companyId: session.user.companyId,
                meterNumber,
                serialNumber,
                lastReading: currentReading,
                status: "ACTIVE",
                installationDate: new Date(),
                isCurrentMeter: true,
              },
            },
          },
        },
      },

      include: {
        contracts: {
          include: {
            meters: true,
          },
        },
      },
    });

    return NextResponse.json(client);
  } catch (error: any) {
    console.error("Error creating client:", error);
    return NextResponse.json(
      { error: "Erro ao criar cliente" },
      { status: 500 }
    );
  }
}
