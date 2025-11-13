"use client"

import { useState, useEffect } from "react"
import { useSessionData } from "@/lib/hooks/useSessionData";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2 } from "lucide-react"
import { toast } from "sonner";

interface User {
  id: string
  name: string
  email: string
  role: "ADMIN" | "CASHIER" | "CLIENT"
  emailVerified: boolean
  createdAt: string
}

export default function UsersPage() {
  const { data: session } = useSessionData()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "CASHIER" as const,
  })

  useEffect(() => {
    if (session?.user.role !== "ADMIN") return

    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/admin/users")
        if (response.ok) {
          const data = await response.json()
          setUsers(data.users)
        }
      } catch (error) {
        console.error("Falha ao carregar utilizadores:", error)
        toast("Falha ao carregar utilizadores")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [session, toast])

  const handleAddUser = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      toast("Preencha todos os campos")
      return
    }

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        setUsers([data.user, ...users])
        setFormData({
          name: "",
          email: "",
          password: "",
          role: "CASHIER",
        })
        setIsDialogOpen(false)
        toast("Utilizador criado com sucesso")
      } else {
        throw new Error("Falha ao criar utilizador")
      }
    } catch (error) {
      console.error("Falha ao adicionar utilizador:", error)
      toast("Falha ao criar utilizador")
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Tem a certeza que pretende eliminar este utilizador?")) return

    try {
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setUsers(users.filter((u) => u.id !== userId))
        toast("Utilizador eliminado com sucesso")
      } else {
        throw new Error("Falha ao eliminar utilizador")
      }
    } catch (error) {
      console.error("Falha ao eliminar utilizador:", error)
      toast("Falha ao eliminar utilizador")
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-800"
      case "CASHIER":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-dark">Utilizadores</h1>
          <p className="text-neutral-medium mt-2">Gerir administradores e caixas</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Adicionar Utilizador
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Utilizador</DialogTitle>
              <DialogDescription>Criar uma conta de administrador ou caixa</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
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
                  placeholder="joao@exemplo.com"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
              <div>
                <Label htmlFor="role">Função</Label>
                <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Selecionar função" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Administrador</SelectItem>
                    <SelectItem value="CASHIER">Caixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddUser} className="w-full">
                Criar Utilizador
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos os Utilizadores</CardTitle>
          <CardDescription>Lista de administradores e caixas</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-neutral-medium">A carregar utilizadores...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-neutral-medium">Nenhum utilizador encontrado</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Adesão</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(user.role)}>{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.emailVerified ? "default" : "outline"}>
                          {user.emailVerified ? "Verificado" : "Pendente"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right space-x-2 flex justify-end">
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 bg-transparent"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Trash2 className="w-4 h-4" />
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
