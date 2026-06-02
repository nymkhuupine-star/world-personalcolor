import Benefits from './components/Benefits';
import FAQ from './components/Faq';
import Header from './components/Header';
import HeroSection from './components/Herosection';
import Payment from './components/Payment';
import SearchResult from './components/SearchResult';
import Testimonials from './components/Testimonials';
import Footer from './components/Footer';

export default function Home() {
  return (
    <>
      <Header />
      <HeroSection />
      <Benefits />
      <Testimonials />
      {/* <Payment /> */}
      <SearchResult />
      <FAQ />
      <Footer />
    </>
  );
}
