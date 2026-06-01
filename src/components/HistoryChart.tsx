import React, { useEffect, useState } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

type MetricInfo = {
  key: string;
  label: string;
  color: string;
  fill: string;
  isLine?: boolean;
};

const METRICS: MetricInfo[] = [
  { key: 'level', label: 'Poziom', color: '#fbbf24', fill: '#78350f', isLine: true },
  { key: 'STR', label: 'Siła (STR)', color: '#f87171', fill: '#721c24', isLine: true },
  { key: 'AGILITY', label: 'Zwinność (AGI)', color: '#60a5fa', fill: '#1e3a8a', isLine: true },
  { key: 'VITALITY', label: 'Witalność (VIT)', color: '#34d399', fill: '#064e3b', isLine: true },
  { key: 'INTELLIGENCE', label: 'Inteligencja (INT)', color: '#a78bfa', fill: '#4c1d95', isLine: true },
  { key: 'SENSE', label: 'Zmysł (SEN)', color: '#f472b6', fill: '#831843', isLine: true },
  { key: 'xpGained', label: 'Zysk XP', color: '#3b82f6', fill: '#1e3a8a' },
  { key: 'pushups', label: 'Pompki', color: '#ef4444', fill: '#7f1d1d' },
  { key: 'situps', label: 'Brzuszki', color: '#f59e0b', fill: '#78350f' },
  { key: 'squats', label: 'Przysiady', color: '#10b981', fill: '#064e3b' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#02040a]/90 border border-white/10 p-3 shadow-xl rounded-sm">
        <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest mb-2 border-b border-white/5 pb-2">
          Data: <span className="text-zinc-200">{label}</span>
        </p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex flex-col gap-1">
             <span className="text-[10px] uppercase tracking-wider text-zinc-400">{entry.name}</span>
             <span className="text-lg font-mono font-bold" style={{ color: entry.color }}>{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function HistoryChart() {
  const [data, setData] = useState<any[]>([]);
  const [activeMetric, setActiveMetric] = useState<string>('xpGained');

  useEffect(() => {
    try {
      const historyStr = localStorage.getItem("sololeveler_history_data") || "{}";
      const historyData = JSON.parse(historyStr);
      const docs = Object.values(historyData).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setData(docs);
    } catch {
      setData([]);
    }
  }, []);

  if (data.length === 0) {
    return (
      <div className="text-center py-10 text-zinc-500 uppercase tracking-widest text-sm font-mono border border-white/5 bg-black/20 m-4 rounded-sm">
        Brak danych z poprzednich dni. Walcz dalej.
      </div>
    );
  }

  const metric = METRICS.find(m => m.key === activeMetric)!;

  return (
    <div className="w-full mt-2 font-mono">
      <div className="flex flex-wrap gap-2 mb-8">
        {METRICS.map(m => (
          <button
            key={m.key}
            onClick={() => setActiveMetric(m.key)}
            className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all duration-300 ${
              activeMetric === m.key 
                ? 'bg-zinc-800 text-zinc-100 shadow-[0_4px_12px_rgba(0,0,0,0.5)]' 
                : 'bg-black/40 text-zinc-600 hover:text-zinc-300 hover:bg-zinc-900/50'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      
      <div className="h-64 sm:h-96 w-full px-2">
        <ResponsiveContainer width="100%" height="100%">
          {metric.isLine ? (
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis 
                dataKey="date" 
                stroke="#3f3f46" 
                tick={{ fill: '#71717a', fontSize: 10 }} 
                tickMargin={10}
                tickFormatter={(date) => date.split('-').slice(1).reverse().join('/')}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                stroke="#3f3f46" 
                tick={{ fill: '#71717a', fontSize: 10 }} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey={metric.key} 
                name={metric.label}
                stroke={metric.color} 
                strokeWidth={2} 
                dot={{ fill: '#18181b', stroke: metric.color, strokeWidth: 2, r: 4 }} 
                activeDot={{ r: 6, fill: metric.color, stroke: '#000', strokeWidth: 2 }} 
                animationDuration={1500}
              />
            </LineChart>
          ) : (
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={`color-${metric.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={metric.color} stopOpacity={0.4}/>
                  <stop offset="95%" stopColor={metric.color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                stroke="#3f3f46" 
                tick={{ fill: '#71717a', fontSize: 10 }} 
                tickMargin={10}
                tickFormatter={(date) => date.split('-').slice(1).reverse().join('/')}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                stroke="#3f3f46" 
                tick={{ fill: '#71717a', fontSize: 10 }} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey={metric.key} 
                name={metric.label}
                stroke={metric.color} 
                fillOpacity={1} 
                fill={`url(#color-${metric.key})`} 
                strokeWidth={2} 
                animationDuration={1500}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
