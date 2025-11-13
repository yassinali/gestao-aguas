"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSessionData } from "@/lib/hooks/useSessionData"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"

interface DelinquentClient {
  id: string
  name: string
  email: string
  phone: string
  totalDebt: number
  overdueInvoices: number
}

export default function DelinquentClientsPage() {
  const { data: session } = useSessionData()
  const router = useRouter()
  const [clients, setClients] = useState<DelinquentClient[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!session?.user || session.user.role !== "ADMIN") return

    const fetchDelinquentClients = async () => {
      try {
        const response = await fetch("/api/admin/clients/atrasado")
        if (response.ok) {
          const data = await response.json()
          setClients(data.clients)
        }
      } catch (error) {
        console.error("[v0] Error fetching delinquent clients:", error)
        toast("Erro ao carregar clientes em dívida")
      } finally {
        setIsLoading(false)
      }
    }

    fetchDelinquentClients()
  }, [session, toast])

  const totalDebt = clients.reduce((sum, client) => sum + client.totalDebt, 0)

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-dark flex items-center gap-2">
          <AlertCircle className="w-8 h-8 text-destructive" />
          Clientes em Dívida
        </h1>
        <p className="text-neutral-medium mt-2">Clientes com facturas atrasadas não pagas</p>
      </div>

      {clients.length > 0 && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>{clients.length}</strong> cliente(s) com dívida total de <strong>{totalDebt.toFixed(2)} MT</strong>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Clientes em Dívida</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{clients.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total de Dívida</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalDebt.toFixed(2)} MT</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Dívida Média</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clients.length > 0 ? (totalDebt / clients.length).toFixed(2) : "0.00"} MT
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delinquent Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Clientes com Facturas Atrasadas</CardTitle>
          <CardDescription>Todos os clientes com pagamentos em atraso</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-neutral-medium">Carregando dados...</div>
          ) : clients.length === 0 ? (
            <div className="text-center py-8 text-neutral-medium">Nenhum cliente em dívida</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Facturas Atrasadas</TableHead>
                    <TableHead>Total Devendo (MT)</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.id} className="bg-red-50">
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>{client.phone}</TableCell>
                      <TableCell>
                        <Badge className="bg-red-100 text-red-800">{client.overdueInvoices}</Badge>
                      </TableCell>
                      <TableCell className="font-bold text-red-600">{client.totalDebt.toFixed(2)} MT</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                        >
                          Ver Facturas
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
    </div>
  )
}
