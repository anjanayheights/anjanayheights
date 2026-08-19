import { motion } from 'motion/react';

export default function WhyChooseUs() {
  const benefits = [
    { title: "100% Verified", desc: "RERA Approved Projects" },
    { title: "Expert Consultation", desc: "Professional Investment Advice" },
    { title: "Best Pricing", desc: "Exclusive Builder Discounts" },
    { title: "Launch Offers", desc: "Priority Inventory Access" },
    { title: "No Hidden Charges", desc: "100% Transparent Dealings" },
    { title: "Legal Support", desc: "End-to-End Documentation" },
    { title: "Bank Loan Support", desc: "Easy EMI & Fast Approvals" },
    { title: "Site Visits", desc: "Complimentary Arrangements" },
    { title: "Resale Assistance", desc: "Seamless Secondary Market Deals" },
    { title: "Customer-Centric", desc: "Dedicated Relationship Manager" },
    { title: "Portfolio Planning", desc: "Long-term Wealth Creation" },
    { title: "Rental Guidance", desc: "Property Management Support" }
  ];

  return (
    <section className="py-20 bg-[#F9F9F7] border-y border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-4">Value Proposition</div>
          <h2 className="text-3xl md:text-4xl font-serif text-[#1A365D] mb-4 font-light">
            Experience That Creates Value
          </h2>
          <p className="text-sm text-gray-600 max-w-2xl">We simplify your real estate journey with transparency, expertise, and exclusive benefits.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-gray-200 border border-gray-200">
          {benefits.map((benefit, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: (idx % 4) * 0.05 }}
              className="bg-white p-6 hover:bg-[#F9F9F7] transition-colors flex flex-col justify-center"
            >
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#C2A36B] mb-2">{String(idx + 1).padStart(2, '0')}</div>
              <h3 className="font-bold text-[#1A365D] text-sm mb-1">{benefit.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{benefit.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
