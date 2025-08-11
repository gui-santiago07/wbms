
import React from 'react';
import Card from '../../ui/Card';

interface KpiCardProps {
  title: string;
  value: string | number;
  valueClassName?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, valueClassName = 'text-white' }) => {
  return (
    <Card className="text-center p-3">
      <p className="text-muted text-xs font-medium uppercase tracking-wider">{title}</p>
      <p className={`text-3xl font-bold mt-1 ${valueClassName}`}>{String(value).padStart(2, '0')}</p>
    </Card>
  );
};

export default KpiCard;
