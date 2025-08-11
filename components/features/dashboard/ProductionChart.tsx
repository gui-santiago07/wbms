
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Card from '../../ui/Card';

const data = [
  { name: '1h', Boas: 4.2, Rejeitos: 0.1 },
  { name: '2h', Boas: 5.1, Rejeitos: 0.2 },
  { name: '3h', Boas: 3.5, Rejeitos: 0.1 },
  { name: '4h', Boas: 4.8, Rejeitos: 0.4 },
  { name: '5h', Boas: 2.5, Rejeitos: 0.1 },
];

const ProductionChart: React.FC = () => {
  return (
    <Card className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '0.5rem',
            }}
            cursor={{ fill: 'rgba(107, 114, 128, 0.1)' }}
          />
          <Legend wrapperStyle={{fontSize: "12px"}}/>
          <Bar dataKey="Boas" fill="#22c55e" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Rejeitos" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default ProductionChart;
