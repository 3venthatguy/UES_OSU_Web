import React, { useState } from 'react';
import { BookOpen, Download, FileText, Sliders, TrendingUp, DollarSign, Activity, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import resourcesData from '../data/resources.json';
import { Reveal, RevealItem } from './Reveal';

export const ResourcesSection: React.FC = () => {
  // Simulator Controls State
  const [interestRate, setInterestRate] = useState<number>(4.5);
  const [moneySupply, setMoneySupply] = useState<number>(150);
  const [taxRate, setTaxRate] = useState<number>(22);
  const [govtSpending, setGovtSpending] = useState<number>(180);

  // Derived Macroeconomic Equilibrium Equations
  // AD Shift: Higher money supply & govt spending shift AD right; higher interest rate & tax rate shift AD left
  const adShift = (moneySupply / 100 + govtSpending / 100) - (interestRate * 0.18 + taxRate * 0.04);
  const gdpGrowth = Math.max(-2.5, Math.min(8.5, 2.0 + (adShift - 1.2) * 1.8)).toFixed(2);
  const inflationRate = Math.max(0.2, Math.min(12.0, 1.8 + (moneySupply / 100) * 1.4 - (interestRate * 0.35))).toFixed(2);
  const unemployment = Math.max(2.8, Math.min(11.5, 6.2 - (parseFloat(gdpGrowth) * 0.55))).toFixed(2);

  let statusBadge = { label: 'Goldilocks Growth', color: 'bg-emerald-600', desc: 'Balanced expansion with stable prices and low unemployment.' };
  const inflNum = parseFloat(inflationRate);
  const gdpNum = parseFloat(gdpGrowth);

  if (inflNum > 5.5 && gdpNum < 1.0) {
    statusBadge = { label: 'Stagflation Risk', color: 'bg-amber-600', desc: 'Elevated inflation coupled with sluggish economic growth.' };
  } else if (inflNum > 4.5) {
    statusBadge = { label: 'Economy Overheating', color: 'bg-[#B03A40]', desc: 'Excessive demand pressure pushing prices higher.' };
  } else if (gdpNum < 0.5) {
    statusBadge = { label: 'Recessionary Pressure', color: 'bg-indigo-600', desc: 'Contracting activity with elevated unemployment risk.' };
  }

  return (
    <section id="resources" className="py-20 bg-white/50 border-t border-[#B03A40]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Section Header */}
        <Reveal className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white border border-[#B03A40]/20 text-[10px] font-bold text-[#B03A40] uppercase tracking-widest shadow-xs">
            <BookOpen className="w-3.5 h-3.5 text-[#F07B41]" /> Knowledge Hub & Tools
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#2D0A0C] tracking-tight">
            Academic Resources & Policy Simulator
          </h2>
          <p className="text-base sm:text-lg text-[#524B47] leading-relaxed">
            Access exam prep guides, econometrics code repositories, research journals, and model policy outcomes live.
          </p>
        </Reveal>

        {/* Academic Guides & Download Center - Bento Cards */}
        <div className="space-y-6">
          <Reveal className="flex justify-between items-end">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#F07B41]">Repository</span>
              <h3 className="text-2xl font-black text-[#2D0A0C]">
                Study Guides & Research Publications
              </h3>
            </div>
          </Reveal>

          <Reveal stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {resourcesData.academicGuides.map((res) => (
              <RevealItem
                key={res.id}
                className="bg-white/80 border border-[#B03A40]/20 rounded-3xl p-6 shadow-xs hover:border-[#B03A40] transition-colors flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#FDF8F1] border border-[#B03A40]/20 text-[10px] font-bold text-[#B03A40] uppercase tracking-wider">
                      {res.category}
                    </span>
                    <span className="text-[10px] font-bold text-[#605753]">
                      {res.format} • {res.size}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-[#2D0A0C] leading-snug">
                    {res.title}
                  </h4>

                  <p className="text-xs text-[#524B47] leading-relaxed">
                    {res.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#B03A40]/10 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[#605753]">
                    By {res.author}
                  </span>
                  <a
                    href={res.downloadUrl}
                    onClick={(e) => { e.preventDefault(); alert(`Downloading ${res.title} (${res.format})`); }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#B03A40] hover:text-[#842329]"
                  >
                    <span>Download</span>
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              </RevealItem>
            ))}
          </Reveal>
        </div>

        {/* Interactive Macroeconomic Policy Simulator - Bento Container */}
        <Reveal className="bg-white/80 border border-[#B03A40]/20 rounded-3xl p-6 sm:p-10 space-y-8 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#B03A40]/10">
            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full bg-[#B03A40] text-white text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#F07B41]" /> Interactive Lab
              </span>
              <h3 className="text-2xl font-black text-[#2D0A0C]">
                Macroeconomic Policy & IS-LM Curve Simulator
              </h3>
              <p className="text-xs sm:text-sm text-[#605753]">
                Adjust monetary and fiscal levers below to simulate real-time aggregate demand (AD/AS) equilibrium shifts.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1.5 rounded-full text-white text-xs font-bold ${statusBadge.color}`}>
                {statusBadge.label}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Controls Column (Sliders) */}
            <div className="lg:col-span-5 space-y-6 bg-[#FDF8F1] border border-[#B03A40]/10 p-6 rounded-2xl">
              <h4 className="text-xs font-bold text-[#2D0A0C] uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-[#B03A40]" /> Policy Instrument Controls
              </h4>

              {/* Slider 1: Interest Rate */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[#2D0A0C]">Central Bank Rate</span>
                  <span className="text-[#B03A40] font-bold">{interestRate}%</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="10.0"
                  step="0.25"
                  value={interestRate}
                  onChange={(e) => setInterestRate(parseFloat(e.target.value))}
                  className="w-full accent-[#B03A40] cursor-pointer"
                />
                <p className="text-[10px] text-[#605753]">Higher rates contract borrowing and cool demand.</p>
              </div>

              {/* Slider 2: Money Supply */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[#2D0A0C]">Money Supply Growth ($B)</span>
                  <span className="text-[#F07B41] font-bold">${moneySupply}B</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="300"
                  step="10"
                  value={moneySupply}
                  onChange={(e) => setMoneySupply(parseInt(e.target.value))}
                  className="w-full accent-[#F07B41] cursor-pointer"
                />
                <p className="text-[10px] text-[#605753]">Liquidity injections stimulate private capital investment.</p>
              </div>

              {/* Slider 3: Tax Rate */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[#2D0A0C]">Effective Corporate Tax Rate</span>
                  <span className="text-[#842329] font-bold">{taxRate}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="40"
                  step="1"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseInt(e.target.value))}
                  className="w-full accent-[#842329] cursor-pointer"
                />
              </div>

              {/* Slider 4: Government Spending */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[#2D0A0C]">Fiscal Stimulus Spending ($B)</span>
                  <span className="text-[#B03A40] font-bold">${govtSpending}B</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="350"
                  step="10"
                  value={govtSpending}
                  onChange={(e) => setGovtSpending(parseInt(e.target.value))}
                  className="w-full accent-[#B03A40] cursor-pointer"
                />
              </div>
            </div>

            {/* Right Results & Graph Column */}
            <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
              
              {/* Output Metrics Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#FDF8F1] border border-[#B03A40]/10 rounded-2xl p-4 text-center">
                  <div className="text-[10px] font-bold text-[#605753] uppercase">Real GDP Growth</div>
                  <div className="text-2xl font-black text-[#B03A40] mt-1">{gdpGrowth}%</div>
                  <span className="text-[10px] text-[#605753]">Target: +2.5%</span>
                </div>

                <div className="bg-[#FDF8F1] border border-[#B03A40]/10 rounded-2xl p-4 text-center">
                  <div className="text-[10px] font-bold text-[#605753] uppercase">CPI Inflation</div>
                  <div className="text-2xl font-black text-[#F07B41] mt-1">{inflationRate}%</div>
                  <span className="text-[10px] text-[#605753]">Target: 2.0%</span>
                </div>

                <div className="bg-[#FDF8F1] border border-[#B03A40]/10 rounded-2xl p-4 text-center">
                  <div className="text-[10px] font-bold text-[#605753] uppercase">Unemployment</div>
                  <div className="text-2xl font-black text-[#2D0A0C] mt-1">{unemployment}%</div>
                  <span className="text-[10px] text-[#605753]">NAIRU: 4.2%</span>
                </div>
              </div>

              {/* SVG AD-AS Curve Graph */}
              <div className="bg-[#FDF8F1] border border-[#B03A40]/10 rounded-2xl p-5 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-[#2D0A0C]">
                  <span>Aggregate Demand & Supply Model (AD / AS)</span>
                  <span className="text-[10px] text-[#524B47] font-normal">{statusBadge.desc}</span>
                </div>

                <div className="w-full h-48 bg-white rounded-xl relative border border-[#B03A40]/10 p-3 flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 300 160">
                    {/* Axes */}
                    <line x1="30" y1="130" x2="280" y2="130" stroke="#B03A40" strokeOpacity="0.2" strokeWidth="2" />
                    <line x1="30" y1="20" x2="30" y2="130" stroke="#B03A40" strokeOpacity="0.2" strokeWidth="2" />

                    <text x="15" y="25" fontSize="9" fill="#524B47" fontWeight="bold">Price (P)</text>
                    <text x="230" y="145" fontSize="9" fill="#524B47" fontWeight="bold">Real Output (Y)</text>

                    {/* Long Run AS Curve (LRAS Vertical) */}
                    <line x1="160" y1="20" x2="160" y2="130" stroke="#605753" strokeWidth="1.5" strokeDasharray="4 4" />
                    <text x="165" y="30" fontSize="8" fill="#605753">LRAS</text>

                    {/* Short Run AS Curve (Upward Sloping) */}
                    <path d="M 40 120 Q 140 80 260 30" fill="none" stroke="#F07B41" strokeWidth="2.5" />
                    <text x="245" y="25" fontSize="9" fill="#F07B41" fontWeight="bold">SRAS</text>

                    {/* Dynamic AD Curve (Downward Sloping, shifts right/left with adShift) */}
                    {(() => {
                      const xOffset = (adShift - 1.2) * 25;
                      const adX1 = Math.max(35, Math.min(100, 50 + xOffset));
                      const adX2 = Math.max(200, Math.min(275, 240 + xOffset));
                      return (
                        <>
                          <path
                            d={`M ${adX1} 30 Q ${135 + xOffset} 80 ${adX2} 125`}
                            fill="none"
                            stroke="#B03A40"
                            strokeWidth="3"
                          />
                          <text x={adX2 - 15} y="138" fontSize="9" fill="#B03A40" fontWeight="bold">AD Curve</text>
                          
                          {/* Equilibrium Point */}
                          <circle cx={145 + xOffset * 0.5} cy={78 - xOffset * 0.2} r="5" fill="#B03A40" />
                        </>
                      );
                    })()}
                  </svg>
                </div>
              </div>

            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
