"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, Download, AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useSessionData } from "@/lib/hooks/useSessionData"
import { toast } from "sonner"

interface Invoice {
  id: string
  invoiceNumber: string
  currentReading: number
  consumption: number
  totalAmount: number
  status: string
  issuanceDate: string
  dueDate: string
  remainingAmount?: number
}

export default function MyInvoicesPage() {
  const { data: session } = useSessionData()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState("ALL")

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        if (!session?.user) return

        const response = await fetch("/api/client/invoices")
        if (response.ok) {
          const data = await response.json()
          setInvoices(data.invoices)
        }
      } catch (error) {
        console.error("[v0] Error fetching invoices:", error)
        toast("Falha ao carregar as faturas")
      } finally {
        setIsLoading(false)
      }
    }

    fetchInvoices()
  }, [session, toast])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800"
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "OVERDUE":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredInvoices = statusFilter === "ALL" ? invoices : invoices.filter((i) => i.status === statusFilter)

  const stats = {
    total: invoices.length,
    pending: invoices.filter((i) => i.status === "PENDING").length,
    paid: invoices.filter((i) => i.status === "PAID").length,
    overdue: invoices.filter((i) => i.status === "OVERDUE").length,
    totalPending: invoices
      .filter((i) => i.status === "PENDING" || i.status === "OVERDUE")
      .reduce((sum, i) => sum + Number(i.totalAmount), 0),
    averageConsumption:
      invoices.length > 0
        ? (invoices.reduce((sum, i) => sum + Number(i.consumption), 0) / invoices.length).toFixed(2)
        : "0",
  }

  const openInvoiceDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setIsDialogOpen(true)
  }

  const getInvoiceCalculations = (invoice: Invoice) => {
    const consumption = Number(invoice.consumption) || 0
    const totalAmount = Number(invoice.totalAmount) || 0
    const baseCharge = 143 // Default base charge
    const consumptionCost = consumption > 0 ? totalAmount - baseCharge : totalAmount
    const unitPrice = consumption > 0 ? consumptionCost / consumption : 0
    return { baseCharge, unitPrice, consumptionCost }
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-dark">As Minhas Faturas</h1>
        <p className="text-neutral-medium mt-2">Consulte e gere as suas faturas de fornecimento de água</p>
      </div>

      {stats.overdue > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Tem {stats.overdue} fatura{stats.overdue !== 1 ? "s" : ""} em atraso. Por favor, regularize o pagamento o
            mais breve possível.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total de Faturas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-dark">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pagas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{stats.paid}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Em Atraso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.overdue}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Montante em Dívida</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-neutral-dark">
              {stats.totalPending.toLocaleString("pt-PT", { minimumFractionDigits: 2 })} MT
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Faturas Recentes</CardTitle>
              <CardDescription>Lista completa das suas faturas de fornecimento de água</CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas</SelectItem>
                <SelectItem value="PENDING">Pendentes</SelectItem>
                <SelectItem value="PAID">Pagas</SelectItem>
                <SelectItem value="OVERDUE">Em Atraso</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-neutral-medium">A carregar faturas...</div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-8 text-neutral-medium">
              {statusFilter === "ALL" ? "Nenhuma fatura encontrada" : `Nenhuma fatura ${statusFilter.toLowerCase()}`}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N.º da Fatura</TableHead>
                    <TableHead>Data de Emissão</TableHead>
                    <TableHead>Data de Vencimento</TableHead>
                    <TableHead>Consumo (m³)</TableHead>
                    <TableHead>Montante (MT)</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>{new Date(invoice.issuanceDate).toLocaleDateString("pt-PT")}</TableCell>
                      <TableCell>{new Date(invoice.dueDate).toLocaleDateString("pt-PT")}</TableCell>
                      <TableCell>{Number(invoice.consumption).toFixed(2)}</TableCell>
                      <TableCell className="font-semibold">
                        {Number(invoice.totalAmount).toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(invoice.status)}>{invoice.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2 flex justify-end">
                        <Button size="sm" variant="outline" onClick={() => openInvoiceDetails(invoice)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedInvoice && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Detalhes da Fatura</DialogTitle>
              <DialogDescription>{selectedInvoice.invoiceNumber}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-neutral-medium">Data de Emissão</p>
                  <p className="font-semibold">{new Date(selectedInvoice.issuanceDate).toLocaleDateString("pt-PT")}</p>
                </div>
                <div>
                  <p className="text-neutral-medium">Data de Vencimento</p>
                  <p className="font-semibold">{new Date(selectedInvoice.dueDate).toLocaleDateString("pt-PT")}</p>
                </div>
              </div>

              <div className="bg-neutral-light p-4 rounded-lg space-y-3">
                {(() => {
                  const { baseCharge, unitPrice, consumptionCost } = getInvoiceCalculations(selectedInvoice)
                  return (
                    <>
                      <div className="flex justify-between">
                        <span className="text-neutral-medium">Tarifa Base</span>
                        <span className="font-semibold">{baseCharge.toFixed(2)} MT</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-medium">
                          Consumo ({Number(selectedInvoice.consumption).toFixed(2)} m³)
                        </span>
                        <span className="font-semibold">{consumptionCost.toFixed(2)} MT</span>
                      </div>
                      <div className="border-t border-neutral-200 pt-3 flex justify-between">
                        <span className="font-semibold">Total</span>
                        <span className="text-lg font-bold text-primary">
                          {Number(selectedInvoice.totalAmount).toLocaleString("pt-PT", { minimumFractionDigits: 2 })} MT
                        </span>
                      </div>
                    </>
                  )
                })()}
              </div>

              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                {selectedInvoice.status === "PAID" ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-semibold text-green-700">Paga</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-warning" />
                    <span className="text-sm font-semibold">Estado: {selectedInvoice.status}</span>
                  </>
                )}
              </div>

              <Button onClick={() => setIsDialogOpen(false)} className="w-full">
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
