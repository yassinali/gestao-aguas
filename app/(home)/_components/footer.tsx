export default function Footer() {
  return (
    <footer id="contactos" className="bg-foreground text-background py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Company Info */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                A
              </div>
              <span className="font-bold">AquaPure</span>
            </div>
            <p className="text-sm opacity-80">Fornecimento de água potável com qualidade e transparência</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Links Úteis</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li>
                <a href="#inicio" className="hover:opacity-100 transition-opacity">
                  Início
                </a>
              </li>
              <li>
                <a href="#servicos" className="hover:opacity-100 transition-opacity">
                  Serviços
                </a>
              </li>
              <li>
                <a href="#sobre" className="hover:opacity-100 transition-opacity">
                  Sobre Nós
                </a>
              </li>
              <li>
                <a href="#depoimentos" className="hover:opacity-100 transition-opacity">
                  Testemunhos
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li>
                <a href="#" className="hover:opacity-100 transition-opacity">
                  Política de Privacidade
                </a>
              </li>
              <li>
                <a href="#" className="hover:opacity-100 transition-opacity">
                  Termos de Serviço
                </a>
              </li>
              <li>
                <a href="#" className="hover:opacity-100 transition-opacity">
                  Contrato de Fornecimento
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold mb-4">Contactos</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li>
                <a href="tel:+551234567890" className="hover:opacity-100 transition-opacity">
                  +258 (84) 6109813
                </a>
              </li>
              <li>
                <a href="mailto:mozsoftware@gmail.com" className="hover:opacity-100 transition-opacity">
                  mozsoftware@gmail.com
                </a>
              </li>
              <li>
                Matola
              </li>
            </ul>
          </div>
        </div>

        {/* Social Links */}
        <div className="border-t border-background/20 pt-8 flex flex-col sm:flex-row items-center justify-between">
          <p className="text-sm opacity-80">© 2025 AquaPure. Todos os direitos reservados.</p>
          <div className="flex gap-6 mt-4 sm:mt-0">
            <a href="https://fb.me/mozsoftware" target="_blank" className="text-lg hover:opacity-80 transition-opacity">
              f
            </a>
            <a href="https://x.com/mozsoftware" target="_blank" className="text-lg hover:opacity-80 transition-opacity">
              𝕏
            </a>
            <a href="https://www.linkedin.com/in/mufamaju-ali-630a4295" target="_blank" className="text-lg hover:opacity-80 transition-opacity">
              in
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
