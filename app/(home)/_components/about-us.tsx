"use client"

import { useInView } from "@/hooks/use-in-view"
import Image from "next/image"

export default function AboutUs() {
  const { ref: ref1, isInView: isInView1 } = useInView()
  const { ref: ref2, isInView: isInView2 } = useInView()

  return (
    <section id="sobre" className="py-20 md:py-32 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div
            ref={ref1}
            className={`aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 overflow-hidden transition-all duration-700 ${isInView1 ? "animate-slide-in-left" : "opacity-0 translate-x-[-40px]"}`}
          >
            <Image className="w-full h-full object-cover" src={"/professional-team-delivering-water-bottles-to-a-ho.jpg"} fill  alt="Equipa profissional entregando água"/>
   
          </div>

          <div
            ref={ref2}
            className={`flex flex-col gap-6 transition-all duration-700 ${isInView2 ? "animate-fade-in-up" : "opacity-0 translate-y-[30px]"}`}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-balance text-foreground">Sobre a AquaPure</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Com mais de 10 anos de experiência no fornecimento de água potável, a AquaPure é sinônimo de qualidade,
              confiabilidade e excelência no serviço.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Nossa missão é garantir que cada família tenha acesso a água limpa, segura e de qualidade certificada, com
              um serviço transparente e atencioso.
            </p>
            <div className="flex flex-col gap-4 pt-4">
              <div className="flex gap-4 items-start group cursor-pointer">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1 group-hover:bg-primary/30 group-hover:scale-110 transition-all duration-300">
                  <span className="text-primary font-bold">✓</span>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                    Certificação Internacional
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Todos os nossos processos seguem padrões internacionais de qualidade
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start group cursor-pointer">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1 group-hover:bg-primary/30 group-hover:scale-110 transition-all duration-300">
                  <span className="text-primary font-bold">✓</span>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                    Atendimento 24/7
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Nossa equipe está sempre disponível para ajudar quando precisar
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
