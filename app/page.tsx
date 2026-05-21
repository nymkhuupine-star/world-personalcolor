import Benefits from './components/Benefits';
import FAQ from './components/Faq';
import Header from './components/Header';
import HeroSection from './components/Herosection';
import Testimonials from './components/Testimonials';
import Footer from './components/Footer';

export default function Home() {
  return (
    <>
      <Header />
      <HeroSection />
      <Benefits />
      <Testimonials />
      <FAQ />
      <Footer />
    </>
  );
}
