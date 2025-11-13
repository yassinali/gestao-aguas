import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session || (session.user.role !== "CASHIER" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const invoiceId = searchParams.get("invoiceId")

    if (!invoiceId) {
      return NextResponse.json({ error: "invoiceId is required" }, { status: 400 })
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: {
        id: true,
        invoiceNumber: true,
        companyId: true,
        clientId: true,
        meterId: true,
        consumption: true,
        totalAmount: true,
        issuanceDate: true,
        dueDate: true,
        issuedById: true,
        client: {
          select: {
            id: true,
            name: true,
            address: true,
            nrContrato: true,
          },
        },
        meter: {
          select: {
            meterNumber: true,
            serialNumber: true,
          },
        },
        company: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    if (invoice.companyId !== session.user.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const payments = await prisma.payment.findMany({
      where: { invoiceId },
      select: { amount: true },
    })

    const consumption = Number(invoice.consumption)
    const totalAmount = Number(invoice.totalAmount)
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0)
    const remainingAmount = totalAmount - totalPaid

    const issuanceDate = new Date(invoice.issuanceDate).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })

    const dueDate = new Date(invoice.dueDate).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })

    const html = `
      <!DOCTYPE html>
      <html lang="pt-PT">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Factura ${invoice.invoiceNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; color: #000; background: #f5f5f5; }
          .container { max-width: 210mm; height: 297mm; margin: 20px auto; background: white; padding: 40px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
          .header { margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 15px; }
          .company-name { font-size: 14px; font-weight: bold; }
          .company-info { font-size: 8px; line-height: 1.5; margin-top: 5px; }
          .invoice-title { font-size: 24px; font-weight: bold; text-align: center; margin: 20px 0; }
          .invoice-number { font-size: 14px; text-align: center; margin-bottom: 20px; }
          .content { margin: 20px 0; }
          .section { margin-bottom: 15px; }
          .section-title { font-size: 11px; font-weight: bold; margin-bottom: 5px; }
          .two-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px; }
          .info-row { font-size: 10px; margin-bottom: 5px; display: flex; justify-content: space-between; }
          .info-label { font-weight: bold; }
          .info-value { flex-grow: 1; text-align: right; }
          .table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 9px; }
          .table th, .table td { border: 1px solid #000; padding: 8px; text-align: left; }
          .table th { background: #f0f0f0; font-weight: bold; }
          .table td.number { text-align: right; }
          .totals { margin: 15px 0; font-size: 10px; }
          .totals-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
          .totals-box { border: 1px solid #000; padding: 10px; margin: 10px 0; }
          .bank-info { font-size: 8px; margin: 15px 0; }
          .bank-row { display: grid; grid-template-columns: 100px 1fr 100px; gap: 10px; margin-bottom: 8px; }
          .footer-text { font-size: 7px; margin: 20px 0; line-height: 1.4; text-align: justify; }
          .total-paid { color: #16a34a; font-weight: bold; }
          .total-pending { color: #dc2626; font-weight: bold; }
          @media print {
            body { background: white; }
            .container { box-shadow: none; margin: 0; height: auto; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="company-name">${invoice.company?.name || "ADRMM"}</div>
            <div class="company-info">
              <div>Av. Eduardo Mondlane, nº 1352 - 5º andar</div>
              <div>Caixa Postal nº 2952, Maputo</div>
              <div>Telef. +258 21302432/325160 Fax. +258 21324675</div>
              <div>NUIT: 401337881</div>
              <div>Capital Social: 30.000.000 MZN</div>
            </div>
          </div>

          <div class="invoice-title">FACTURA</div>
          <div class="invoice-number">${invoice.invoiceNumber}</div>

          <div class="two-columns">
            <div class="section">
              <div class="section-title">CLIENTE</div>
              <div style="font-size: 10px;">${invoice.client.name}</div>
              <div style="font-size: 9px; color: #666;">${invoice.client.address || "N/A"}</div>
            </div>
            <div class="section">
              <div class="section-title">LOCAL DO ABASTECIMENTO</div>
              <div style="font-size: 10px;">${invoice.client.address || "N/A"}</div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px;">
            <div class="info-row">
              <span class="info-label">DATA DE EMISSÃO:</span>
              <span class="info-value">${issuanceDate}</span>
            </div>
            <div class="info-row">
              <span class="info-label">PRAZO DE PAGAMENTO:</span>
              <span class="info-value">${dueDate}</span>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px;">
            <div class="info-row">
              <span class="info-label">Nº DE CONTRATO:</span>
              <span class="info-value">${invoice.client.nrContrato || "N/A"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">CATEGORIA:</span>
              <span class="info-value">Domésticos - Geral</span>
            </div>
          </div>

          <div class="info-row" style="margin-bottom: 15px;">
            <span class="info-label">CONTADOR Nº:</span>
            <span class="info-value">${invoice.meter?.meterNumber || "N/A"}</span>
          </div>

          <div class="section">
            <div class="section-title">LEITURAS</div>
            <table class="table">
              <tr>
                <th>Data</th>
                <th>Leitura Anterior</th>
                <th>Data Actual</th>
                <th>Consumo</th>
              </tr>
              <tr>
                <td>${new Date(invoice.issuanceDate).toLocaleDateString("pt-PT")}</td>
                <td class="number">0</td>
                <td>${new Date(invoice.issuanceDate).toLocaleDateString("pt-PT")}</td>
                <td class="number">${consumption}m³</td>
              </tr>
            </table>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Descrição</th>
                <th class="number">Quantidade</th>
                <th class="number">Valor Unitário</th>
                <th class="number">Valor Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Consumo Água até 5 m³</td>
                <td class="number">${consumption}</td>
                <td class="number">${(totalAmount / consumption).toFixed(2)}</td>
                <td class="number">${totalAmount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div class="totals">
            <div class="totals-row">
              <span>SUB-TOTAL</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
            <div class="totals-row">
              <span>MULTA</span>
              <span>0,00</span>
            </div>
            <div class="totals-row">
              <span>IVA (75%*16%)</span>
              <span>0,00</span>
            </div>
          </div>

          <div class="totals-box">
            <div class="totals-row">
              <span><strong>TOTAL DA FACTURA</strong></span>
              <span><strong>${totalAmount.toFixed(2)} MT</strong></span>
            </div>
            <div class="totals-row" style="margin-top: 8px;">
              <span><strong>SALDO TOTAL A PAGAR</strong></span>
              <span class="${remainingAmount > 0 ? "total-pending" : "total-paid"}"><strong>${remainingAmount.toFixed(2)} MT</strong></span>
            </div>
          </div>

          <div class="bank-info">
            <div style="font-weight: bold; margin-bottom: 8px;">INSTITUIÇÃO BANCÁRIA</div>
            <div class="bank-row">
              <strong>MOZA BANCO</strong>
              <span>2424397910001003400002</span>
              <span>2424397910106</span>
            </div>
            <div class="bank-row">
              <strong>ABSA</strong>
              <span>0038102002392000200383810200239</span>
              <span>223</span>
            </div>
            <div class="bank-row">
              <strong>BCI</strong>
              <span>12359158110001000800002</span>
              <span>359158110195</span>
            </div>
            <div class="bank-row">
              <strong>BIM</strong>
              <span>82805894000100000008</span>
              <span>280589457</span>
            </div>
            <div class="bank-row">
              <strong>STANDARD BANK</strong>
              <span>1086991741009000301080699174</span>
              <span>100947</span>
            </div>
          </div>

          <div style="font-size: 8px; margin: 15px 0; font-weight: bold;">Pagamentos por Canais Electrónicos</div>
          <div style="font-size: 8px; margin-bottom: 5px;">Entidade: 50100</div>
          <div style="font-size: 8px; margin-bottom: 5px;">Referência: 33 976 666 830</div>
          <div style="font-size: 8px; margin-bottom: 15px;">Montante: ${remainingAmount.toFixed(2)} MT</div>

          <div class="footer-text">
            Caro cliente, A produção, Transporte e Distribuição de água possui custos elevados. Contribua para continuidade do serviço de fornecimento de água pagando a sua Factura de água em qualquer loja da ADRMM e/ou por Meios Electrónicos.
          </div>
        </div>
      </body>
      </html>
    `

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="Factura_${invoice.invoiceNumber}.html"`,
      },
    })
  } catch (error) {
    console.error("Error generating PDF:", error)
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 })
  }
}
