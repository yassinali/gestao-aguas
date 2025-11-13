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
}

export function InvoicePDFButton({ invoiceId, invoiceNumber, status, remainingAmount }: InvoicePDFButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  // Only show for unpaid invoices
  if (status === "PAID" || remainingAmount === 0) {
    return null
  }

  const handleDownloadPDF = async () => {
    try {
      setIsLoading(true)

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
      setIsLoading(false)
    }
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleDownloadPDF}
      disabled={isLoading}
      className="gap-2 bg-transparent"
      title="Descarregar factura como PDF"
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      <span className="hidden sm:inline">PDF</span>
    </Button>
  )
}
