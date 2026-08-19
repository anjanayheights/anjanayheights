import { motion } from 'motion/react';

export default function Locations() {
  const locations = [
    {
      name: "Central Noida",
      desc: "Premium residential developments with excellent metro connectivity, schools, hospitals, shopping destinations, and business districts."
    },
    {
      name: "Noida Extension",
      desc: "Modern townships featuring affordable luxury apartments, villas, and commercial investment opportunities with rapid infrastructure growth."
    },
    {
      name: "Greater Noida",
      desc: "Integrated smart city developments offering premium residential communities, educational institutions, IT parks, and industrial hubs."
    },
    {
      name: "Greater Noida West",
      desc: "One of the fastest-growing real estate destinations with luxury housing, commercial projects, and outstanding investment potential."
    }
  ];

  return (
    <section id="locations" className="py-20 bg-[#1A365D] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 border-l-4 border-[#C2A36B] pl-8 py-2">
          <div className="text-[10px] text-[#C2A36B] font-bold uppercase tracking-widest mb-4">Prime Destinations</div>
          <h2 className="text-3xl md:text-4xl font-serif font-light">
            Locations We Cover
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-px bg-white/10 border border-white/10">
          {locations.map((loc, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-[#1A365D] p-10 hover:bg-white/5 transition-colors border border-white/5"
            >
              <h3 className="text-xl font-serif text-white mb-4">{loc.name}</h3>
              <p className="text-sm text-white/70 leading-relaxed font-light">
                {loc.desc}
              </p>
              <div className="mt-8 text-[10px] font-bold uppercase tracking-widest text-[#C2A36B]">Explore Region →</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
