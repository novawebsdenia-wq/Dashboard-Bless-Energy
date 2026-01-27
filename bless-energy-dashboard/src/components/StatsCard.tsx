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
  const colorClasses = {
    gold: 'bg-white dark:bg-gradient-to-br dark:from-gold/20 dark:to-gold/5 border-gold/30 shadow-sm',
    green: 'bg-white dark:bg-gradient-to-br dark:from-green-500/20 dark:to-green-500/5 border-green-500/30 shadow-sm',
    blue: 'bg-white dark:bg-gradient-to-br dark:from-blue-500/20 dark:to-blue-500/5 border-blue-500/30 shadow-sm',
    red: 'bg-white dark:bg-gradient-to-br dark:from-red-500/20 dark:to-red-500/5 border-red-500/30 shadow-sm',
  };

  const iconColorClasses = {
    gold: 'text-gold',
    green: 'text-green-500',
    blue: 'text-blue-500',
    red: 'text-red-500',
  };

  const iconBgClasses = {
    gold: 'bg-gold/10 dark:bg-black/30',
    green: 'bg-green-500/10 dark:bg-black/30',
    blue: 'bg-blue-500/10 dark:bg-black/30',
    red: 'bg-red-500/10 dark:bg-black/30',
  };

  return (
    <div
      className={`${colorClasses[color]} border rounded-xl p-6 transition-transform hover:scale-[1.02]`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
          {trend && (
            <p
              className={`text-sm mt-2 ${
                trend.isPositive ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {trend.isPositive ? '+' : '-'}{trend.value}% vs mes anterior
            </p>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-lg ${iconBgClasses[color]} flex items-center justify-center ${iconColorClasses[color]}`}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
