import type React from "react"
import type { Metadata } from "next"
import { Poppins } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "AquaFlow - Fornecimento de Água Potável",
  description: "Serviço confiável de fornecimento de água potável com faturação automática e transparente",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt">
      <body className={`${poppins} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
