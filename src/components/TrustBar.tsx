import { motion } from 'motion/react';

export default function TrustBar() {
  const partners = [
    "RERA APPROVED", "PREMIUM LOCATIONS", "LUXURY LIVING", "SMART INVESTMENTS", "HEALTHCARE PROJECTS"
  ];

  return (
    <section className="bg-white border-b border-gray-200 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-center md:justify-between items-center gap-6">
          {partners.map((partner, idx) => (
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              key={idx} 
              className="text-[11px] font-bold uppercase tracking-widest text-gray-400"
            >
              {partner}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
