import { motion } from 'motion/react';

export default function Hero() {
  return (
    <section id="home" className="relative pt-32 pb-0 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-12 gap-0 border-x border-t border-gray-200 mx-4 sm:mx-6 lg:mx-8 mb-12 shadow-sm">
          <div className="md:col-span-8 p-8 md:p-12 lg:p-16 bg-white flex flex-col justify-center relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-block px-3 py-1 bg-[#F1EDE4] text-[#8C7345] text-[10px] font-bold uppercase tracking-widest mb-6 border border-[#DED4C1] self-start"
            >
              RERA Approved Properties
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="font-serif text-4xl md:text-5xl lg:text-6xl text-[#1A365D] mb-6 leading-tight font-light"
            >
              Find Your Dream Property in{' '}
              <span className="italic font-serif">Noida's Most Prestigious Locations</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-sm md:text-base text-gray-600 mb-10 max-w-xl leading-relaxed"
            >
              Luxury Apartments &bull; Premium Villas &bull; Residential Plots &bull; Commercial Shops &bull; Office Spaces &bull; Hospital Projects
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-col sm:flex-row items-start gap-4"
            >
              <a
                href="#properties"
                className="w-full sm:w-auto bg-[#C2A36B] text-white px-8 py-3 text-sm font-bold uppercase tracking-widest hover:bg-[#A98D59] transition-colors flex items-center justify-center gap-2"
              >
                Explore Properties
              </a>

              <a
                href="#contact"
                className="w-full sm:w-auto border border-[#1A365D] text-[#1A365D] px-8 py-3 text-sm font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                Book Site Visit
              </a>
            </motion.div>
          </div>

          <div className="md:col-span-4 bg-[#1A365D] p-8 md:p-10 flex flex-col justify-center text-white relative border-l border-[#C2A36B]/30">
            <div className="mb-8">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#C2A36B] mb-2">
                Priority Registration
              </div>

              <h3 className="text-2xl font-serif mb-2">Request Details</h3>

              <p className="text-xs text-white/70 leading-relaxed">
                Tell us what property you are looking for and our consultant will contact you.
              </p>
            </div>

            <form
              name="property-lead"
              method="POST"
              data-netlify="true"
              netlify-honeypot="bot-field"
              className="space-y-4"
            >
              <input type="hidden" name="form-name" value="property-lead" />

              <p className="hidden">
                <label>
                  Don't fill this out:
                  <input name="bot-field" />
                </label>
              </p>

              <input
                type="text"
                name="name"
                placeholder="Your Name"
                required
                className="w-full px-4 py-3.5 bg-white border border-transparent text-[#1A365D] text-sm focus:outline-none focus:ring-2 focus:ring-[#C2A36B] transition-all placeholder:text-gray-400"
              />

              <input
                type="tel"
                name="phone"
                placeholder="WhatsApp / Phone Number"
                required
                className="w-full px-4 py-3.5 bg-white border border-transparent text-[#1A365D] text-sm focus:outline-none focus:ring-2 focus:ring-[#C2A36B] transition-all placeholder:text-gray-400"
              />

              <select
                name="lead_type"
                defaultValue=""
                required
                className="w-full px-4 py-3.5 bg-white border border-transparent text-[#1A365D] text-sm focus:outline-none focus:ring-2 focus:ring-[#C2A36B] transition-all"
              >
                <option value="" disabled>Looking to...</option>
                <option value="buy">Buy Property</option>
                <option value="sell">Sell Property</option>
                <option value="invest">Invest</option>
              </select>

              <select
                name="property_type"
                defaultValue=""
                required
                className="w-full px-4 py-3.5 bg-white border border-transparent text-[#1A365D] text-sm focus:outline-none focus:ring-2 focus:ring-[#C2A36B] transition-all"
              >
                <option value="" disabled>Property Type</option>
                <option value="apartment">Apartment / Flat</option>
                <option value="villa">Villa</option>
                <option value="plot">Residential Plot</option>
                <option value="commercial">Commercial Property</option>
                <option value="office">Office Space</option>
                <option value="shop">Shop / Retail</option>
                <option value="hospital">Hospital / Institutional</option>
                <option value="other">Other</option>
              </select>

              <select
                name="location"
                defaultValue=""
                required
                className="w-full px-4 py-3.5 bg-white border border-transparent text-[#1A365D] text-sm focus:outline-none focus:ring-2 focus:ring-[#C2A36B] transition-all"
              >
                <option value="" disabled>Preferred Location</option>
                <option value="central-noida">Central Noida</option>
                <option value="noida-extension">Noida Extension</option>
                <option value="greater-noida">Greater Noida</option>
                <option value="greater-noida-west">Greater Noida West</option>
                <option value="other">Other</option>
              </select>

              <select
                name="budget"
                defaultValue=""
                required
                className="w-full px-4 py-3.5 bg-white border border-transparent text-[#1A365D] text-sm focus:outline-none focus:ring-2 focus:ring-[#C2A36B] transition-all"
              >
                <option value="" disabled>Budget / Expected Price</option>
                <option value="under-50l">Under ₹50 Lakhs</option>
                <option value="50l-1cr">₹50 Lakhs – ₹1 Crore</option>
                <option value="1cr-3cr">₹1 Crore – ₹3 Crores</option>
                <option value="3cr-5cr">₹3 Crores – ₹5 Crores</option>
                <option value="above-5cr">Above ₹5 Crores</option>
              </select>

              <select
                name="timeline"
                defaultValue=""
                required
                className="w-full px-4 py-3.5 bg-white border border-transparent text-[#1A365D] text-sm focus:outline-none focus:ring-2 focus:ring-[#C2A36B] transition-all"
              >
                <option value="" disabled>Timeline</option>
                <option value="immediate">Immediately</option>
                <option value="1-3-months">Within 1–3 Months</option>
                <option value="3-6-months">Within 3–6 Months</option>
                <option value="6-plus-months">After 6 Months</option>
              </select>

              <textarea
                name="requirement"
                rows={3}
                placeholder="Specific requirement (optional)"
                className="w-full px-4 py-3.5 bg-white border border-transparent text-[#1A365D] text-sm focus:outline-none focus:ring-2 focus:ring-[#C2A36B] transition-all placeholder:text-gray-400 resize-none"
              />

              <button
                type="submit"
                className="w-full bg-[#C2A36B] text-white px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-[#A98D59] transition-colors mt-2 shadow-sm"
              >
                Get Matched With Properties
              </button>
            </form>

            <div className="mt-8 flex items-center justify-center space-x-2 text-[10px] text-white/50 border-t border-white/10 pt-6">
              <span className="text-[#C2A36B] text-sm">🔒</span>
              <span>Your information is 100% secure.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}import { motion } from 'motion/react';

export default function Hero() {
  return (
    <section id="home" className="relative pt-32 pb-0 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-12 gap-0 border-x border-t border-gray-200 mx-4 sm:mx-6 lg:mx-8 mb-12 shadow-sm">
          <div className="md:col-span-8 p-8 md:p-12 lg:p-16 bg-white flex flex-col justify-center relative">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-block px-3 py-1 bg-[#F1EDE4] text-[#8C7345] text-[10px] font-bold uppercase tracking-widest mb-6 border border-[#DED4C1] self-start"
            >
              RERA Approved Properties
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="font-serif text-4xl md:text-5xl lg:text-6xl text-[#1A365D] mb-6 leading-tight font-light"
            >
              Find Your Dream Property in <span className="italic font-serif">Noida's Most Prestigious Locations</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-sm md:text-base text-gray-600 mb-10 max-w-xl leading-relaxed"
            >
              Luxury Apartments &bull; Premium Villas &bull; Residential Plots &bull; Commercial Shops &bull; Office Spaces &bull; Hospital Projects
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-col sm:flex-row items-start gap-4"
            >
              <a href="#properties" className="w-full sm:w-auto bg-[#C2A36B] text-white px-8 py-3 text-sm font-bold uppercase tracking-widest hover:bg-[#A98D59] transition-colors flex items-center justify-center gap-2">
                Explore Properties
              </a>
              <a href="#contact" className="w-full sm:w-auto border border-[#1A365D] text-[#1A365D] px-8 py-3 text-sm font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                Book Site Visit
              </a>
            </motion.div>
          </div>
          
          <div className="md:col-span-4 bg-[#1A365D] p-8 md:p-10 flex flex-col justify-center text-white relative border-l border-[#C2A36B]/30">
            <div className="mb-8">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#C2A36B] mb-2">Priority Registration</div>
              <h3 className="text-2xl font-serif mb-2">Request Details</h3>
              <p className="text-xs text-white/70 leading-relaxed">Register for exclusive access to project pricing, floor plans, and priority site visits.</p>
            </div>
            
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                <input type="text" placeholder="Your Name" className="w-full px-4 py-3.5 bg-white border border-transparent text-[#1A365D] text-sm focus:outline-none focus:ring-2 focus:ring-[#C2A36B] transition-all placeholder:text-gray-400" />
              </div>
              <div>
                <input type="tel" placeholder="Phone Number" className="w-full px-4 py-3.5 bg-white border border-transparent text-[#1A365D] text-sm focus:outline-none focus:ring-2 focus:ring-[#C2A36B] transition-all placeholder:text-gray-400" />
              </div>
              <div>
                <select defaultValue="" className="w-full px-4 py-3.5 bg-white border border-transparent text-[#1A365D] text-sm focus:outline-none focus:ring-2 focus:ring-[#C2A36B] transition-all">
                  <option value="" disabled className="text-gray-400">Interested In...</option>
                  <option value="residential">Residential Properties</option>
                  <option value="commercial">Commercial Investments</option>
                  <option value="villas">Luxury Villas</option>
                  <option value="plots">Residential Plots</option>
                  <option value="hospital">Hospital / Institutional</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-[#C2A36B] text-white px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-[#A98D59] transition-colors mt-2 shadow-sm">
                Get Instant Access
              </button>
            </form>

            <div className="mt-8 flex items-center justify-center space-x-2 text-[10px] text-white/50 border-t border-white/10 pt-6">
               <span className="text-[#C2A36B] text-sm">🔒</span>
               <span>Your information is 100% secure.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
