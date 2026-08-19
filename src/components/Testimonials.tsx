import { motion } from 'motion/react';

export default function Testimonials() {
  const reviews = [
    {
      text: "Professional guidance from start to finish. Our dream home purchase was completely hassle-free.",
      author: "Satisfied Homebuyer"
    },
    {
      text: "Our commercial investment generated excellent returns. Highly recommended for business investments.",
      author: "Commercial Investor"
    },
    {
      text: "Transparent dealing, genuine advice, and complete support throughout the buying process. A reliable partner.",
      author: "Property Buyer"
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-4">Client Feedback</div>
          <h2 className="text-3xl md:text-4xl font-serif text-[#1A365D] font-light">
            What Our Clients Say
          </h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {reviews.map((review, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-[#F9F9F7] border border-gray-200 p-8 relative"
            >
              <div className="text-4xl font-serif text-[#C2A36B] mb-4">"</div>
              <p className="text-gray-600 italic mb-8 text-sm leading-relaxed">"{review.text}"</p>
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#1A365D]">{review.author}</h4>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
