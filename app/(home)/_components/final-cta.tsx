"use client"

import { useInView } from "@/hooks/use-in-view"

export default function FinalCTA() {
  const { ref, isInView } = useInView()

  return (
    <section
      ref={ref}
      className={`py-20 md:py-32 bg-gradient-to-r from-primary to-accent text-primary-foreground transition-all duration-1000 ${isInView ? "animate-fade-in-up" : "opacity-0 translate-y-[30px]"}`}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-balance mb-4 hover:scale-105 transition-transform duration-300">
          Confie em quem leva qualidade e transparência até à sua torneira
        </h2>
        <p className="text-lg mb-8 opacity-95 hover:opacity-100 transition-opacity duration-300">
          Junte-se a milhares de famílias que já desfrutam de água potável certificada com nosso serviço confiável
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="px-8 py-3.5 bg-white text-primary rounded-lg font-semibold hover:bg-white/90 transition-all duration-300 transform hover:scale-110 hover:shadow-xl hover:shadow-black/30 active:scale-95">
            Solicite Agora o Fornecimento
          </button>
          <button className="px-8 py-3.5 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/20 transition-all duration-300 transform hover:scale-110 hover:shadow-xl hover:shadow-black/30 active:scale-95 backdrop-blur-sm">
            Fale com Nosso Atendimento
          </button>
        </div>
      </div>
    </section>
  )
}
