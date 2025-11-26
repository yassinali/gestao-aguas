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

    const invoices = await prisma.invoice.findMany({
      where: {
        companyId: session.user.companyId,
      },
      select: {
        id: true,
        invoiceNumber: true,
        consumption: true,
        totalAmount: true,
        status: true,
        issuanceDate: true,
        dueDate: true,
        clients: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        issuanceDate: "desc",
      },
    });

    const formattedInvoices = invoices.map((i) => ({
      ...i,
      clientName: i.clients.length > 0 ? i.clients[0].name : null,
      clients: undefined,
    }));

    return NextResponse.json({ invoices: formattedInvoices });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}
