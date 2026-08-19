import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function FAQ() {
  const faqs = [
    {
      q: "Are all projects RERA approved?",
      a: "Yes. We recommend only verified RERA-approved developments to ensure your investment is secure and compliant with all legal regulations."
    },
    {
      q: "Do you arrange site visits?",
      a: "Yes. Complimentary site visits are available by appointment. We'll arrange a dedicated property consultant to guide you through the properties."
    },
    {
      q: "Can you help with home loans?",
      a: "Yes. We provide complete home loan assistance through reputed financial institutions and leading banks, ensuring competitive interest rates and simplified documentation."
    },
    {
      q: "Do you deal in commercial properties?",
      a: "Yes. We specialize in commercial shops, office spaces, retail investments, SCO plots, and institutional properties across prime locations."
    },
    {
      q: "Can NRIs invest through you?",
      a: "Absolutely. We provide complete end-to-end assistance for NRI property investments, including remote site presentations, portfolio planning, and legal documentation support."
    },
    {
      q: "Do you provide hospital project consultancy?",
      a: "Yes. We offer specialized consultancy for healthcare infrastructure projects ranging from 50-bed to 700-bed hospitals, assisting medical groups and investors."
    }
  ];

  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className="py-20 bg-[#F9F9F7] border-t border-gray-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-4">Information</div>
          <h2 className="text-3xl md:text-4xl font-serif text-[#1A365D] font-light mb-4">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="border-t border-gray-200">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border-b border-gray-200 bg-white">
              <button 
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none hover:bg-gray-50 transition-colors"
              >
                <span className="font-serif text-[#1A365D] text-lg">{faq.q}</span>
                <span className={`text-[#C2A36B] font-serif text-xl transition-transform ${openIdx === idx ? 'rotate-45' : ''}`}>+</span>
              </button>
              <AnimatePresence>
                {openIdx === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 text-sm text-gray-600 leading-relaxed max-w-3xl">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
