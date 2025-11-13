"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Droplet, BarChart3, Users, FileText, Settings, LogOut, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { signOut } from "@/lib/auth-client"

interface SidebarProps {
  userRole: string
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname()

  const getMenuItems = () => {
    const commonItems = [{ href: "/dashboard", label: "Painel", icon: BarChart3 }]

    const adminItems = [
      ...commonItems,
      { href: "/dashboard/clients", label: "Clientes", icon: Users },
      { href: "/dashboard/readings", label: "Leituras de Contadores", icon: FileText },
      { href: "/dashboard/meters", label: "Contadores", icon: FileText },
      { href: "/dashboard/invoices", label: "Faturas", icon: FileText },
      { href: "/dashboard/payments", label: "Pagamentos", icon: CreditCard },
      { href: "/dashboard/my-invoices", label: "As Minhas Faturas", icon: FileText },
      { href: "/dashboard/my-meters", label: "Os Meus Contadores", icon: FileText },
      { href: "/dashboard/users", label: "Utilizadores", icon: Users },
      { href: "/dashboard/company", label: "Configurações", icon: Settings },
    ]

    const cashierItems = [
      ...commonItems,
      { href: "/dashboard/readings", label: "Leituras de Contadores", icon: FileText },
      { href: "/dashboard/invoices", label: "Faturas", icon: FileText },
      { href: "/dashboard/payments", label: "Pagamentos", icon: CreditCard },
      { href: "/dashboard/my-meters", label: "Os Meus Contadores", icon: FileText },
      { href: "/dashboard/my-invoices", label: "As Minhas Faturas", icon: FileText },
    ]

    const clientItems = [
      ...commonItems,
      { href: "/dashboard/my-invoices", label: "As Minhas Faturas", icon: FileText },
      { href: "/dashboard/my-meters", label: "Os Meus Contadores", icon: FileText },
    ]

    if (userRole === "ADMIN") return adminItems
    if (userRole === "CASHIER") return cashierItems
    return clientItems
  }

  const menuItems = getMenuItems()

  return (
    <div className="w-64 bg-white border-r border-neutral-200 flex flex-col h-screen">
      <div className="p-6 border-b border-neutral-200">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Droplet className="w-8 h-8 text-primary" />
          <h2 className="text-xl font-bold text-neutral-dark">AquaFlow</h2>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive ? "bg-primary text-white" : "text-neutral-dark hover:bg-neutral-light",
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-neutral-200">
        <Button onClick={() => signOut()} variant="outline" className="w-full justify-start gap-2">
          <LogOut className="w-5 h-5" />
          Terminar Sessão
        </Button>
      </div>
    </div>
  )
}
