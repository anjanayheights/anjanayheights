import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function FeaturedProperties() {
  const [filterType, setFilterType] = useState('All Types');
  const [filterLocation, setFilterLocation] = useState('All Locations');
  const [filterPrice, setFilterPrice] = useState('All Prices');

  const properties = [
    {
      id: 1,
      name: "The Sapphire Residences",
      type: "Residential",
      location: "Central Noida",
      price: "Starts ₹1.5 Cr",
      priceValue: 150,
      image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      details: {
        config: "3 & 4 BHK Premium Apartments",
        status: "Under Construction",
        area: "1800 - 2500 sq.ft."
      }
    },
    {
      id: 2,
      name: "Capital Business Park",
      type: "Commercial",
      location: "Greater Noida",
      price: "Starts ₹80 Lakhs",
      priceValue: 80,
      image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      details: {
        config: "Premium Office Spaces",
        status: "Ready to Move",
        area: "500 - 2000 sq.ft."
      }
    },
    {
      id: 3,
      name: "Oasis Luxury Villas",
      type: "Residential",
      location: "Noida Extension",
      price: "Starts ₹3.2 Cr",
      priceValue: 320,
      image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      details: {
        config: "4 & 5 BHK Independent Villas",
        status: "New Launch",
        area: "3500 - 5000 sq.ft."
      }
    },
    {
      id: 4,
      name: "Eminence High Street",
      type: "Commercial",
      location: "Greater Noida West",
      price: "Starts ₹60 Lakhs",
      priceValue: 60,
      image: "https://images.unsplash.com/photo-1555636222-cae831e670b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      details: {
        config: "Retail Shops & Food Court",
        status: "Under Construction",
        area: "200 - 1000 sq.ft."
      }
    }
  ];

  const filteredProperties = properties.filter(prop => {
    if (filterType !== 'All Types' && prop.type !== filterType) return false;
    if (filterLocation !== 'All Locations' && prop.location !== filterLocation) return false;
    
    if (filterPrice !== 'All Prices') {
      if (filterPrice === 'Under ₹1 Cr' && prop.priceValue >= 100) return false;
      if (filterPrice === '₹1 Cr - ₹3 Cr' && (prop.priceValue < 100 || prop.priceValue > 300)) return false;
      if (filterPrice === 'Above ₹3 Cr' && prop.priceValue <= 300) return false;
    }
    return true;
  });

  return (
    <section className="py-20 bg-[#F9F9F7] border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="border-l-4 border-[#C2A36B] pl-8 py-2">
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-4">Featured Showcase</div>
            <h2 className="text-3xl md:text-4xl font-serif text-[#1A365D] font-light">
              Exclusive Properties
            </h2>
          </div>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 border border-gray-200 shadow-sm">
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 text-sm text-[#1A365D] focus:outline-none focus:border-[#C2A36B]"
            >
              <option>All Types</option>
              <option>Residential</option>
              <option>Commercial</option>
            </select>
            <select 
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 text-sm text-[#1A365D] focus:outline-none focus:border-[#C2A36B]"
            >
              <option>All Locations</option>
              <option>Central Noida</option>
              <option>Noida Extension</option>
              <option>Greater Noida</option>
              <option>Greater Noida West</option>
            </select>
            <select 
              value={filterPrice}
              onChange={(e) => setFilterPrice(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 text-sm text-[#1A365D] focus:outline-none focus:border-[#C2A36B]"
            >
              <option>All Prices</option>
              <option>Under ₹1 Cr</option>
              <option>₹1 Cr - ₹3 Cr</option>
              <option>Above ₹3 Cr</option>
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatePresence>
          {filteredProperties.map((prop, idx) => (
            <motion.div 
              layout
              key={prop.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="group relative overflow-hidden border border-gray-200 bg-white cursor-pointer"
            >
              <div className="aspect-[3/4] relative overflow-hidden">
                <img 
                  src={prop.image} 
                  alt={prop.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                
                {/* Dark overlay that appears on hover */}
                <div className="absolute inset-0 bg-[#1A365D]/90 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-between p-6">
                  
                  <div className="transform -translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[#C2A36B] mb-2">{prop.type}</div>
                    <h3 className="text-xl font-serif text-white mb-1">{prop.name}</h3>
                    <p className="text-sm text-white/80">{prop.location}</p>
                  </div>

                  <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <div className="space-y-3 border-t border-white/20 pt-4 mb-6">
                      <div className="flex justify-between items-start text-xs text-white/90">
                        <span className="uppercase tracking-wider text-[9px] text-white/60">Config</span>
                        <span className="font-medium text-right max-w-[60%] leading-tight">{prop.details.config}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-white/90">
                        <span className="uppercase tracking-wider text-[9px] text-white/60">Area</span>
                        <span className="font-medium text-right">{prop.details.area}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-white/90">
                        <span className="uppercase tracking-wider text-[9px] text-white/60">Status</span>
                        <span className="font-medium text-right">{prop.details.status}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-white/90">
                        <span className="uppercase tracking-wider text-[9px] text-white/60">Price</span>
                        <span className="font-bold text-[#C2A36B] text-right">{prop.price}</span>
                      </div>
                    </div>
                    <button className="w-full border border-[#C2A36B] text-[#C2A36B] py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-[#C2A36B] hover:text-[#1A365D] transition-colors">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Default visible bottom bar (hides on hover) */}
              <div className="absolute bottom-0 left-0 right-0 bg-white p-5 border-t border-gray-200 transform group-hover:translate-y-full transition-transform duration-500">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#C2A36B] mb-1">{prop.type}</div>
                <h3 className="text-lg font-serif text-[#1A365D] mb-1 truncate">{prop.name}</h3>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">{prop.location}</span>
                  <span className="text-xs font-bold text-[#1A365D]">{prop.price}</span>
                </div>
              </div>
            </motion.div>
          ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
