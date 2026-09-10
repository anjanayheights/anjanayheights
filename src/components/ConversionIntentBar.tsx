const WHATSAPP = '919289771222';

const intents = [
  { label: 'I want to BUY', text: 'Hi Anjanay Heights, I want to buy a property. Please help me shortlist suitable options and arrange a site visit.' },
  { label: 'I want to SELL', text: 'Hi Anjanay Heights, I want to sell my property. Please guide me on valuation, buyer reach and the next steps.' },
  { label: 'I want to INVEST', text: 'Hi Anjanay Heights, I want to invest in property. Please share suitable opportunities based on my budget and goals.' },
];

export default function ConversionIntentBar() {
  return (
    <section className="relative z-20 -mt-6 px-4 sm:px-6 lg:px-8" aria-label="Property enquiry shortcuts">
      <div className="max-w-7xl mx-auto rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
        <div className="px-5 py-4 md:px-7 md:py-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C2A36B]">Start with your goal</p>
            <h2 className="mt-1 text-lg md:text-xl font-serif text-[#1A365D]">Tell us what you want to do with property.</h2>
            <p className="mt-1 text-xs text-slate-500">One quick conversation. We’ll understand your requirement and guide the next step.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full lg:w-auto">
            {intents.map((intent) => (
              <a key={intent.label} href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(intent.text)}`} target="_blank" rel="noreferrer" className="group flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-[#1A365D] hover:border-[#C2A36B] hover:bg-[#F9F6EF] transition-colors">
                <span>{intent.label}</span><span className="text-[#C2A36B] group-hover:translate-x-0.5 transition-transform">→</span>
              </a>
            ))}
          </div>
        </div>
        <div className="border-t border-slate-100 px-5 py-2.5 md:px-7 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500">
          <span>📞 Prefer a call? <a href="tel:+919289771222" className="font-bold text-[#1A365D]">+91 92897 71222</a></span>
          <a href="#contact" className="font-bold text-[#1A365D] hover:underline">Or submit your requirement →</a>
        </div>
      </div>
    </section>
  );
}
