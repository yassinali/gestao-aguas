"use client"

import { useInView } from "@/hooks/use-in-view"

type Step = {
  number: number
  title: string
  description: string
}

function StepCard({ step, index, totalSteps }: { step: Step; index: number; totalSteps: number }) {
  const { ref, isInView } = useInView({ threshold: 0.3 })

  return (
    <div
      ref={ref}
      className={`relative flex flex-col transition-all duration-700 ${
        isInView ? "animate-slide-in-bottom" : "opacity-0 translate-y-[50px]"
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Connection line */}
      {index < totalSteps - 1 && (
        <div className="hidden md:block absolute top-12 left-[calc(50%+24px)] right-[-50%] h-0.5 bg-gradient-to-r from-primary/50 to-primary/20"></div>
      )}

      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground flex items-center justify-center font-bold text-lg relative z-10 transition-all duration-300 hover:scale-125 hover:shadow-lg hover:shadow-primary/50 cursor-pointer transform hover:-translate-y-1">
          {step.number}
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-foreground mb-2 hover:text-primary transition-colors cursor-pointer">
            {step.title}
          </h3>
          <p className="text-sm text-muted-foreground">{step.description}</p>
        </div>
      </div>
    </div>
  )
}

export default function HowItWorks() {
  const { ref: headerRef, isInView: headerInView } = useInView()

  const steps = [
    {
      number: 1,
      title: "Solicite o Fornecimento",
      description: "Preencha o formulário com seus dados e quantidade desejada",
    },
    {
      number: 2,
      title: "Agendamento e Entrega",
      description: "Nossa equipe agenda e entrega no dia e hora combinados",
    },
    {
      number: 3,
      title: "Monitoramento Automático",
      description: "O consumo é monitorado automaticamente em tempo real",
    },
    {
      number: 4,
      title: "Fatura e Pagamento",
      description: "A fatura é gerada e enviada por e-mail mensalmente",
    },
  ]

  return (
    <section id="como-funciona" className="py-20 md:py-32 bg-muted">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={headerRef}
          className={`text-center mb-16 transition-all duration-700 ${headerInView ? "animate-fade-in-up" : "opacity-0 translate-y-[30px]"}`}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-balance text-foreground mb-4">Como Funciona</h2>
          <p className="text-lg text-muted-foreground">Processo simples e transparente em 4 etapas</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <StepCard key={index} step={step} index={index} totalSteps={steps.length} />
          ))}
        </div>
      </div>
    </section>
  )
}
