"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface InvoicePDFButtonProps {
  invoiceId: string
  invoiceNumber: string
  status: string
  remainingAmount: number
  hasPayments: boolean // <- NOVO: API deve retornar se a factura tem pagamentos
}

export function InvoicePDFButton({
  invoiceId,
  invoiceNumber,
  status,
  remainingAmount,
  hasPayments
}: InvoicePDFButtonProps) {

  const [isLoadingFactura, setIsLoadingFactura] = useState(false)
  const [isLoadingReceipt, setIsLoadingReceipt] = useState(false)

  // -----------------------------
  // Handler para FACTURA
  // -----------------------------
  const handleDownloadInvoice = async () => {
    try {
      setIsLoadingFactura(true)

      const response = await fetch(`/api/admin/invoices/pdf?invoiceId=${invoiceId}`)

      if (!response.ok) {
        toast.error("Erro ao gerar factura")
        return
      }

      const html = await response.text()
      const printWindow = window.open("", "_blank")
      if (printWindow) {
        printWindow.document.write(html)
        printWindow.document.close()
        printWindow.print()
      }

      toast.success("Factura carregada para impressão")
    } catch (error) {
      console.error("Erro ao gerar PDF:", error)
      toast.error("Erro ao gerar factura")
    } finally {
      setIsLoadingFactura(false)
    }
  }

  // -----------------------------
  // Handler para RECIBO DE PAGAMENTO
  // -----------------------------
  const handleDownloadReceipt = async () => {
    try {
      setIsLoadingReceipt(true)

      const response = await fetch(`/api/admin/payments/receipt?invoiceId=${invoiceId}`)

      if (!response.ok) {
        toast.error("Erro ao gerar recibo")
        return
      }

      const html = await response.text()
      const printWindow = window.open("", "_blank")
      if (printWindow) {
        printWindow.document.write(html)
        printWindow.document.close()
        printWindow.print()
      }

      toast.success("Recibo carregado para impressão")
    } catch (error) {
      console.error("Erro ao gerar recibo:", error)
      toast.error("Erro ao gerar recibo")
    } finally {
      setIsLoadingReceipt(false)
    }
  }

  return (
    <div className="flex gap-2">
      {/* -------------------------------
         BOTÃO PDF FACTURA — mostra somente se não estiver paga 
      --------------------------------*/}
      {status !== "PAID" && remainingAmount > 0 && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleDownloadInvoice}
          disabled={isLoadingFactura}
          className="gap-2 bg-transparent cursor-pointer"
          title="Descarregar factura como PDF"
        >
          {isLoadingFactura
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Download className="w-4 h-4" />
          }
          <span className="hidden sm:inline">Factura</span>
        </Button>
      )}

      {/* -------------------------------
         BOTÃO PDF RECIBO — Mostra SOMENTE se tem pagamentos
      --------------------------------*/}
      {hasPayments && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleDownloadReceipt}
          disabled={isLoadingReceipt}
          className="gap-2 bg-transparent cursor-pointer text-green-600 border-green-500"
          title="Descarregar recibo"
        >
          {isLoadingReceipt
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Download className="w-4 h-4" />
          }
          <span className="hidden sm:inline">Recibo</span>
        </Button>
      )}
    </div>
  )
}
