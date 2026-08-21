import { motion } from 'motion/react';

export default function Contact() {
  return (
    <section id="contact" className="py-20 bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-0 border border-gray-200">
          <div className="p-10 md:p-16 bg-[#F9F9F7] flex flex-col justify-center">
            <div className="text-[10px] text-[#C2A36B] font-bold uppercase tracking-widest mb-4">
              Get In Touch
            </div>

            <h2 className="text-3xl md:text-4xl font-serif text-[#1A365D] mb-6 font-light">
              Ready to Find Your Dream Property?
            </h2>

            <p className="text-sm text-gray-600 mb-12 leading-relaxed">
              Contact our expert consultants for personalized property
              recommendations, site visits, and investment advisory.
            </p>

            <div className="space-y-8">
              <div className="border-l-2 border-[#C2A36B] pl-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                  Serving Locations
                </h4>
                <p className="text-sm text-[#1A365D] font-medium leading-relaxed">
                  Central Noida, Noida Extension,
                  <br />
                  Greater Noida, Greater Noida West
                </p>
              </div>

              <div className="border-l-2 border-[#C2A36B] pl-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                  Call Us
                </h4>
                <a
                  href="tel:+919289771222"
                  className="block text-sm text-[#1A365D] font-medium hover:text-[#C2A36B] mb-1"
                >
                  9289771222
                </a>
                <a
                  href="tel:+919891158969"
                  className="block text-sm text-[#1A365D] font-medium hover:text-[#C2A36B]"
                >
                  9891158969
                </a>
              </div>

              <div className="border-l-2 border-[#C2A36B] pl-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                  Email
                </h4>
                <a
                  href="mailto:anjanayheights@gmail.com"
                  className="block text-sm text-[#1A365D] font-medium hover:text-[#C2A36B]"
                >
                  anjanayheights@gmail.com
                </a>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="p-10 md:p-16 bg-white"
          >
            <h3 className="text-2xl font-serif text-[#1A365D] mb-8">
              Request a Call Back
            </h3>

            <form
              name="callback"
              method="POST"
              data-netlify="true"
              className="space-y-6"
            >
              <input type="hidden" name="form-name" value="callback" />

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full px-4 py-3 bg-[#F9F9F7] border border-gray-200 focus:outline-none focus:border-[#C2A36B] text-sm text-[#1A365D] transition-colors"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  className="w-full px-4 py-3 bg-[#F9F9F7] border border-gray-200 focus:outline-none focus:border-[#C2A36B] text-sm text-[#1A365D] transition-colors"
                  placeholder="+91 xxxxx xxxxx"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                  Interested In
                </label>
                <select
                  name="interest"
                  required
                  className="w-full px-4 py-3 bg-[#F9F9F7] border border-gray-200 focus:outline-none focus:border-[#C2A36B] text-sm text-[#1A365D] transition-colors"
                >
                  <option>Residential Property</option>
                  <option>Commercial Property</option>
                  <option>Healthcare / Hospital Project</option>
                  <option>Residential Plots</option>
                  <option>Other Investment</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  name="message"
                  rows={4}
                  className="w-full px-4 py-3 bg-[#F9F9F7] border border-gray-200 focus:outline-none focus:border-[#C2A36B] text-sm text-[#1A365D] transition-colors resize-none"
                  placeholder="I am looking for..."
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-[#1A365D] text-white px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-[#2D3748] transition-colors"
              >
                Submit Request
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
