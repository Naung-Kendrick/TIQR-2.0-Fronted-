import React from 'react';
import { FileSpreadsheet, CheckCircle2, AlertOctagon } from 'lucide-react';
import { ValidationSummaryStats } from '../../lib/dataChecker/types';

interface CheckerSummaryCardsProps {
  summary: ValidationSummaryStats;
  activeFilter: string;
  onSelectFilter: (filter: string) => void;
}

export const CheckerSummaryCards: React.FC<CheckerSummaryCardsProps> = ({
  summary,
  activeFilter,
  onSelectFilter
}) => {
  const total = summary.totalRecords;
  const passPct = total > 0 ? `${((summary.validRecords / total) * 100).toFixed(1)}%` : null;
  const failPct = total > 0 ? `${((summary.recordsWithErrors / total) * 100).toFixed(1)}%` : null;

  const cards = [
    {
      id: 'ALL',
      label: 'All Records',
      value: summary.totalRecords,
      icon: FileSpreadsheet,
      badge: 'ALL',
      badgeClass: 'bg-[#1A1A1A] text-white',
      borderActive: 'border-[#1A1A1A] ring-1 ring-[#1A1A1A]',
      pct: total > 0 ? '100%' : null,
    },
    {
      id: 'PASS',
      label: 'Pass',
      value: summary.validRecords,
      icon: CheckCircle2,
      badge: 'PASS',
      badgeClass: 'bg-emerald-600 text-white',
      borderActive: 'border-emerald-600 ring-1 ring-emerald-600',
      pct: passPct,
    },
    {
      id: 'FAIL',
      label: 'Fail',
      value: summary.recordsWithErrors,
      icon: AlertOctagon,
      badge: 'FAIL',
      badgeClass: 'bg-red-600 text-white',
      borderActive: 'border-red-600 ring-1 ring-red-600',
      pct: failPct,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected = activeFilter === card.id;

        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelectFilter(card.id)}
            className={`p-4 sm:p-5 bg-white border text-left transition-all cursor-pointer flex flex-col gap-3 group ${
              isSelected
                ? `${card.borderActive} shadow-sm`
                : 'border-[#E5E7EB] hover:border-[#1A1A1A]/40 hover:shadow-sm'
            }`}
          >
            {/* Badge + Icon row */}
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 ${card.badgeClass}`}>
                {card.badge}
              </span>
              <Icon
                size={18}
                className={`transition-colors ${
                  isSelected ? 'text-[#1A1A1A]' : 'text-[#B0B0B0] group-hover:text-[#1A1A1A]'
                }`}
              />
            </div>

            {/* Big number */}
            <div className="font-mono text-4xl sm:text-5xl font-black text-[#1A1A1A] tracking-tight leading-none">
              {card.value.toLocaleString()}
            </div>

            {/* Label + Percentage */}
            <div className="flex items-center justify-between text-[11px] font-bold text-[#737373] uppercase tracking-widest border-t border-[#E5E7EB] pt-2">
              <span>{card.label}</span>
              {card.pct && (
                <span className="font-mono text-[10px] text-[#737373]/80 lowercase">
                  {card.pct}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};
