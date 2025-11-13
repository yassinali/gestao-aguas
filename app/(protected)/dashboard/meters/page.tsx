"use client"

import { useState, useEffect } from "react"
import { useSessionData } from "@/lib/hooks/useSessionData"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit, ExternalLink } from "lucide-react"
import { toast } from "sonner"

interface Meter {
  id: string
  meterNumber: string
  serialNumber: string
  status: string
  lastReading: number
  clientName: string
  installationDate: string
  isCurrentMeter: boolean
  replacedAt?: string
  replacementReason?: string
  client: {
    id: string
    name: string
  }
}

export default function MetersPage() {
  const { data: session } = useSessionData()
  const router = useRouter()
  const [meters, setMeters] = useState<Meter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingMeter, setEditingMeter] = useState<Meter | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editFormData, setEditFormData] = useState({
    status: "ACTIVE",
  })
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "replaced">("all")

  useEffect(() => {
    if (session?.user.role !== "ADMIN") return
    fetchMeters()
  }, [session])

  const fetchMeters = async () => {
    try {
      const response = await fetch("/api/admin/meters")
      if (response.ok) {
        const data = await response.json()
        setMeters(data.meters)
      }
    } catch (error) {
      console.error("Failed to fetch meters:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800"
      case "DAMAGED":
        return "bg-red-100 text-red-800"
      case "REPLACED":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleEditMeter = (meter: Meter) => {
    setEditingMeter(meter)
    setEditFormData({
      status: meter.status,
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateMeter = async () => {
    if (!editingMeter) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/meters/${editingMeter.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      })

      if (response.ok) {
        const data = await response.json()
        setMeters(meters.map((m) => (m.id === editingMeter.id ? data.meter : m)))
        setIsEditDialogOpen(false)
        setEditingMeter(null)
        toast("Contador actualizado com sucesso")
      } else {
        toast("Erro ao actualizar contador")
      }
    } catch (error) {
      console.error("Failed to update meter:", error)
      toast("Erro ao actualizar contador")
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredMeters = meters.filter((meter) => {
    if (filterStatus === "all") return true
    if (filterStatus === "active") return meter.isCurrentMeter
    if (filterStatus === "replaced") return !meter.isCurrentMeter
    return true
  })

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-dark">Contadores de Água</h1>
          <p className="text-neutral-medium mt-2">Gerir e consultar histórico de contadores</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant={filterStatus === "all" ? "default" : "outline"} onClick={() => setFilterStatus("all")}>
          Todos ({meters.length})
        </Button>
        <Button variant={filterStatus === "active" ? "default" : "outline"} onClick={() => setFilterStatus("active")}>
          Activos ({meters.filter((m) => m.isCurrentMeter).length})
        </Button>
        <Button
          variant={filterStatus === "replaced" ? "default" : "outline"}
          onClick={() => setFilterStatus("replaced")}
        >
          Histórico ({meters.filter((m) => !m.isCurrentMeter).length})
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {filterStatus === "all" && "Todos os Contadores"}
            {filterStatus === "active" && "Contadores Activos"}
            {filterStatus === "replaced" && "Histórico de Contadores"}
          </CardTitle>
          <CardDescription>
            {filterStatus === "all" && "Lista completa de todos os contadores registados"}
            {filterStatus === "active" && "Contadores actualmente em serviço"}
            {filterStatus === "replaced" && "Contadores substituídos ou removidos de serviço"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-neutral-medium">Carregando contadores...</div>
          ) : filteredMeters.length === 0 ? (
            <div className="text-center py-8 text-neutral-medium">
              {filterStatus === "all" && "Nenhum contador encontrado"}
              {filterStatus === "active" && "Nenhum contador activo encontrado"}
              {filterStatus === "replaced" && "Nenhum contador no histórico"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº Contador</TableHead>
                    <TableHead>Nº Série</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Última Leitura</TableHead>
                    <TableHead>Data de Instalação</TableHead>
                    {filterStatus !== "active" && <TableHead>Data de Substituição</TableHead>}
                    <TableHead className="text-right">Acções</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMeters.map((meter) => (
                    <TableRow key={meter.id}>
                      <TableCell className="font-medium">{meter.meterNumber}</TableCell>
                      <TableCell>{meter.serialNumber}</TableCell>
                      <TableCell>
                        <button
                          onClick={() => router.push(`/dashboard/clients/${meter.client.id}`)}
                          className="text-primary hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {meter.client.name}
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge className={getStatusColor(meter.status)}>
                            {meter.status === "ACTIVE"
                              ? "Activo"
                              : meter.status === "DAMAGED"
                                ? "Danificado"
                                : meter.status === "REPLACED"
                                  ? "Substituído"
                                  : meter.status}
                          </Badge>
                          {meter.isCurrentMeter && (
                            <Badge variant="outline" className="block">
                              Actual
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{meter.lastReading} m³</TableCell>
                      <TableCell>{new Date(meter.installationDate).toLocaleDateString("pt-PT")}</TableCell>
                      {filterStatus !== "active" && (
                        <TableCell>
                          {meter.replacedAt ? new Date(meter.replacedAt).toLocaleDateString("pt-PT") : "-"}
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => handleEditMeter(meter)}>
                          <Edit className="w-4 h-4" />
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

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Contador</DialogTitle>
            <DialogDescription>Actualizar informações do contador {editingMeter?.meterNumber}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="meter-number">Nº Contador</Label>
              <Input id="meter-number" value={editingMeter?.meterNumber || ""} disabled />
            </div>
            <div>
              <Label htmlFor="serial-number">Nº Série</Label>
              <Input id="serial-number" value={editingMeter?.serialNumber || ""} disabled />
            </div>
            <div>
              <Label htmlFor="edit-status">Estado</Label>
              <Select
                value={editFormData.status}
                onValueChange={(value) => setEditFormData({ ...editFormData, status: value })}
              >
                <SelectTrigger id="edit-status">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Activo</SelectItem>
                  <SelectItem value="DAMAGED">Danificado</SelectItem>
                  <SelectItem value="REPLACED">Substituído</SelectItem>
                  <SelectItem value="INACTIVE">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleUpdateMeter} className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "A actualizar..." : "Actualizar Contador"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
