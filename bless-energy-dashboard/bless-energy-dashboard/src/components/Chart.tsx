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

interface ChartProps {
  data: any[];
  type: 'area' | 'bar' | 'pie';
  dataKey: string;
  xAxisKey?: string;
  title?: string;
  color?: string;
}

// Colores específicos: Calculadora = Amarillo/Dorado, Formulario = Verde
const SOURCE_COLORS: Record<string, string> = {
  'Calculadora': '#F59E0B', // Amarillo
  'Formulario': '#10B981',  // Verde
};

const DEFAULT_COLORS = ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

export default function Chart({
  data,
  type,
  dataKey,
  xAxisKey = 'name',
  title,
  color = '#D4AF37',
}: ChartProps) {
  // Get color for each data item based on name
  const getColor = (item: any, index: number): string => {
    if (item.name && SOURCE_COLORS[item.name]) {
      return SOURCE_COLORS[item.name];
    }
    return DEFAULT_COLORS[index % DEFAULT_COLORS.length];
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      return (
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gold/30 rounded-lg p-3 shadow-lg">
          <p className="text-gray-700 dark:text-gray-300 text-sm font-medium">{item.name || label}</p>
          <p className="text-lg font-bold" style={{ color: item.payload?.fill || '#D4AF37' }}>
            {item.value} leads
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom legend for pie chart
  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex justify-center gap-6 mt-4">
        {payload?.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {entry.value}: <span className="font-semibold">{data[index]?.value || 0}</span>
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-black/30 border border-gray-200 dark:border-gold/20 rounded-xl p-6 shadow-sm">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      )}
      <div className={type === 'pie' ? 'h-72' : 'h-64'}>
        <ResponsiveContainer width="100%" height="100%">
          {type === 'area' ? (
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis dataKey={xAxisKey} className="text-gray-600 dark:text-gray-400" stroke="#888" fontSize={12} />
              <YAxis className="text-gray-600 dark:text-gray-400" stroke="#888" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={2}
                fill="url(#colorGradient)"
              />
            </AreaChart>
          ) : type === 'bar' ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis dataKey={xAxisKey} stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
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
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey={dataKey}
                nameKey="name"
                label={({ name, value, percent }) => `${value} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                labelLine={true}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getColor(entry, index)}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
