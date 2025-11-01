"use client"

import { useInView } from "@/hooks/use-in-view"

type Benefit = {
  icon: string
  title: string
  description: string
  color: string
}

function BenefitCard({ benefit, index }: { benefit: Benefit; index: number }) {
  const { ref, isInView } = useInView({ threshold: 0.3 })

  return (
    <div
      ref={ref}
      className={`p-6 rounded-xl bg-gradient-to-br from-muted to-white border border-border/50 hover:border-primary/50 transition-all duration-500 group cursor-pointer transform hover:scale-105 hover:-translate-y-3 hover:shadow-xl ${
        isInView ? "animate-scale-up" : "opacity-0 scale-95"
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="text-5xl mb-4 group-hover:animate-float transition-transform duration-300">{benefit.icon}</div>
      <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors duration-300">
        {benefit.title}
      </h3>
      <p className="text-sm text-muted-foreground">{benefit.description}</p>
      <div
        className={`mt-4 h-1 w-12 bg-gradient-to-r ${benefit.color} to-transparent rounded-full group-hover:w-full transition-all duration-500`}
      ></div>
    </div>
  )
}

export default function Benefits() {
  const { ref: headerRef, isInView: headerInView } = useInView()

  const benefits = [
    {
      icon: "💧",
      title: "Água 100% Potável",
      description: "Rigorosamente testada e segura para sua família",
      color: "from-primary",
    },
    {
      icon: "🚚",
      title: "Entrega Pontual",
      description: "Receba água no dia e hora combinados com confiabilidade",
      color: "from-secondary",
    },
    {
      icon: "📱",
      title: "Gestão Online",
      description: "Consulte consumo e faturas em tempo real pelo seu dispositivo",
      color: "from-accent",
    },
    {
      icon: "♻️",
      title: "Sustentabilidade",
      description: "Compromisso com práticas ecológicas e responsáveis",
      color: "from-blue-500",
    },
  ]

  return (
    <section id="benefits-section" className="py-10 md:py-12 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={headerRef}
          className={`text-center mb-16 transition-all duration-700 ${headerInView ? "animate-fade-in-up" : "opacity-0 translate-y-[30px]"}`}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-balance text-foreground mb-4">
            Por que escolher a{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">AquaPure</span>?
          </h2>
          <p className="text-lg text-muted-foreground">Oferecemos o melhor em qualidade, confiabilidade e serviço</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => (
            <BenefitCard key={index} benefit={benefit} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
