import Header from "@/app/(home)/_components/header"
import Hero from "@/app/(home)/_components/hero"
import Benefits from "@/app/(home)/_components/benefits"
import HowItWorks from "@/app/(home)/_components/how-it-works"
import AboutUs from "@/app/(home)/_components/about-us"
import Testimonials from "@/app/(home)/_components/testimonials"
import FinalCTA from "@/app/(home)/_components/final-cta"
import Footer from "@/app/(home)/_components/footer"

export default function Home() {
  return (
    <main className="bg-background">
      <Header />
      <Hero />
      <Benefits />
      <HowItWorks />
      <AboutUs />
      <Testimonials />
      <FinalCTA />
      <Footer />
    </main>
  )
}
