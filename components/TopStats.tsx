import React from 'react';
import { Stats } from '../types';
import { DollarSign, ShoppingCart, CheckCircle, PackageCheck } from 'lucide-react';

interface TopStatsProps {
  stats: Stats;
}

const TopStats: React.FC<TopStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      
      {/* Est Budget */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
            <DollarSign size={18} />
          </div>
          <span className="text-sm text-slate-500 font-medium">總預算估計</span>
        </div>
        <p className="text-xl md:text-2xl font-bold text-slate-800">
          ${stats.totalBudgetEst.toLocaleString()}
        </p>
      </div>

      {/* Actual Spend */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
            <ReceiptIcon size={18} />
          </div>
          <span className="text-sm text-slate-500 font-medium">實際支出</span>
        </div>
        <p className={`text-xl md:text-2xl font-bold ${stats.actualSpend > stats.totalBudgetEst * 1.1 ? 'text-red-600' : 'text-slate-800'}`}>
          ${stats.actualSpend.toLocaleString()}
        </p>
      </div>

      {/* Purchase Progress */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
            <ShoppingCart size={18} />
          </div>
          <span className="text-sm text-slate-500 font-medium">採購進度</span>
        </div>
        <div className="flex items-end gap-2">
            <p className="text-xl md:text-2xl font-bold text-slate-800">
            {Math.round(stats.procurementProgress)}%
            </p>
        </div>
        <div className="w-full bg-slate-100 h-1.5 mt-2 rounded-full overflow-hidden">
            <div 
                className="bg-orange-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${stats.procurementProgress}%` }}
            ></div>
        </div>
      </div>

      {/* Packing Progress */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
            <PackageCheck size={18} />
          </div>
          <span className="text-sm text-slate-500 font-medium">裝箱完成</span>
        </div>
        <div className="flex items-end gap-2">
            <p className="text-xl md:text-2xl font-bold text-slate-800">
            {Math.round(stats.packingProgress)}%
            </p>
        </div>
        <div className="w-full bg-slate-100 h-1.5 mt-2 rounded-full overflow-hidden">
            <div 
                className="bg-purple-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${stats.packingProgress}%` }}
            ></div>
        </div>
      </div>

    </div>
  );
};

// Helper component for icon
const ReceiptIcon = ({ size }: { size: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17V7"/></svg>
);

export default TopStats;