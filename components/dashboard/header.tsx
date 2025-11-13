"use client"

import { User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { signOut } from "@/lib/auth-client"

interface HeaderProps {
  user: {
    name?: string
    email?: string
    image?: string
  }
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="bg-white border-b border-neutral-200 px-8 py-4 flex items-center justify-between">
      <div className="flex-1" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <User className="w-4 h-4" />
            {user.name || user.email}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Perfil</DropdownMenuItem>
          <DropdownMenuItem>Definições</DropdownMenuItem>
          <DropdownMenuItem onClick={() => signOut()}>Terminar Sessão</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
