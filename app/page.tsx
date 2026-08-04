import Benefits from './components/Benefits';
import FAQ from './components/Faq';
import Header from './components/Header';
import HeroSection from './components/Herosection';
import SearchResult from './components/SearchResult';
import HowItWorks from './components/HowItWorks';
import ScienceSection from './components/ScienceSection';
import Testimonials from './components/Testimonials';
import Footer from './components/Footer';
import PendingPaymentChecker from './components/PendingPaymentChecker';


export default function Home() {
  return (
    <>
      <PendingPaymentChecker />
      <Header />
      <HeroSection />
      {/* <ColorShowcase /> */}
      {/* <ScienceSection /> */}
      <Benefits />
      <Testimonials />
      <HowItWorks />
      <SearchResult />
      <FAQ />
      <Footer />
    </>
  );
}
