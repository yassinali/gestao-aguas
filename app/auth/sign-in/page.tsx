"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Droplet } from "lucide-react"
import { signIn } from "@/lib/auth-client"

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn.email({
        email,
        password,
      })

      if (result.error) {
        setError(result.error.message || "Falha no início de sessão")
      } else {
        router.push("/dashboard")
      }
    } catch (err) {
      setError("Ocorreu um erro. Por favor, tente novamente.")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-neutral-200">
      <CardHeader className="space-y-2 text-center pb-8">
        <div className="flex justify-center mb-4">
          <Droplet className="w-8 h-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">AquaFlow</CardTitle>
        <CardDescription>Inicie sessão na sua conta</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Palavra-passe</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <Button type="submit" className="w-full cursor-pointer" disabled={isLoading}>
            {isLoading ? "A iniciar sessão..." : "Iniciar sessão"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <p className="text-neutral-medium">
            Ainda não tem uma conta?{" "}
            <Link href="/auth/sign-up" className="text-primary font-semibold hover:underline">
              Registe-se
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
