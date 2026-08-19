import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

export default function HomeLoanSupport() {
  const [loanAmount, setLoanAmount] = useState(5000000);
  const [interestRate, setInterestRate] = useState(8.5);
  const [tenureYears, setTenureYears] = useState(20);
  const [emi, setEmi] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);
  const [totalPayment, setTotalPayment] = useState(0);

  useEffect(() => {
    calculateEMI();
  }, [loanAmount, interestRate, tenureYears]);

  const calculateEMI = () => {
    const p = loanAmount;
    const r = interestRate / 12 / 100;
    const n = tenureYears * 12;

    if (p > 0 && r > 0 && n > 0) {
      const emiValue = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      setEmi(Math.round(emiValue));
      setTotalPayment(Math.round(emiValue * n));
      setTotalInterest(Math.round(emiValue * n - p));
    } else {
      setEmi(0);
      setTotalPayment(p);
      setTotalInterest(0);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <section className="py-20 bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="border-l-4 border-[#C2A36B] pl-8 py-4"
          >
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-4">Financial Services</div>
            <h2 className="text-3xl md:text-4xl font-serif text-[#1A365D] mb-6 font-light leading-tight">
              Home Loan Support & <br/><span className="italic">EMI Calculator</span>
            </h2>
            <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
              <p>
                We assist buyers in securing home loans from leading banks and financial institutions with competitive interest rates, faster approvals, and simplified documentation.
              </p>
              <p>
                Use our EMI calculator to get an estimate of your monthly payments and plan your property investment efficiently.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              {['HDFC Bank', 'SBI', 'ICICI Bank', 'Axis Bank', 'Kotak'].map((bank, i) => (
                <div key={i} className="px-4 py-2 border border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {bank}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-[#F9F9F7] p-8 md:p-10 border border-gray-200"
          >
            <h3 className="text-xl font-serif text-[#1A365D] mb-8">Estimate Your EMI</h3>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Loan Amount</label>
                  <span className="text-sm font-bold text-[#1A365D]">{formatCurrency(loanAmount)}</span>
                </div>
                <input 
                  type="range" 
                  min="1000000" 
                  max="50000000" 
                  step="100000" 
                  value={loanAmount} 
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                  className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-[#C2A36B]"
                />
                <div className="flex justify-between mt-1 text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                  <span>₹10L</span>
                  <span>₹5Cr</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Interest Rate (% p.a.)</label>
                  <span className="text-sm font-bold text-[#1A365D]">{interestRate}%</span>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="15" 
                  step="0.1" 
                  value={interestRate} 
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-[#C2A36B]"
                />
                <div className="flex justify-between mt-1 text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                  <span>5%</span>
                  <span>15%</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Loan Tenure (Years)</label>
                  <span className="text-sm font-bold text-[#1A365D]">{tenureYears} Years</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="30" 
                  step="1" 
                  value={tenureYears} 
                  onChange={(e) => setTenureYears(Number(e.target.value))}
                  className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-[#C2A36B]"
                />
                <div className="flex justify-between mt-1 text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                  <span>1 Yr</span>
                  <span>30 Yrs</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200 grid grid-cols-2 gap-6">
              <div className="col-span-2 sm:col-span-1">
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Monthly EMI</div>
                <div className="text-2xl font-serif text-[#C2A36B]">{formatCurrency(emi)}</div>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Principal Amount</div>
                <div className="text-lg font-serif text-[#1A365D]">{formatCurrency(loanAmount)}</div>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Total Interest</div>
                <div className="text-lg font-serif text-[#1A365D]">{formatCurrency(totalInterest)}</div>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Total Amount</div>
                <div className="text-lg font-serif text-[#1A365D]">{formatCurrency(totalPayment)}</div>
              </div>
            </div>

            <button className="w-full mt-8 bg-[#1A365D] text-white py-4 text-[10px] font-bold uppercase tracking-widest hover:bg-[#2D3748] transition-colors">
              Apply For Home Loan
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
