import React from 'react';
import { Code2, Sparkles, Terminal, Cpu } from 'lucide-react';

interface DeveloperBadgeProps {
  variant?: 'dark' | 'light';
  compact?: boolean;
}

export const DeveloperBadge: React.FC<DeveloperBadgeProps> = ({
  variant = 'dark',
  compact = false,
}) => {
  const isDark = variant === 'dark';

  return (
    <div
      className={`inline-flex flex-col items-center justify-center rounded-2xl border transition-all ${
        compact ? 'px-3.5 py-2 gap-1' : 'px-5 py-3 gap-1.5'
      } ${
        isDark
          ? 'bg-gradient-to-b from-slate-900 via-slate-900/95 to-blue-950/80 border-amber-400/25 shadow-lg shadow-black/30'
          : 'bg-gradient-to-b from-slate-50 via-white to-blue-50/70 border-blue-900/20 shadow-xs'
      }`}
    >
      {/* Catalog Brand Line */}
      <div className="flex items-center gap-1.5">
        <Sparkles
          size={12}
          className={isDark ? 'text-amber-400' : 'text-amber-600'}
        />
        <span
          className={`text-[11px] font-black tracking-wide ${
            isDark ? 'text-amber-300' : 'text-blue-950'
          }`}
        >
          كتالوج دريم
        </span>
      </div>

      {/* Developer Role & Name */}
      <div className="flex flex-col items-center leading-tight">
        <span
          className={`text-[10px] font-bold ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}
        >
          برمجة وتطوير
        </span>
        <span
          dir="ltr"
          className={`font-mono font-black tracking-wider ${
            compact ? 'text-xs' : 'text-sm'
          } ${
            isDark
              ? 'bg-gradient-to-r from-amber-300 via-yellow-200 to-sky-300 bg-clip-text text-transparent'
              : 'bg-gradient-to-r from-blue-950 via-indigo-800 to-blue-700 bg-clip-text text-transparent'
          }`}
        >
          SaJaOesalm
        </span>
      </div>

      {/* Iconic Emblem Underneath Developer Name */}
      <div className="flex items-center gap-1.5 pt-0.5">
        <span
          className={`h-px w-5 ${
            isDark ? 'bg-amber-400/35' : 'bg-blue-900/25'
          }`}
        />
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
            isDark
              ? 'bg-slate-800/90 border-amber-400/30 text-amber-300'
              : 'bg-blue-950 border-blue-900 text-amber-300'
          }`}
          title="SaJaOesalm - Developer & Architect"
        >
          <Terminal size={11} className="text-sky-300" />
          <Code2 size={13} className="text-amber-400" />
          <Cpu size={11} className="text-emerald-300" />
        </div>
        <span
          className={`h-px w-5 ${
            isDark ? 'bg-amber-400/35' : 'bg-blue-900/25'
          }`}
        />
      </div>
    </div>
  );
};
