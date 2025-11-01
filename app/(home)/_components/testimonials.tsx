"use client"

import { useInView } from "@/hooks/use-in-view"
import Image from "next/image"

type Testimonial = {
  name: string
  role: string
  text: string
  image?: string
}
function TestimonialCard({ testimonial, index }: { testimonial: Testimonial; index: number }) {
  const { ref, isInView } = useInView({ threshold: 0.3 })

  return (
    <div
      ref={ref}
      className={`p-6 rounded-xl bg-white border border-border hover:border-primary/50 transition-all duration-500 group cursor-pointer transform hover:shadow-xl hover:scale-105 hover:-translate-y-2 ${
        isInView ? "animate-scale-up" : "opacity-0 scale-95"
      }`}
      style={{ animationDelay: isInView ? `${index * 150}ms` : "0ms" }}
    >
      <div className="flex gap-2 mb-4 transition-all duration-300">
        {[...Array(5)].map((_, i) => (
          <span
            key={i}
            className="text-accent text-lg group-hover:animate-pop-in"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            ★
          </span>
        ))}
      </div>
      <p className="text-foreground mb-6 leading-relaxed group-hover:text-primary/90 transition-colors">
        {testimonial.text}
      </p>
      <div className="flex items-center gap-4">
        <Image
          src={testimonial.image || "/placeholder.svg"}
          alt={testimonial.name}
          className="w-12 h-12 rounded-full object-cover group-hover:scale-110 transition-transform duration-300"
          width={48} height={48}
        />
        <div>
          <h4 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">
            {testimonial.name}
          </h4>
          <p className="text-xs text-muted-foreground">{testimonial.role}</p>
        </div>
      </div>
    </div>
  )
}

export default function Testimonials() {
  const { ref: headerRef, isInView: headerInView } = useInView()
  const testimonials = [
    {
      name: "Maria Silva",
      role: "Cliente desde 2020",
      text: "A AquaPure transformou a forma como minha família consome água. Serviço impecável e água de qualidade garantida!",
      image: "/professional-woman-headshot.png",
    },
    {
      name: "João Costa",
      role: "Cliente desde 2021",
      text: "Nunca mais me preocupo com qualidade de água. Pontualidade, profissionalismo e transparência são as marcas da AquaPure.",
      image: "/professional-man-headshot.png",
    },
    {
      name: "Ana Oliveira",
      role: "Cliente desde 2019",
      text: "Melhor decisão que tomei foi confiar na AquaPure. Recomendo para todas as minhas amigas e vizinhas.",
      image: "/professional-woman-smiling-headshot.png",
    },
  ]

  return (
    <section id="depoimentos" className="py-20 md:py-32 bg-muted">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={headerRef}
          className={`text-center mb-16 transition-all duration-700 ${headerInView ? "animate-fade-in-up" : "opacity-0 translate-y-[30px]"}`}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-balance text-foreground mb-4">
            O Que Dizem Nossos Clientes
          </h2>
          <p className="text-lg text-muted-foreground">Mais de 100 famílias confiam em nós</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={index} testimonial={testimonial} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
