"use client"

import { useState, useEffect } from "react"
import { useSessionData } from "@/lib/hooks/useSessionData";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Save } from "lucide-react"
import { toast } from "sonner"

interface CompanySettings {
  id: string
  name: string
  taxId: string
  email: string
  phone: string
  address: string
  city: string
  province: string
  minimumCharge: number
  minimumCubicMeters: number
  pricePerCubicMeter: number
  acceptCash: boolean
  acceptCard: boolean
  acceptBankTransfer: boolean
  acceptEmola: boolean
  acceptMpesa: boolean
  bankName?: string
  bankAccount?: string
  bankCode?: string
}

export default function CompanyPage() {
  const { data: session } = useSessionData();
  const [settings, setSettings] = useState<CompanySettings | null>(null)
  const [originalSettings, setOriginalSettings] = useState<CompanySettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (session?.user.role !== "ADMIN") return

    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/admin/company")
        if (response.ok) {
          const data = await response.json()
          setSettings(data.company)
          setOriginalSettings(data.company)
        }
      } catch (error) {
        console.error("[v0] Error fetching company settings:", error)
        toast("Falha ao carregar definições da empresa")
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [session, toast])

  const handleSettingsChange = (newSettings: CompanySettings) => {
    setSettings(newSettings)
    setHasChanges(JSON.stringify(newSettings) !== JSON.stringify(originalSettings))
  }

  const handleSave = async () => {
    if (!settings) return

    if (!settings.name || !settings.taxId || !settings.email || !settings.phone) {
      toast("Preencha todos os campos obrigatórios")
      return
    }

    if (settings.acceptBankTransfer && (!settings.bankName || !settings.bankAccount)) {
      toast("Indique o nome do banco e número de conta para transferência bancária")
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/admin/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        setOriginalSettings(settings)
        setHasChanges(false)
        toast("Definições da empresa guardadas com sucesso")
      } else {
        throw new Error("Falha ao guardar definições")
      }
    } catch (error) {
      console.error("[v0] Error saving settings:", error)
      toast("Falha ao guardar definições da empresa")
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    if (originalSettings) {
      setSettings(originalSettings)
      setHasChanges(false)
      toast("Alterações descartadas")
    }
  }

  if (isLoading) {
    return <div className="p-8 text-neutral-medium">A carregar definições...</div>
  }

  if (!settings) {
    return <div className="p-8 text-neutral-dark">Falha ao carregar definições da empresa</div>
  }

  const exampleConsumption = 15
  const calculatedCharge =
    exampleConsumption <= settings.minimumCubicMeters
      ? settings.minimumCharge
      : settings.minimumCharge + (exampleConsumption - settings.minimumCubicMeters) * settings.pricePerCubicMeter

  const acceptedMethods = [
    settings.acceptCash && "Dinheiro",
    settings.acceptCard && "Cartão",
    settings.acceptBankTransfer && "Transferência Bancária",
    settings.acceptEmola && "E-Mola",
    settings.acceptMpesa && "M-Pesa",
  ].filter(Boolean)

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-dark">Definições da Empresa</h1>
          <p className="text-neutral-medium mt-2">Gerir informação da empresa, preços e métodos de pagamento</p>
        </div>
        {hasChanges && (
          <div className="flex items-center gap-2 px-3 py-1 bg-yellow-50 text-yellow-700 text-sm rounded-lg">
            <AlertCircle className="w-4 h-4" />
            Alterações por guardar
          </div>
        )}
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="pricing">Preços</TabsTrigger>
          <TabsTrigger value="payments">Pagamentos</TabsTrigger>
          <TabsTrigger value="preview">Pré-visualização</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informação da Empresa</CardTitle>
              <CardDescription>Detalhes básicos da empresa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome da Empresa *</Label>
                  <Input
                    id="name"
                    value={settings.name}
                    onChange={(e) => handleSettingsChange({ ...settings, name: e.target.value })}
                    placeholder="AquaFlow Ltd"
                  />
                </div>
                <div>
                  <Label htmlFor="taxId">NIF *</Label>
                  <Input
                    id="taxId"
                    value={settings.taxId}
                    onChange={(e) => handleSettingsChange({ ...settings, taxId: e.target.value })}
                    placeholder="12345678"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => handleSettingsChange({ ...settings, email: e.target.value })}
                    placeholder="info@aquaflow.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input
                    id="phone"
                    value={settings.phone}
                    onChange={(e) => handleSettingsChange({ ...settings, phone: e.target.value })}
                    placeholder="+258 21 123456"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Morada *</Label>
                <Input
                  id="address"
                  value={settings.address}
                  onChange={(e) => handleSettingsChange({ ...settings, address: e.target.value })}
                  placeholder="123 Rua da Água"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">Cidade *</Label>
                  <Input
                    id="city"
                    value={settings.city}
                    onChange={(e) => handleSettingsChange({ ...settings, city: e.target.value })}
                    placeholder="Maputo"
                  />
                </div>
                <div>
                  <Label htmlFor="province">Província *</Label>
                  <Input
                    id="province"
                    value={settings.province}
                    onChange={(e) => handleSettingsChange({ ...settings, province: e.target.value })}
                    placeholder="Maputo"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Preços</CardTitle>
              <CardDescription>Definir preços da água e encargos mínimos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minCharge">Encargo Mínimo (MT) *</Label>
                  <Input
                    id="minCharge"
                    type="number"
                    step="0.01"
                    min="0"
                    value={settings.minimumCharge}
                    onChange={(e) =>
                      handleSettingsChange({ ...settings, minimumCharge: Number.parseFloat(e.target.value) || 0 })
                    }
                    placeholder="300"
                  />
                  <p className="text-xs text-neutral-medium mt-1">Cobrado para consumo abaixo do mínimo</p>
                </div>
                <div>
                  <Label htmlFor="minCubic">Consumo Mínimo (m³) *</Label>
                  <Input
                    id="minCubic"
                    type="number"
                    min="0"
                    value={settings.minimumCubicMeters}
                    onChange={(e) =>
                      handleSettingsChange({ ...settings, minimumCubicMeters: Number.parseInt(e.target.value) || 0 })
                    }
                    placeholder="5"
                  />
                  <p className="text-xs text-neutral-medium mt-1">Limite para aplicar encargo mínimo</p>
                </div>
              </div>
              <div>
                <Label htmlFor="pricePerM3">Preço por m³ (MT) *</Label>
                <Input
                  id="pricePerM3"
                  type="number"
                  step="0.01"
                  min="0"
                  value={settings.pricePerCubicMeter}
                  onChange={(e) =>
                    handleSettingsChange({ ...settings, pricePerCubicMeter: Number.parseFloat(e.target.value) || 0 })
                  }
                  placeholder="100"
                />
                <p className="text-xs text-neutral-medium mt-1">Cobrado para consumo acima do mínimo</p>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 text-sm">
                  <strong>Lógica de Preços:</strong> Se consumo ≤ {settings.minimumCubicMeters}m³, cobrar{" "}
                  {settings.minimumCharge}MT. Caso contrário, cobrar {settings.minimumCharge}MT + ({"{consumo}"} -{" "}
                  {settings.minimumCubicMeters}) × {settings.pricePerCubicMeter}MT
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Métodos de Pagamento</CardTitle>
              <CardDescription>Configurar métodos de pagamento aceites para clientes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="cash"
                    checked={settings.acceptCash}
                    onCheckedChange={(checked) => handleSettingsChange({ ...settings, acceptCash: checked as boolean })}
                  />
                  <div>
                    <Label htmlFor="cash" className="font-medium cursor-pointer">
                      Dinheiro
                    </Label>
                    <p className="text-xs text-neutral-medium">Aceitar pagamentos em dinheiro no balcão</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="card"
                    checked={settings.acceptCard}
                    onCheckedChange={(checked) => handleSettingsChange({ ...settings, acceptCard: checked as boolean })}
                  />
                  <div>
                    <Label htmlFor="card" className="font-medium cursor-pointer">
                      Cartão
                    </Label>
                    <p className="text-xs text-neutral-medium">Aceitar cartões de crédito e débito</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="bank"
                    checked={settings.acceptBankTransfer}
                    onCheckedChange={(checked) =>
                      handleSettingsChange({ ...settings, acceptBankTransfer: checked as boolean })
                    }
                  />
                  <div>
                    <Label htmlFor="bank" className="font-medium cursor-pointer">
                      Transferência Bancária
                    </Label>
                    <p className="text-xs text-neutral-medium">Aceitar transferências bancárias diretas</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="emola"
                    checked={settings.acceptEmola}
                    onCheckedChange={(checked) =>
                      handleSettingsChange({ ...settings, acceptEmola: checked as boolean })
                    }
                  />
                  <div>
                    <Label htmlFor="emola" className="font-medium cursor-pointer">
                      E-Mola
                    </Label>
                    <p className="text-xs text-neutral-medium">Aceitar carteira móvel E-Mola</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="mpesa"
                    checked={settings.acceptMpesa}
                    onCheckedChange={(checked) =>
                      handleSettingsChange({ ...settings, acceptMpesa: checked as boolean })
                    }
                  />
                  <div>
                    <Label htmlFor="mpesa" className="font-medium cursor-pointer">
                      M-Pesa
                    </Label>
                    <p className="text-xs text-neutral-medium">Aceitar M-Pesa</p>
                  </div>
                </div>
              </div>

              {settings.acceptBankTransfer && (
                <div className="pt-4 border-t space-y-4">
                  <h3 className="font-semibold text-neutral-dark">Detalhes para Transferência Bancária</h3>
                  <Alert className="bg-amber-50 border-amber-200">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800 text-sm">
                      Estes detalhes serão apresentados aos clientes para transferências bancárias
                    </AlertDescription>
                  </Alert>
                  <div>
                    <Label htmlFor="bankName">Nome do Banco *</Label>
                    <Input
                      id="bankName"
                      value={settings.bankName || ""}
                      onChange={(e) => handleSettingsChange({ ...settings, bankName: e.target.value })}
                      placeholder="Banco ABC"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bankAccount">Número de Conta *</Label>
                    <Input
                      id="bankAccount"
                      value={settings.bankAccount || ""}
                      onChange={(e) => handleSettingsChange({ ...settings, bankAccount: e.target.value })}
                      placeholder="123456789"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bankCode">Código do Banco</Label>
                    <Input
                      id="bankCode"
                      value={settings.bankCode || ""}
                      onChange={(e) => handleSettingsChange({ ...settings, bankCode: e.target.value })}
                      placeholder="ABCMZ22"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pré-visualização</CardTitle>
              <CardDescription>Reveja as definições e preços da empresa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-neutral-light rounded-lg">
                  <p className="text-xs font-semibold text-neutral-medium uppercase">Nome da Empresa</p>
                  <p className="text-lg font-bold text-neutral-dark">{settings.name}</p>
                </div>
                <div className="p-4 bg-neutral-light rounded-lg">
                  <p className="text-xs font-semibold text-neutral-medium uppercase">NIF</p>
                  <p className="text-lg font-bold text-neutral-dark">{settings.taxId}</p>
                </div>
              </div>

              <div className="p-4 bg-neutral-light rounded-lg">
                <p className="text-xs font-semibold text-neutral-medium uppercase">Contacto</p>
                <p className="text-sm">{settings.email}</p>
                <p className="text-sm">{settings.phone}</p>
                <p className="text-sm">
                  {settings.address}, {settings.city}
                </p>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold text-neutral-dark mb-4">Exemplo de Preço</h3>
                <div className="space-y-3">
                  <p className="text-sm text-neutral-medium">
                    Para um consumo de <strong>{exampleConsumption}m³</strong>:
                  </p>
                  <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span>Encargo Base:</span>
                      <span className="font-semibold">{settings.minimumCharge}MT</span>
                    </div>
                    {exampleConsumption > settings.minimumCubicMeters && (
                      <div className="flex justify-between">
                        <span>
                          Adicional ({exampleConsumption - settings.minimumCubicMeters}m³ ×{" "}
                          {settings.pricePerCubicMeter}MT):
                        </span>
                        <span className="font-semibold">
                          {((exampleConsumption - settings.minimumCubicMeters) * settings.pricePerCubicMeter).toFixed(
                            2,
                          )}
                          MT
                        </span>
                      </div>
                    )}
                    <div className="border-t border-blue-200 pt-2 flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span className="text-primary">{/*calculatedCharge.toFixed(2)*/}MT</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold text-neutral-dark mb-4">Métodos de Pagamento Aceites</h3>
                {acceptedMethods.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {acceptedMethods.map((method,index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {method}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-neutral-medium text-sm">Nenhum método de pagamento seleccionado</p>
                )}
              </div>

              {settings.acceptBankTransfer && settings.bankName && (
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-neutral-dark mb-4">Detalhes Bancários</h3>
                  <div className="bg-neutral-light p-4 rounded-lg space-y-2 text-sm">
                    <p>
                      <strong>Banco:</strong> {settings.bankName}
                    </p>
                    <p>
                      <strong>Conta:</strong> {settings.bankAccount}
                    </p>
                    {settings.bankCode && (
                      <p>
                        <strong>Código:</strong> {settings.bankCode}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex gap-3 justify-end pt-4">
        {hasChanges && (
          <Button variant="outline" onClick={handleReset} disabled={isSaving}>
            Descartar Alterações
          </Button>
        )}
        <Button onClick={handleSave} disabled={isSaving || !hasChanges} className="gap-2">
          <Save className="w-4 h-4" />
          {isSaving ? "A Guardar..." : "Guardar Definições"}
        </Button>
      </div>
    </div>
  )
}
