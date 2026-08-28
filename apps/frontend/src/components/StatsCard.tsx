import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: 'blue' | 'emerald' | 'amber' | 'purple' | 'rose' | 'sky';
  trend?: string;
  onClick?: () => void;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trend,
  onClick
}) => {
  const colorMap = {
    blue: 'from-blue-500/20 to-blue-600/5 text-blue-400 border-blue-500/20 hover:border-blue-500/50 hover:shadow-blue-500/10',
    emerald: 'from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/20 hover:border-emerald-500/50 hover:shadow-emerald-500/10',
    amber: 'from-amber-500/20 to-amber-600/5 text-amber-400 border-amber-500/20 hover:border-amber-500/50 hover:shadow-amber-500/10',
    purple: 'from-purple-500/20 to-purple-600/5 text-purple-400 border-purple-500/20 hover:border-purple-500/50 hover:shadow-purple-500/10',
    rose: 'from-rose-500/20 to-rose-600/5 text-rose-400 border-rose-500/20 hover:border-rose-500/50 hover:shadow-rose-500/10',
    sky: 'from-sky-500/20 to-sky-600/5 text-sky-400 border-sky-500/20 hover:border-sky-500/50 hover:shadow-sky-500/10'
  };

  const iconBgMap = {
    blue: 'bg-blue-500/20 text-blue-400',
    emerald: 'bg-emerald-500/20 text-emerald-400',
    amber: 'bg-amber-500/20 text-amber-400',
    purple: 'bg-purple-500/20 text-purple-400',
    rose: 'bg-rose-500/20 text-rose-400',
    sky: 'bg-sky-500/20 text-sky-400'
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-2xl bg-gradient-to-br ${colorMap[color]} border backdrop-blur-sm shadow-sm flex flex-col justify-between transition-all duration-200 group ${
        onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-300 tracking-wide flex items-center gap-1.5">
          {title}
          {onClick && (
            <span className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
              (বিস্তারিত দেখুন ➔)
            </span>
          )}
        </span>
        <div className={`p-2 rounded-xl ${iconBgMap[color]} transition group-hover:scale-110`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold font-display text-slate-100">{value}</div>
        {(subtitle || trend) && (
          <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
            <span>{subtitle}</span>
            {trend && <span className="text-emerald-400 font-semibold">{trend}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
