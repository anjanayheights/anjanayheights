import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'About', href: '#about' },
    { name: 'Properties', href: '#properties' },
    { name: 'Locations', href: '#locations' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white border-b border-gray-200 py-3 shadow-sm' : 'bg-white border-b border-gray-200 py-5'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 flex justify-between items-center">
        <a href="#" className="flex flex-col">
          <span className="font-serif font-bold text-2xl tracking-tight text-[#1A365D]">
            ANJANAY <span className="text-[#C2A36B]">HEIGHTS</span>
          </span>
          <span className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold hidden sm:block mt-0.5">Premium Real Estate Consultants</span>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-6">
          <div className="flex space-x-6 mr-4">
            {navLinks.map((link) => (
              <a key={link.name} href={link.href} className="text-[11px] font-bold uppercase tracking-widest text-gray-500 hover:text-[#C2A36B] transition-colors">
                {link.name}
              </a>
            ))}
          </div>
          <div className="hidden lg:flex flex-col items-end mr-6">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Call an Expert</span>
            <span className="text-sm font-bold text-[#1A365D]">+91 92897 71222</span>
          </div>
          <a href="https://wa.me/919289771222" className="bg-[#1A365D] text-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-[#2D3748] transition-colors">
            Talk on WhatsApp
          </a>
        </nav>

        {/* Mobile Menu Toggle */}
        <button className="md:hidden text-[#1A365D]" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-200"
          >
            <div className="px-4 py-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-[11px] font-bold uppercase tracking-widest text-[#1A365D] border-b border-gray-100 pb-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              <a href="https://wa.me/919289771222" className="bg-[#1A365D] text-white px-5 py-3 text-xs font-bold uppercase tracking-wider text-center mt-4">
                Talk on WhatsApp
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
