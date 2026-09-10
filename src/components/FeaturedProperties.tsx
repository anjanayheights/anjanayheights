import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const WHATSAPP = '919289771222';
const SOURCE = 'https://housing.com/in/buy/greater-noida/projects/';

type Property = {
  id: string;
  name: string;
  type: string;
  location: string;
  price: string;
  area: string;
  config: string;
  image: string;
  source: string;
  sourceLabel: string;
  note: string;
};

// Research shortlist checked against current public project data. Prices/availability are indicative
// and must be reconfirmed with the builder/seller before a customer is promised a unit.
const properties: Property[] = [
  { id: 'market-paradise-shree-ram', name: 'Paradise Shree Ram Vatika', type: 'Villa', location: 'Noida Extension, Greater Noida', price: '₹58.5 L – ₹73.01 L', area: '675 sq ft', config: '2.5 & 3.5 BHK', image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=80', source: SOURCE, sourceLabel: 'Housing.com', note: 'Indicative market price; availability to be reconfirmed.' },
  { id: 'market-vihaan-wardania', name: 'Vihaan Wardania', type: 'Residential', location: 'Noida Extension, Greater Noida', price: '₹47.99 L – ₹64.99 L', area: '1100 sq ft', config: 'Residential flats', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80', source: SOURCE, sourceLabel: 'Housing.com', note: 'Indicative market price; availability to be reconfirmed.' },
  { id: 'market-crc-joyous', name: 'CRC Joyous', type: 'Residential', location: 'Techzone 4, Greater Noida West', price: '₹1.32 Cr – ₹2.26 Cr', area: '1040 sq ft+', config: 'Residential flats', image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=900&q=80', source: SOURCE, sourceLabel: 'Housing.com', note: 'Indicative market price; availability to be reconfirmed.' },
  { id: 'market-godrej-arden', name: 'Godrej Arden', type: 'Residential', location: 'Sigma III, Greater Noida', price: '₹2.30 Cr – ₹4.40 Cr', area: '1375 sq ft+', config: 'Premium residences', image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=900&q=80', source: SOURCE, sourceLabel: 'Housing.com', note: 'Indicative market price; availability to be reconfirmed.' },
  { id: 'market-nbcc-aspire', name: 'NBCC Aspire Eternia Residences', type: 'Residential', location: 'Techzone 4, Greater Noida', price: '₹1.71 Cr – ₹2.33 Cr', area: '—', config: '3 & 4 BHK', image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80', source: 'https://www.magicbricks.com/residential-projects-in--greater-noida-nprid', sourceLabel: 'MagicBricks', note: 'Under construction; price/availability to be reconfirmed.' },
  { id: 'direct-hospital-faridabad', name: '100 Beds Hospital', type: 'Hospital', location: 'Faridabad', price: '₹55 Cr', area: '3000 sq yard', config: '100 beds', image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=900&q=80', source: '', sourceLabel: 'Anjanay Heights direct inventory', note: 'Direct inventory — contact sales for current availability.' },
  { id: 'direct-commercial-haridwar', name: '110 Bigha Commercial Land', type: 'Commercial Land', location: 'Haridwar', price: '₹47 Lakhs/Bigha', area: '110 Bigha', config: 'Commercial land', image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=900&q=80', source: '', sourceLabel: 'Anjanay Heights direct inventory', note: 'Direct inventory — contact sales for current availability.' },
  { id: 'direct-flat-greater-noida', name: '710 sq ft Flat', type: 'Flat', location: 'Sector 1, Aminabad, Greater Noida', price: '₹40 Lakhs', area: '710 sq ft', config: 'Flat', image: 'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=900&q=80', source: '', sourceLabel: 'Anjanay Heights direct inventory', note: 'Direct inventory — contact sales for current availability.' },
];

function whatsappUrl(p: Property) {
  const text = `Hello Anjanay Heights, I am interested in ${p.name} in ${p.location}. I saw the indicative price ${p.price}. Please confirm current availability, exact price and site visit options. My budget is:`;
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
}

export default function FeaturedProperties() {
  const [filterType, setFilterType] = useState('All Types');
  const [filterLocation, setFilterLocation] = useState('All Locations');
  const [filterPrice, setFilterPrice] = useState('All Prices');

  const filteredProperties = useMemo(() => properties.filter((prop) => {
    if (filterType !== 'All Types' && prop.type !== filterType) return false;
    if (filterLocation !== 'All Locations' && !prop.location.includes(filterLocation)) return false;
    if (filterPrice !== 'All Prices') {
      const lower = prop.price.toLowerCase();
      const under1 = lower.includes('47.99') || lower.includes('58.5') || lower.includes('64.99') || lower.includes('73.01') || lower.includes('40 lakhs');
      if (filterPrice === 'Under ₹1 Cr' && !under1) return false;
      if (filterPrice === '₹1 Cr – ₹3 Cr' && !lower.includes('1.') && !lower.includes('2.')) return false;
      if (filterPrice === 'Above ₹3 Cr' && !lower.includes('3.') && !lower.includes('4.') && !lower.includes('55 cr')) return false;
    }
    return true;
  }), [filterType, filterLocation, filterPrice]);

  return (
    <section id="properties" className="py-20 bg-[#F9F9F7] border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
          <div className="border-l-4 border-[#C2A36B] pl-8 py-2">
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-4">Fresh property research + direct inventory</div>
            <h2 className="text-3xl md:text-4xl font-serif text-[#1A365D] font-light">Properties Worth Enquiring About</h2>
            <p className="mt-3 max-w-2xl text-sm text-gray-600">We research active NCR projects and keep direct listings here. Market prices are indicative — Anjanay Heights will confirm the exact unit, price and availability before your site visit.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 border border-gray-200 shadow-sm">
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-4 py-2 bg-white border border-gray-200 text-sm text-[#1A365D]"><option>All Types</option><option>Residential</option><option>Villa</option><option>Flat</option><option>Hospital</option><option>Commercial Land</option></select>
            <select value={filterLocation} onChange={e => setFilterLocation(e.target.value)} className="px-4 py-2 bg-white border border-gray-200 text-sm text-[#1A365D]"><option>All Locations</option><option>Noida Extension</option><option>Greater Noida West</option><option>Greater Noida</option><option>Faridabad</option><option>Haridwar</option></select>
            <select value={filterPrice} onChange={e => setFilterPrice(e.target.value)} className="px-4 py-2 bg-white border border-gray-200 text-sm text-[#1A365D]"><option>All Prices</option><option>Under ₹1 Cr</option><option>₹1 Cr – ₹3 Cr</option><option>Above ₹3 Cr</option></select>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between text-xs text-gray-500">
          <span>{filteredProperties.length} options in the current shortlist</span>
          <span>Research checked: 11 Sep 2026</span>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredProperties.map((prop, idx) => (
              <motion.div layout key={prop.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.4, delay: idx * 0.05 }} className="group relative overflow-hidden border border-gray-200 bg-white shadow-sm">
                <div className="aspect-[3/4] relative overflow-hidden">
                  <img src={prop.image} alt={`${prop.name} representative property image`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute top-4 left-4 bg-white/95 px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-[#1A365D]">{prop.sourceLabel}</div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-5 pt-16">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[#C2A36B] mb-1">{prop.type}</div>
                    <h3 className="text-xl font-serif text-white">{prop.name}</h3>
                    <p className="text-sm text-white/85 mt-1">{prop.location}</p>
                  </div>
                  <div className="absolute inset-0 bg-[#1A365D]/95 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-6">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-[#C2A36B] mb-2">{prop.type}</div>
                      <h3 className="text-xl font-serif text-white mb-1">{prop.name}</h3>
                      <p className="text-sm text-white/80">{prop.location}</p>
                      <p className="text-xs text-white/70 mt-4">{prop.note}</p>
                    </div>
                    <div>
                      <div className="space-y-3 border-t border-white/20 pt-4 mb-5">
                        <div className="flex justify-between text-xs text-white/90"><span>Configuration</span><span className="font-medium text-right ml-4">{prop.config}</span></div>
                        <div className="flex justify-between text-xs text-white/90"><span>Area</span><span className="font-medium">{prop.area}</span></div>
                        <div className="flex justify-between text-xs text-white/90"><span>Indicative price</span><span className="font-bold text-[#C2A36B] text-right ml-4">{prop.price}</span></div>
                      </div>
                      <a href={whatsappUrl(prop)} target="_blank" rel="noreferrer" className="block w-full text-center bg-[#C2A36B] text-[#1A365D] py-3 text-[10px] font-bold uppercase tracking-widest hover:opacity-90">Check Availability on WhatsApp</a>
                      {prop.source && <a href={prop.source} target="_blank" rel="noreferrer" className="block w-full text-center mt-2 border border-white/30 text-white py-2 text-[9px] font-bold uppercase tracking-widest hover:bg-white/10">View public source</a>}
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#C2A36B] mb-1">{prop.type}</div>
                  <h3 className="text-lg font-serif text-[#1A365D] mb-1 truncate">{prop.name}</h3>
                  <div className="flex justify-between items-center gap-3 mt-2"><span className="text-xs text-gray-500 truncate">{prop.location}</span><span className="text-xs font-bold text-[#1A365D] text-right">{prop.price}</span></div>
                  <a href={whatsappUrl(prop)} target="_blank" rel="noreferrer" className="mt-4 block w-full text-center border border-[#1A365D] text-[#1A365D] py-2.5 text-[9px] font-bold uppercase tracking-widest hover:bg-[#1A365D] hover:text-white">Ask Sales Team</a>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
