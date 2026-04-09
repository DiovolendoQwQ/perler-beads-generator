import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { List, Hash } from 'lucide-react';
import { palettes } from '../data/palettes';

export default function MaterialStats() {
  const { beadCounts, selectedBrand } = useAppStore();
  const currentPalette = palettes[selectedBrand] || [];

  const statsList = Object.entries(beadCounts)
    .sort(([, countA], [, countB]) => (countB as number) - (countA as number))
    .map(([code, count]) => {
      const colorInfo = currentPalette.find(c => c.code === code);
      return { code, count: count as number, hex: colorInfo?.hex || '#ccc' };
    });

  const totalBeads = statsList.reduce((acc, item) => acc + item.count, 0);

  if (statsList.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-4 lg:p-5 flex flex-col gap-4 flex-1 lg:min-h-0">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100 shrink-0">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <List className="w-5 h-5 text-zinc-500" />
          耗材清单
        </h2>
        <span className="text-xs font-medium text-zinc-500 bg-zinc-100 px-2 py-1 rounded-full">
          总计: {totalBeads} 颗
        </span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 lg:pr-2 space-y-2">
        {statsList.map((item) => (
          <div key={item.code} className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-50 border border-transparent hover:border-zinc-100 transition-colors">
            <div className="flex items-center gap-3">
              <div 
                className="w-6 h-6 rounded-full border shadow-inner flex items-center justify-center text-[8px] font-bold text-white/80 mix-blend-difference"
                style={{ backgroundColor: item.hex, borderColor: 'rgba(0,0,0,0.1)' }}
              >
              </div>
              <span className="font-medium text-sm text-zinc-700 flex items-center gap-1">
                <Hash className="w-3 h-3 text-zinc-400" />
                {item.code}
              </span>
            </div>
            <span className="text-sm font-bold text-zinc-600 tabular-nums">
              {item.count} <span className="text-xs font-normal text-zinc-400">颗</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
