import Benefits from './components/Benefits';
import FAQ from './components/Faq';
import HeroSection from './components/Herosection';
import Pricing from './components/Pricing';
import Testimonials from './components/Testimonials';
import Footer from './components/Footer';

export default function Home() {
  return (
    <>
      <HeroSection />
      <Benefits />
      <Testimonials />
      <Pricing />
      <FAQ />
      <Footer />
    </>
  );
}
