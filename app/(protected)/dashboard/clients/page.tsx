"use client"

import { useState, useEffect } from "react"
import { useSessionData } from "@/lib/hooks/useSessionData"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Edit, Trash2, ChevronDown, ChevronUp, Calendar, Mail, Phone, MapPin, Search } from "lucide-react"
import { toast } from "sonner"

interface Meter {
  id: string
  meterNumber: string
  serialNumber: string
  status: string
  installationDate: string
  isCurrentMeter: boolean
}

interface Client {
  id: string
  name: string
  email: string
  phone: string
  address: string
  nrContrato: number
  isActive: boolean
  connectionDate: string
  meters: Meter[]
}

export default function ClientsPage() {
  const { data: session } = useSessionData()
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    meterNumber: "",
    serialNumber: "",
    nrContrato: 0,
  })

  useEffect(() => {
    if (session?.user.role !== "ADMIN") return
    fetchClients(1, "")
  }, [session])

  const fetchClients = async (page: number, search: string) => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      params.append("page", page.toString())
      if (search) params.append("search", search)

      const response = await fetch(`/api/admin/clients?${params}`)
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients || [])
        setCurrentPage(data.page)
        setTotalPages(data.totalPages)
        setTotal(data.total)
      }
    } catch (error) {
      console.error("Failed to fetch clients:", error)
      toast("Erro ao carregar clientes")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
    fetchClients(1, value)
  }

  const handleAddClient = async () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.address) {
      toast("Por favor preencha todos os campos do cliente")
      return
    }

    try {
      const response = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        fetchClients(currentPage, searchQuery)
        setFormData({
          name: "",
          email: "",
          phone: "",
          address: "",
          meterNumber: "",
          serialNumber: "",
          nrContrato: 0,
        })
        setIsDialogOpen(false)
        toast("Cliente e contador registados com sucesso")
      } else {
        const error = await response.json()
        toast(`Erro: ${error.error}`)
      }
    } catch (error) {
      console.error("Failed to add client:", error)
      toast("Erro ao registar cliente")
    }
  }

  const handleEditClient = (client: Client) => {
    setEditingClient(client)
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address,
      meterNumber: "",
      serialNumber: "",
      nrContrato: client.nrContrato,
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateClient = async () => {
    if (!editingClient) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/clients/${editingClient.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
        }),
      })

      if (response.ok) {
        fetchClients(currentPage, searchQuery)
        setIsEditDialogOpen(false)
        setEditingClient(null)
        toast("Cliente actualizado com sucesso")
      } else {
        toast("Erro ao actualizar cliente")
      }
    } catch (error) {
      console.error("Failed to update client:", error)
      toast("Erro ao actualizar cliente")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm("Tem certeza que deseja eliminar este cliente?")) return

    try {
      const response = await fetch(`/api/admin/clients/${clientId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchClients(currentPage, searchQuery)
        toast("Cliente eliminado com sucesso")
      } else {
        toast("Erro ao eliminar cliente")
      }
    } catch (error) {
      console.error("Failed to delete client:", error)
      toast("Erro ao eliminar cliente")
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="mt-2">Gerir clientes e respectivos contadores de água</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Registar cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Cliente</DialogTitle>
              <DialogDescription>Registar cliente e contador inicial no sistema</DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-sm mb-4">Informações do Cliente</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="João Silva"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="joao@example.com"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+258123456789"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Morada</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Rua Principal, nº 123"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-sm mb-4">Contador Inicial</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="meterNumber">Número do Contador</Label>
                    <Input
                      id="meterNumber"
                      value={formData.meterNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          meterNumber: e.target.value,
                        })
                      }
                      placeholder="CTR-001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="serialNumber">Número de Série</Label>
                    <Input
                      id="serialNumber"
                      value={formData.serialNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          serialNumber: e.target.value,
                        })
                      }
                      placeholder="SN-2024-001"
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleAddClient} className="w-full cursor-pointer">
                Registar Cliente e Contador
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos os Clientes</CardTitle>
          <CardDescription>Lista de clientes e seus contadores activos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Pesquisar por nome ou número de contrato..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {isLoading ? (
            <div className="text-center py-8">Carregando clientes...</div>
          ) : clients.length === 0 ? (
            <div className="text-center py-8">Nenhum cliente encontrado</div>
          ) : (
            <>
              <div className="text-sm text-gray-500 mb-4">
                Mostrando {clients.length} de {total} clientes (Página {currentPage} de {totalPages})
              </div>

              <div className="space-y-4">
                {clients.map((client) => (
                  <div key={client.id} className="border rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between p-4 bg-neutral-light hover:bg-neutral-lighter transition-colors">
                      <div className="flex items-center gap-4 flex-1">
                        <button
                          onClick={() => setExpandedClientId(expandedClientId === client.id ? null : client.id)}
                          className="p-1"
                        >
                          {expandedClientId === client.id ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </button>
                        <div className="flex-1">
                          <div className="font-medium">{client.name}</div>
                          <div className="font-semibold">Nr de Contrato: {client.nrContrato}</div>
                        </div>
                        <Badge
                          className={client.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                        >
                          {client.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEditClient(client)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 bg-transparent"
                          onClick={() => handleDeleteClient(client.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {expandedClientId === client.id && (
                      <div className="bg-white border-t p-4 space-y-3">
                        <div className="text-sm">
                          <div className="font-semibold mb-2">Informações de Contacto</div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-1">
                              <Phone size={16} /> Telefone: {client.phone}
                            </div>
                            <div className="flex items-center gap-1 justify-center text-sm">
                              <Mail size={16} /> {client.email}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin size={16} /> Morada: {client.address}
                            </div>
                            <div className="flex items-center gap-1 justify-center">
                              <Calendar size={16} /> Registado em:{" "}
                              {new Date(client.connectionDate).toLocaleDateString("pt-PT")}
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="font-semibold mb-2">Contadores</div>
                          {client.meters && client.meters.length > 0 ? (
                            <div className="space-y-2">
                              {client.meters.map((meter) => (
                                <div
                                  key={meter.id}
                                  className="flex items-center justify-between p-2 bg-neutral-light rounded text-sm"
                                >
                                  <div>
                                    <div className="font-medium">
                                      Nº {meter.meterNumber} (Série: {meter.serialNumber})
                                    </div>
                                    <div className="text-xs">
                                      Instalado em: {new Date(meter.installationDate).toLocaleDateString("pt-PT")}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      className={
                                        meter.status === "ACTIVE"
                                          ? "bg-green-100 text-green-800"
                                          : meter.status === "REPLACED"
                                            ? "bg-blue-100 text-blue-800"
                                            : "bg-red-100 text-red-800"
                                      }
                                    >
                                      {meter.status === "ACTIVE"
                                        ? "Activo"
                                        : meter.status === "REPLACED"
                                          ? "Substituído"
                                          : "Danificado"}
                                    </Badge>
                                    {meter.isCurrentMeter && <Badge variant="outline">Actual</Badge>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm">Nenhum contador registado</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    const newPage = currentPage - 1
                    setCurrentPage(newPage)
                    fetchClients(newPage, searchQuery)
                  }}
                  disabled={currentPage === 1}
                >
                  ← Anterior
                </Button>

                <div className="text-sm text-gray-600">
                  Página {currentPage} de {totalPages}
                </div>

                <Button
                  variant="outline"
                  onClick={() => {
                    const newPage = currentPage + 1
                    setCurrentPage(newPage)
                    fetchClients(newPage, searchQuery)
                  }}
                  disabled={currentPage === totalPages}
                >
                  Seguir →
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>Actualizar informações do cliente</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Nome Completo</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-phone">Telefone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-address">Morada</Label>
                <Input
                  id="edit-address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>
            <Button onClick={handleUpdateClient} className="w-full cursor-pointer" disabled={isSubmitting}>
              {isSubmitting ? "A actualizar..." : "Actualizar Cliente"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
