import Navbar from './components/Navbar';
import Hero from './components/Hero';
import TrustBar from './components/TrustBar';
import About from './components/About';
import Services from './components/Services';
import FeaturedProperties from './components/FeaturedProperties';
import ImageGallery from './components/ImageGallery';
import Locations from './components/Locations';
import WhyChooseUs from './components/WhyChooseUs';
import HomeLoanSupport from './components/HomeLoanSupport';
import Testimonials from './components/Testimonials';
import FAQ from './components/FAQ';
import Contact from './components/Contact';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';

export default function App() {
  return (
    <div className="min-h-screen bg-[#F9F9F7] font-sans text-[#1A1A1A] selection:bg-[#F1EDE4] selection:text-[#1A365D]">
      <Navbar />
      <main>
        <Hero />
        <TrustBar />
        <About />
        <Services />
        <FeaturedProperties />
        <ImageGallery />
        <Locations />
        <WhyChooseUs />
        <HomeLoanSupport />
        <Testimonials />
        <FAQ />
        <Contact />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
