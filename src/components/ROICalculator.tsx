import { useState } from 'react';
import { motion } from 'motion/react';

export default function ROICalculator() {
  const [investment, setInvestment] = useState(5000000);
  const [rentalYield, setRentalYield] = useState(6);
  const [appreciation, setAppreciation] = useState(8);
  const [horizon, setHorizon] = useState(5);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateROI = () => {
    let totalRentalIncome = 0;
    let propertyValue = investment;

    for (let i = 1; i <= horizon; i++) {
      totalRentalIncome += propertyValue * (rentalYield / 100);
      propertyValue = propertyValue * (1 + appreciation / 100);
    }

    const totalReturn = propertyValue + totalRentalIncome;
    const totalProfit = totalReturn - investment;
    const roiPercentage = ((totalProfit / investment) * 100).toFixed(1);

    return {
      totalRentalIncome,
      propertyValue,
      totalProfit,
      totalReturn,
      roiPercentage,
    };
  };

  const results = calculateROI();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mt-12 bg-white border border-gray-200 p-8"
    >
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <h3 className="text-2xl font-serif text-[#1A365D] mb-4">Investment ROI Estimator</h3>
          <p className="text-sm text-gray-600 mb-8 leading-relaxed">
            Estimate the potential returns on your commercial real estate investments. Commercial properties typically offer higher rental yields and steady appreciation.
          </p>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Investment Amount</label>
                <span className="text-sm font-bold text-[#1A365D]">{formatCurrency(investment)}</span>
              </div>
              <input 
                type="range" 
                min="2500000" 
                max="100000000" 
                step="500000" 
                value={investment} 
                onChange={(e) => setInvestment(Number(e.target.value))}
                className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-[#C2A36B]"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Expected Rental Yield (% p.a.)</label>
                <span className="text-sm font-bold text-[#1A365D]">{rentalYield}%</span>
              </div>
              <input 
                type="range" 
                min="3" 
                max="12" 
                step="0.5" 
                value={rentalYield} 
                onChange={(e) => setRentalYield(Number(e.target.value))}
                className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-[#C2A36B]"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Annual Appreciation (% p.a.)</label>
                <span className="text-sm font-bold text-[#1A365D]">{appreciation}%</span>
              </div>
              <input 
                type="range" 
                min="2" 
                max="15" 
                step="0.5" 
                value={appreciation} 
                onChange={(e) => setAppreciation(Number(e.target.value))}
                className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-[#C2A36B]"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Investment Horizon (Years)</label>
                <span className="text-sm font-bold text-[#1A365D]">{horizon} Years</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="20" 
                step="1" 
                value={horizon} 
                onChange={(e) => setHorizon(Number(e.target.value))}
                className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-[#C2A36B]"
              />
            </div>
          </div>
        </div>

        <div className="bg-[#1A365D] p-8 md:p-10 text-white relative border-l-4 border-[#C2A36B]">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#C2A36B] mb-8">Estimated Returns</h4>
          
          <div className="space-y-6">
            <div className="flex justify-between items-end border-b border-white/10 pb-4">
              <span className="text-xs text-white/70">Total Rental Income</span>
              <span className="text-lg font-serif">{formatCurrency(results.totalRentalIncome)}</span>
            </div>
            <div className="flex justify-between items-end border-b border-white/10 pb-4">
              <span className="text-xs text-white/70">Est. Property Value</span>
              <span className="text-lg font-serif">{formatCurrency(results.propertyValue)}</span>
            </div>
            <div className="flex justify-between items-end border-b border-white/10 pb-4">
              <span className="text-xs text-white/70">Total Profit</span>
              <span className="text-lg font-serif text-[#C2A36B]">{formatCurrency(results.totalProfit)}</span>
            </div>
            <div className="flex justify-between items-end pt-2">
              <span className="text-xs font-bold uppercase tracking-widest">Total ROI</span>
              <span className="text-4xl font-serif text-[#C2A36B]">{results.roiPercentage}%</span>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-[9px] text-white/40 leading-relaxed italic">
              * The calculations are based on assumed rates and are for illustration purposes only. Actual returns may vary depending on market conditions, property location, and other factors.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
