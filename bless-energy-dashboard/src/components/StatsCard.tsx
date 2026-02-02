'use client';

import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'gold' | 'green' | 'blue' | 'red';
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  color = 'gold',
}: StatsCardProps) {
  const colorBorders = {
    gold: 'border-gold/20 dark:border-gold/10 hover:border-gold/40',
    green: 'border-green-500/20 dark:border-green-500/10 hover:border-green-500/40',
    blue: 'border-blue-500/20 dark:border-blue-500/10 hover:border-blue-500/40',
    red: 'border-red-500/20 dark:border-red-500/10 hover:border-red-500/40',
  };

  const iconColors = {
    gold: 'text-gold',
    green: 'text-green-500',
    blue: 'text-blue-500',
    red: 'text-red-500',
  };

  const ringColors = {
    gold: 'ring-gold/20',
    green: 'ring-green-500/20',
    blue: 'ring-blue-500/20',
    red: 'ring-red-500/20',
  };

  return (
    <div
      className={`premium-card relative overflow-hidden rounded-2xl p-6 ${colorBorders[color]} bg-white dark:bg-white/[0.03] backdrop-blur-md group animate-fade-in`}
    >
      {/* Subtle glow effect */}
      <div className={`absolute -right-4 -top-4 w-24 h-24 blur-3xl opacity-10 dark:opacity-30 transition-opacity group-hover:opacity-40 rounded-full ${color === 'gold' ? 'bg-gold' : 'bg-' + color + '-500'}`} />

      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-1">
          <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">
            {title}
          </p>
          <div className="flex items-baseline gap-1">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gold transition-colors duration-300 tracking-tight drop-shadow-sm">
              {value}
            </h2>
          </div>

          {trend && (
            <div className={`mt-2 flex items-center gap-1.5 text-xs font-medium ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
              <span className={`px-1.5 py-0.5 rounded-md ${trend.isPositive ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                {trend.isPositive ? '↑' : '↓'} {trend.value}%
              </span>
              <span className="text-gray-400 dark:text-gray-500 font-normal">vs mes anterior</span>
            </div>
          )}
        </div>

        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ring-1 ${ringColors[color]} bg-gray-50 dark:bg-black/40 ${iconColors[color]}`}
        >
          <Icon className="w-6 h-6 stroke-[1.5]" />
        </div>
      </div>
    </div>
  );
}
