"use client"

import { useState, useEffect } from "react"
import { useSessionData } from "@/lib/hooks/useSessionData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Droplet, AlertTriangle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner";

interface Meter {
  id: string
  meterNumber: string
  serialNumber: string
  status: string
  lastReading: number
  lastReadingDate: string | null
  installationDate: string
  replacementDate?: string | null
}

interface MeterStats {
  totalMeters: number
  activeMeters: number
  inactiveMeters: number
  damagedMeters: number
  averageDailyUsage: number
}

export default function MyMetersPage() {
  const { data: session } = useSessionData()
  const [meters, setMeters] = useState<Meter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMeter, setSelectedMeter] = useState<Meter | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    const fetchMeters = async () => {
      try {
        if (!session?.user) return

        const response = await fetch("/api/client/meters")
        if (response.ok) {
          const data = await response.json()
          setMeters(data.meters)
        }
      } catch (error) {
        console.error("[v0] Erro ao carregar contadores:", error)
        toast("Falha ao carregar contadores")
      } finally {
        setIsLoading(false)
      }
    }

    fetchMeters()
  }, [session, toast])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800"
      case "DAMAGED":
        return "bg-red-100 text-red-800"
      case "INACTIVE":
        return "bg-gray-100 text-gray-800"
      case "REPLACED":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const stats: MeterStats = {
    totalMeters: meters.length,
    activeMeters: meters.filter((m) => m.status === "ACTIVE").length,
    inactiveMeters: meters.filter((m) => m.status === "INACTIVE").length,
    damagedMeters: meters.filter((m) => m.status === "DAMAGED").length,
    averageDailyUsage: 0,
  }

  const damagedMeters = meters.filter((m) => m.status === "DAMAGED")

  const openMeterDetails = (meter: Meter) => {
    setSelectedMeter(meter)
    setIsDialogOpen(true)
  }

  const getInstallationAge = (date: string) => {
    const installed = new Date(date)
    const now = new Date()
    const years = now.getFullYear() - installed.getFullYear()
    const months = now.getMonth() - installed.getMonth()

    if (months < 0) return `${years - 1} ano${years - 1 !== 1 ? "s" : ""}`
    if (years === 0) return `${months} mês${months !== 1 ? "es" : ""}`
    return `${years} ano${years !== 1 ? "s" : ""} ${months > 0 ? months + " mês" + (months !== 1 ? "es" : "") : ""}`
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-dark">Os Meus Contadores</h1>
        <p className="text-neutral-medium mt-2">Monitore e gere todos os seus contadores de água</p>
      </div>

      {damagedMeters.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Tem {damagedMeters.length} contador{damagedMeters.length !== 1 ? "es" : ""} danificado{damagedMeters.length !== 1 ? "s" : ""}.  
            Por favor, reporte-os para reparação ou substituição.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total de Contadores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary flex items-center gap-2">
              <Droplet className="w-6 h-6" />
              {stats.totalMeters}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">{stats.activeMeters}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Inativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-neutral-dark">{stats.inactiveMeters}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Danificados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{stats.damagedMeters}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Os Seus Contadores</CardTitle>
          <CardDescription>Lista completa dos seus contadores de água</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-neutral-medium">A carregar contadores...</div>
          ) : meters.length === 0 ? (
            <div className="text-center py-8 text-neutral-medium">Nenhum contador encontrado</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número do Contador</TableHead>
                    <TableHead>Número de Série</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Data de Instalação</TableHead>
                    <TableHead>Última Leitura</TableHead>
                    <TableHead>Data da Última Leitura</TableHead>
                    <TableHead className="text-right">Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {meters.map((meter) => (
                    <TableRow key={meter.id} className={meter.status === "DAMAGED" ? "bg-red-50" : ""}>
                      <TableCell className="font-medium">{meter.meterNumber}</TableCell>
                      <TableCell className="text-sm">{meter.serialNumber}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(meter.status)}>{meter.status}</Badge>
                      </TableCell>
                      <TableCell>{new Date(meter.installationDate).toLocaleDateString()}</TableCell>
                      <TableCell className="font-semibold">{meter.lastReading} m³</TableCell>
                      <TableCell>
                        {meter.lastReadingDate ? (
                          new Date(meter.lastReadingDate).toLocaleDateString()
                        ) : (
                          <Badge variant="outline" className="bg-yellow-50">
                            Pendente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => openMeterDetails(meter)}>
                          Ver
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

      {selectedMeter && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Detalhes do Contador</DialogTitle>
              <DialogDescription>{selectedMeter.meterNumber}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-neutral-medium">Número de Série</p>
                  <p className="font-semibold">{selectedMeter.serialNumber}</p>
                </div>
                <div>
                  <p className="text-neutral-medium">Estado</p>
                  <Badge className={getStatusColor(selectedMeter.status)}>{selectedMeter.status}</Badge>
                </div>
              </div>

              <div className="space-y-3 bg-neutral-light p-4 rounded-lg">
                <div>
                  <p className="text-xs font-semibold text-neutral-medium uppercase">Instalação</p>
                  <p className="text-sm">
                    {new Date(selectedMeter.installationDate).toLocaleDateString()} (
                    {getInstallationAge(selectedMeter.installationDate)} atrás)
                  </p>
                </div>

                <div className="border-t border-neutral-200 pt-3">
                  <p className="text-xs font-semibold text-neutral-medium uppercase">Última Leitura</p>
                  <p className="text-lg font-bold text-primary">{selectedMeter.lastReading} m³</p>
                  {selectedMeter.lastReadingDate && (
                    <p className="text-xs text-neutral-medium">
                      {new Date(selectedMeter.lastReadingDate).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {selectedMeter.replacementDate && (
                  <div className="border-t border-neutral-200 pt-3">
                    <p className="text-xs font-semibold text-neutral-medium uppercase">Data de Substituição</p>
                    <p className="text-sm">{new Date(selectedMeter.replacementDate).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              {selectedMeter.status === "ACTIVE" && (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-semibold text-green-700">Em funcionamento normal</span>
                </div>
              )}

              {selectedMeter.status === "DAMAGED" && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Por favor, contacte o suporte para reportar este contador danificado para reparação ou substituição.
                  </AlertDescription>
                </Alert>
              )}

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
