'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number | boolean | null | undefined;
}

interface ChartProps {
  data: ChartDataPoint[];
  type: 'area' | 'bar' | 'pie';
  dataKey: string;
  xAxisKey?: string;
  title?: string;
  color?: string;
}

// Colores corporativos Bless Energy
const SOURCE_COLORS: Record<string, string> = {
  'Calculadora': '#D4AF37', // Oro Principal
  'Formulario': '#10B981',  // Verde Leads
};

const DEFAULT_COLORS = ['#D4AF37', '#B8860B', '#10B981', '#3B82F6', '#6366F1'];

interface RechartsPayloadItem {
  payload: ChartDataPoint;
  color?: string;
  fill?: string;
  value?: number;
  name?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: RechartsPayloadItem[];
  label?: string;
}

// Custom components for Recharts
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="glass shadow-2xl rounded-2xl p-4 border border-gold/20 animate-in fade-in zoom-in-95 duration-200">
        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">
          {item.payload?.name || label}
        </p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: String(item.payload?.fill || item.color || '#D4AF37') }} />
          <p className="text-xl font-black text-white">
            {item.value} <span className="text-sm font-normal text-gray-500">leads</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

interface LegendPayloadItem {
  value: string;
  color?: string;
}

interface CustomLegendProps {
  payload?: LegendPayloadItem[];
  chartData?: ChartDataPoint[];
}

const CustomLegend = ({ payload, chartData }: CustomLegendProps) => {
  return (
    <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 mt-6">
      {payload?.map((entry, index) => (
        <div key={index} className="flex items-center gap-2.5 group cursor-default">
          <div
            className="w-3 h-3 rounded-full shadow-sm transition-transform group-hover:scale-125"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 group-hover:text-gold transition-colors">
            {entry.value}: <span className="text-gray-900 dark:text-white ml-1">{chartData?.[index]?.value || 0}</span>
          </span>
        </div>
      ))}
    </div>
  );
};

export default function Chart({
  data,
  type,
  dataKey,
  xAxisKey = 'name',
  title,
  color = '#D4AF37',
}: ChartProps) {
  const getColor = (item: ChartDataPoint, index: number): string => {
    if (item.name && SOURCE_COLORS[item.name]) {
      return SOURCE_COLORS[item.name];
    }
    return DEFAULT_COLORS[index % DEFAULT_COLORS.length];
  };

  return (
    <div className="premium-card bg-white dark:bg-black/30 border border-gray-100 dark:border-gold/10 rounded-2xl p-8 animate-fade-in relative overflow-hidden">
      {/* Background glow Decor */}
      <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-gold/5 blur-3xl rounded-full pointer-events-none" />

      {title && (
        <h3 className="text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-8 relative z-10">
          {title}
        </h3>
      )}
      <div className={`${type === 'pie' ? 'h-80' : 'h-64'} relative z-10`}>
        <ResponsiveContainer width="100%" height="100%">
          {type === 'area' ? (
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(212, 175, 55, 0.05)" />
              <XAxis
                dataKey={xAxisKey}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 10, fontWeight: 600 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 10, fontWeight: 600 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(212, 175, 55, 0.2)', strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={3}
                fill="url(#colorGradient)"
                animationDuration={1500}
              />
            </AreaChart>
          ) : type === 'bar' ? (
            <BarChart data={data} barSize={32}>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(212, 175, 55, 0.05)" />
              <XAxis
                dataKey={xAxisKey}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 10, fontWeight: 600 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 10, fontWeight: 600 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(212, 175, 55, 0.03)' }} />
              <Bar dataKey={dataKey} radius={[6, 6, 0, 0]} animationDuration={1500}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColor(entry, index)} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="45%"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={8}
                dataKey={dataKey}
                nameKey="name"
                animationDuration={1500}
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getColor(entry, index)}
                    className="hover:opacity-80 transition-opacity outline-none"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend chartData={data} />} verticalAlign="bottom" />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
