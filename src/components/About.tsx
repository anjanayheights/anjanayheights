import { motion } from 'motion/react';

export default function About() {
  return (
    <section id="about" className="py-20 bg-[#F9F9F7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="border-l-4 border-[#C2A36B] pl-8 py-4"
          >
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-4">About Anjanay Heights</div>
            <h2 className="text-4xl font-serif text-[#1A365D] mb-6 font-light leading-tight">
              Luxury Living. <br/><span className="italic">Smart Investments.</span>
            </h2>
            <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
              <p>
                Anjanay Heights is a trusted real estate consultancy committed to helping families, professionals, and investors discover premium residential and commercial properties across Noida and Greater Noida.
              </p>
              <p>
                We believe that every property purchase should be transparent, secure, and rewarding. Every project we recommend is carefully evaluated to ensure quality construction, legal compliance, and long-term investment potential.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-2 gap-4"
          >
            <div className="bg-white p-6 border border-gray-200 flex flex-col justify-center aspect-square">
              <div className="text-3xl font-serif text-[#1A365D] mb-2">100%</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#C2A36B] mb-2">Verified</div>
              <p className="text-xs text-gray-500">RERA Approved Projects & Trusted Developers</p>
            </div>
            <div className="bg-[#1A365D] text-white p-6 flex flex-col justify-center aspect-square">
              <div className="text-3xl font-serif mb-2">3+</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#C2A36B] mb-2">Categories</div>
              <p className="text-xs text-white/70">Residential, Commercial & Healthcare</p>
            </div>
            <div className="bg-[#F1F3F5] p-6 border border-gray-200 flex flex-col justify-center aspect-square col-span-2 sm:col-span-1">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#C2A36B] mb-2">Secure Deals</div>
              <p className="text-xs text-gray-600">Strict legal verification process for your peace of mind.</p>
            </div>
            <div className="bg-white p-6 border border-gray-200 flex flex-col justify-center aspect-square col-span-2 sm:col-span-1">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#C2A36B] mb-2">High Returns</div>
              <p className="text-xs text-gray-600">Curated investment opportunities with excellent appreciation.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
