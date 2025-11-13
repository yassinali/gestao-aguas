"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSessionData } from "@/lib/hooks/useSessionData"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Droplet, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"

interface ClientMeter {
  id: string
  meterNumber: string
  serialNumber: string
  clientId: string
  lastReading: number
  lastReadingDate: string | null
  client:{
    id: string
    name:  string
  }
}

interface CalculatedValues {
  consumption: number
  baseCharge: number
  totalAmount: number
}

export default function MeterReadingsPage() {
  const { data: session } = useSessionData()
  const [meters, setMeters] = useState<ClientMeter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedMeterId, setSelectedMeterId] = useState("")
  const [currentReading, setCurrentReading] = useState("")
  const [notes, setNotes] = useState("")
  const [calculatedValues, setCalculatedValues] = useState<CalculatedValues | null>(null)

  useEffect(() => {
    const fetchMeters = async () => {
      if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "CASHIER")) return;

      try {
        const response = await fetch("/api/admin/meters")
        if (response.ok) {
          const data = await response.json()
          setMeters(data.meters)
        }
      } catch (error) {
        console.error("Error fetching meters:", error)
        toast("Erro ao carregar contadores")
      } finally {
        setIsLoading(false)
      }
    }

    fetchMeters()
  }, [session])

  const selectedMeter = meters.find((m) => m.id === selectedMeterId)

  const handleReadingChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const reading = e.target.value
    setCurrentReading(reading)

    if (!selectedMeter || !reading) {
      setCalculatedValues(null)
      return
    }

    const readingValue = Number.parseFloat(reading)
    const previousReading = selectedMeter.lastReading || 0

    if (isNaN(readingValue) || readingValue < previousReading) {
      setCalculatedValues(null)
      return
    }

    // Calculate values based on company pricing
    const consumption = readingValue - previousReading

    try {
      const response = await fetch("/api/admin/meter-readings/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consumption,
          previousReading,
          currentReading: readingValue,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setCalculatedValues(data)
      }
    } catch (error) {
      console.error(" Error calculating values:", error)
    }
  }

  const handleSubmit = async () => {
    if (!selectedMeter || !currentReading) {
      toast("Seleccione um contador e insira a leitura")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/admin/meter-readings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meterId: selectedMeterId,
          clientId: selectedMeter.clientId,
          reading: Number.parseFloat(currentReading),
          previousReading: selectedMeter.lastReading || 0,
          notes: notes || null,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast(`Leitura registada com sucesso!`)
        setCurrentReading("")
        setNotes("")
        setSelectedMeterId("")
        setCalculatedValues(null)

        // Refresh meters
        const metersRes = await fetch("/api/admin/meters")
        if (metersRes.ok) {
          const metersData = await metersRes.json()
          setMeters(metersData.meters)
        }
      } else {
        throw new Error("Erro ao registrar leitura")
      }
    } catch (error) {
      console.error(" Error submitting reading:", error)
      toast("Erro ao registrar leitura")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "CASHIER")) {
  return <p>Não tem permissão para aceder a esta página</p>;
}


  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-dark flex items-center gap-2">
          <Droplet className="w-8 h-8 text-primary" />
          Lançamento de Leituras
        </h1>
        <p className="mt-2">Registe as leituras de contadores para faturação</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registar Nova Leitura</CardTitle>
          <CardDescription>Seleccione um contador e insira a leitura actual</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-neutral-medium">Carregando contadores...</div>
          ) : (
            <div className="space-y-6">
              {/* Meter Selection */}
              <div>
                <Label htmlFor="meter">Seleccione o Contador</Label>
                <Select value={selectedMeterId} onValueChange={setSelectedMeterId}>
                  <SelectTrigger id="meter" className="mt-2">
                    <SelectValue placeholder="Escolha um contador..." />
                  </SelectTrigger>
                  <SelectContent>
                    {meters.map((meter) => (
                      <SelectItem key={meter.id} value={meter.id}>
                        {meter.client.name} - {meter.meterNumber} ({meter.serialNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Selected Meter Info */}
              {selectedMeter && (
                <div className="bg-primary/5 p-4 rounded-lg space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs">Cliente</p>
                      <p className="font-semibold">{selectedMeter.client.name}</p>
                    </div>
                    <div>
                      <p className="text-xs">Número do Contador</p>
                      <p className="font-semibold">{selectedMeter.meterNumber}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm border-t border-primary/10 pt-3">
                    <div>
                      <p className="text-xs">Leitura Anterior</p>
                      <p className="font-semibold">{selectedMeter.lastReading} m³</p>
                    </div>
                    <div>
                      <p className="text-xs">Data da Última Leitura</p>
                      <p className="font-semibold">
                        {selectedMeter.lastReadingDate
                          ? new Date(selectedMeter.lastReadingDate).toLocaleDateString()
                          : "Nenhuma"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Current Reading Input */}
              <div>
                <Label htmlFor="reading">Leitura Actual (m³)</Label>
               <Input
                id="reading"
                type="number"
                step="0.01"
                value={currentReading}
                onChange={handleReadingChange}
                placeholder="0.00"
                disabled={!selectedMeter}
                min={selectedMeter?.lastReading || 0}
                className="mt-2 focus:outline-none focus:ring-0 focus:border-none"
              />

                              {selectedMeter && (
                  <p className="text-xs mt-1">Mínimo: {selectedMeter.lastReading || 0} m³</p>
                )}
              </div>

              {/* Calculated Values */}
              {calculatedValues && (
                <div className="space-y-3">
                  <div className="bg-secondary/10 p-4 rounded-lg space-y-3">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase">Consumo</p>
                        <p className="text-2xl font-bold text-primary">{calculatedValues.consumption} m³</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase">Taxa Base</p>
                        <p className="text-lg font-semibold">{calculatedValues.baseCharge.toFixed(2)} MT</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase">Valor Total</p>
                        <p className="text-2xl font-bold">
                          {calculatedValues.totalAmount.toFixed(2)} MT
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notas (Opcional)</Label>
                <Input
                  id="notes"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Adicione alguma observação se necessário"
                  disabled={!selectedMeter}
                  className="mt-2 focus:outline-none focus:ring-0 focus:border-none"
                />
              </div>

              {/* Validation Alert */}
              {selectedMeter && currentReading && Number.parseFloat(currentReading) < selectedMeter.lastReading && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    A leitura actual não pode ser menor que a leitura anterior ({selectedMeter.lastReading} m³)
                  </AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={!selectedMeter || !currentReading || !calculatedValues || isSubmitting}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? "Registando..." : "Registar Leitura"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
