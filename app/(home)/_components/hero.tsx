export default function Hero() {
  return (
    <section
      id="inicio"
      className="relative py-10 md:py10 bg-gradient-to-br from-primary/5 via-white to-secondary/5 overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10 animate-float"></div>
      <div
        className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl -z-10 animate-float"
        style={{ animationDelay: "1s" }}
      ></div>
      <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-accent/10 rounded-full blur-3xl -z-10"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-6 animate-fade-in-up">
            <div className="inline-block w-fit px-4 py-2 bg-primary/10 rounded-full">
              <span className="text-sm font-semibold text-primary">✨ Qualidade Garantida</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-balance leading-tight text-foreground">
              Água Potável{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Direto à Sua Casa
              </span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
              Serviço confiável, água de qualidade premium e faturação transparente para o seu conforto. Entrega
              garantida, sempre na hora combinada.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button className="px-8 py-3 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-lg font-semibold hover:shadow-lg hover:shadow-primary/50 transition-all duration-300 transform hover:scale-105">
                Peça Agora
              </button>
              <button className="px-8 py-3 bg-white border-2 border-primary text-primary rounded-lg font-semibold hover:bg-primary/5 transition-all duration-300 hover:border-secondary">
                Saiba Mais
              </button>
            </div>
          </div>

          <div className="relative animate-slide-in-right">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl blur-2xl"></div>
            <div className="relative aspect-square rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center overflow-hidden shadow-2xl">
              <img
                src="/modern-water-faucet-crystal-water-droplets.jpg"
                alt="Água cristalina saindo de uma torneira moderna"
                className="w-full h-full object-cover rounded-2xl"
              />
            </div>
            <div className="absolute -bottom-4 -right-4 bg-gradient-to-r from-accent to-secondary text-accent-foreground px-6 py-3 rounded-lg shadow-lg font-semibold animate-scale-up">
              100% Potável
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
