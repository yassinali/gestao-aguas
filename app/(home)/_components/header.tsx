"use client"

import { useState } from "react"
import Link from "next/link"

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-primary/10 shadow-lg">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold animate-pulse-glow">
              A
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              AquaPure
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="#inicio"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors duration-300 relative group"
            >
              Início
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link
              href="#servicos"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors duration-300 relative group"
            >
              Serviços
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link
              href="#sobre"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors duration-300 relative group"
            >
              Sobre Nós
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link
              href="#depoimentos"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors duration-300 relative group"
            >
              Depoimentos
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link
              href="#contactos"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors duration-300 relative group"
            >
              Contactos
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
            </Link>
          </div>

          <div className="hidden md:block">
            <button className="px-6 py-2.5 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-lg font-medium hover:shadow-lg hover:shadow-primary/50 transition-all duration-300 transform hover:scale-105">
              Solicitar Fornecimento
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 text-foreground">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 flex flex-col gap-4 pb-4 animate-fade-in-down">
            <Link href="#inicio" className="text-sm font-medium text-foreground hover:text-primary">
              Início
            </Link>
            <Link href="#servicos" className="text-sm font-medium text-foreground hover:text-primary">
              Serviços
            </Link>
            <Link href="#sobre" className="text-sm font-medium text-foreground hover:text-primary">
              Sobre Nós
            </Link>
            <Link href="#depoimentos" className="text-sm font-medium text-foreground hover:text-primary">
              Depoimentos
            </Link>
            <Link href="#contactos" className="text-sm font-medium text-foreground hover:text-primary">
              Contactos
            </Link>
            <button className="w-full px-4 py-2 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-lg font-medium text-sm hover:shadow-lg transition-all duration-300">
              Solicitar Fornecimento
            </button>
          </div>
        )}
      </nav>
    </header>
  )
}
