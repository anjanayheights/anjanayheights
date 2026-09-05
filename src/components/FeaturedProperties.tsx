import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const properties = [
  { id: 1, name: '100 Beds Hospital', type: 'Hospital', location: 'Faridabad', price: '₹55 Cr', area: '3000 sq yard', image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80' },
  { id: 2, name: '110 Bigha Commercial Land', type: 'Commercial Land', location: 'Haridwar', price: '₹47 Lakhs/Bigha', area: '110 Bigha', image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80' },
  { id: 3, name: '710 sq ft Flat', type: 'Flat', location: 'Sector 1, Aminabad, Greater Noida', price: '₹40 Lakhs', area: '710 sq ft', image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=800&q=80' },
];

function whatsappUrl(p: typeof properties[number]) {
  const text = `Hello Anjanay Heights, I am interested in ${p.name} in ${p.location}. Please share the property details and site visit availability. My budget is:`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export default function FeaturedProperties() {
  const [filterType, setFilterType] = useState('All Types');
  const [filterLocation, setFilterLocation] = useState('All Locations');
  const [filterPrice, setFilterPrice] = useState('All Prices');

  const filteredProperties = properties.filter(prop => {
    if (filterType !== 'All Types' && prop.type !== filterType) return false;
    if (filterLocation !== 'All Locations' && !prop.location.includes(filterLocation)) return false;
    if (filterPrice !== 'All Prices') {
      if (filterPrice === 'Under ₹1 Cr' && prop.id === 1) return false;
      if (filterPrice === '₹1 Cr - ₹3 Cr' && prop.id !== 1) return false;
      if (filterPrice === 'Above ₹3 Cr' && prop.id !== 1) return false;
    }
    return true;
  });

  return (
    <section className="py-20 bg-[#F9F9F7] border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="border-l-4 border-[#C2A36B] pl-8 py-2">
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-4">Live Inventory Showcase</div>
            <h2 className="text-3xl md:text-4xl font-serif text-[#1A365D] font-light">Exclusive Properties</h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 border border-gray-200 shadow-sm">
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-4 py-2 bg-white border border-gray-200 text-sm text-[#1A365D]"><option>All Types</option><option>Hospital</option><option>Commercial Land</option><option>Flat</option></select>
            <select value={filterLocation} onChange={e => setFilterLocation(e.target.value)} className="px-4 py-2 bg-white border border-gray-200 text-sm text-[#1A365D]"><option>All Locations</option><option>Faridabad</option><option>Haridwar</option><option>Greater Noida</option></select>
            <select value={filterPrice} onChange={e => setFilterPrice(e.target.value)} className="px-4 py-2 bg-white border border-gray-200 text-sm text-[#1A365D]"><option>All Prices</option><option>Under ₹1 Cr</option><option>₹1 Cr - ₹3 Cr</option><option>Above ₹3 Cr</option></select>
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredProperties.map((prop, idx) => (
              <motion.div layout key={prop.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.4, delay: idx * 0.1 }} className="group relative overflow-hidden border border-gray-200 bg-white">
                <div className="aspect-[3/4] relative overflow-hidden">
                  <img src={prop.image} alt={prop.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-[#1A365D]/90 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-between p-6">
                    <div><div className="text-[10px] font-bold uppercase tracking-widest text-[#C2A36B] mb-2">{prop.type}</div><h3 className="text-xl font-serif text-white mb-1">{prop.name}</h3><p className="text-sm text-white/80">{prop.location}</p></div>
                    <div>
                      <div className="space-y-3 border-t border-white/20 pt-4 mb-6"><div className="flex justify-between text-xs text-white/90"><span>Area</span><span className="font-medium">{prop.area}</span></div><div className="flex justify-between text-xs text-white/90"><span>Price</span><span className="font-bold text-[#C2A36B]">{prop.price}</span></div></div>
                      <a href={whatsappUrl(prop)} target="_blank" rel="noreferrer" className="block w-full text-center border border-[#C2A36B] text-[#C2A36B] py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-[#C2A36B] hover:text-[#1A365D]">WhatsApp for Details</a>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-white p-5 border-t border-gray-200 group-hover:translate-y-full transition-transform duration-500"><div className="text-[10px] font-bold uppercase tracking-widest text-[#C2A36B] mb-1">{prop.type}</div><h3 className="text-lg font-serif text-[#1A365D] mb-1 truncate">{prop.name}</h3><div className="flex justify-between items-center mt-2"><span className="text-xs text-gray-500">{prop.location}</span><span className="text-xs font-bold text-[#1A365D]">{prop.price}</span></div></div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
