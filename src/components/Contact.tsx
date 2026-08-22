import { FormEvent, useState } from 'react';
import { motion } from 'motion/react';

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setSubmitting(true);

    try {
      const response = await fetch('/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(formData as any).toString(),
      });

      if (response.ok) {
        form.reset();
        setSubmitted(true);
      } else {
        alert('Unable to submit your request. Please try again.');
      }
    } catch (error) {
      alert('Unable to submit your request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="contact"
      className="py-20 bg-white border-t border-gray-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-0 border border-gray-200">

          {/* LEFT SIDE */}
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

              {/* LOCATIONS */}
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

              {/* PHONE */}
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

              {/* EMAIL */}
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

          {/* RIGHT SIDE */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="p-10 md:p-16 bg-white"
          >

            <h3 className="text-2xl font-serif text-[#1A365D] mb-8">
              Request a Call Back
            </h3>

            {submitted ? (

              /* SUCCESS MESSAGE */
              <div className="border border-[#C2A36B] bg-[#F9F9F7] p-8 text-center">

                <h4 className="text-xl font-serif text-[#1A365D] mb-3">
                  Thank You!
                </h4>

                <p className="text-sm text-gray-600">
                  Your request has been received. Our property consultant
                  will contact you shortly.
                </p>

              </div>

            ) : (

              <form
                name="callback"
                method="POST"
                data-netlify="true"
                data-netlify-honeypot="bot-field"
                onSubmit={handleSubmit}
                className="space-y-6"
              >

                {/* IMPORTANT FOR NETLIFY */}
                <input
                  type="hidden"
                  name="form-name"
                  value="callback"
                />

                {/* HONEYPOT */}
                <p className="hidden">
                  <label>
                    Don't fill this out if you're human:
                    <input name="bot-field" />
                  </label>
                </p>

                {/* NAME */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                    Full Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    required
                    autoComplete="name"
                    className="w-full px-4 py-3 bg-[#F9F9F7] border border-gray-200 focus:outline-none focus:border-[#C2A36B] text-sm text-[#1A365D] transition-colors"
                    placeholder="Your Name"
                  />
                </div>

                {/* PHONE */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                    Phone Number
                  </label>

                  <input
                    type="tel"
                    name="phone"
                    required
                    autoComplete="tel"
                    pattern="[0-9+\-\s]{10,15}"
                    className="w-full px-4 py-3 bg-[#F9F9F7] border border-gray-200 focus:outline-none focus:border-[#C2A36B] text-sm text-[#1A365D] transition-colors"
                    placeholder="9876543210"
                  />
                </div>

                {/* INTEREST */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                    Interested In
                  </label>

                  <select
                    name="interest"
                    required
                    defaultValue=""
                    className="w-full px-4 py-3 bg-[#F9F9F7] border border-gray-200 focus:outline-none focus:border-[#C2A36B] text-sm text-[#1A365D] transition-colors"
                  >
                    <option value="" disabled>
                      Select Property Type
                    </option>

                    <option value="Residential Property">
                      Residential Property
                    </option>

                    <option value="Commercial Property">
                      Commercial Property
                    </option>

                    <option value="Healthcare / Hospital Project">
                      Healthcare / Hospital Project
                    </option>

                    <option value="Residential Plots">
                      Residential Plots
                    </option>

                    <option value="Other Investment">
                      Other Investment
                    </option>
                  </select>
                </div>

                {/* MESSAGE */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                    Message (Optional)
                  </label>

                  <textarea
                    name="message"
                    rows={4}
                    className="w-full px-4 py-3 bg-[#F9F9F7] border border-gray-200 focus:outline-none focus:border-[#C2A36B] text-sm text-[#1A365D] transition-colors resize-none"
                    placeholder="I am looking for..."
                  />
                </div>

                {/* SUBMIT */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#1A365D] text-white px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-[#2D3748] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Request a Call Back'}
                </button>

              </form>

            )}

          </motion.div>

        </div>
      </div>
    </section>
  );
}
