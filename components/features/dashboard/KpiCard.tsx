
import React from 'react';
import Card from '../../ui/Card';

interface KpiCardProps {
  title: string;
  value: string | number;
  valueClassName?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, valueClassName = 'text-white' }) => {
  return (
    <Card className="text-center">
      <p className="text-muted text-sm font-medium uppercase tracking-wider">{title}</p>
      <p className={`text-4xl font-bold mt-1 ${valueClassName}`}>{String(value).padStart(2, '0')}</p>
    </Card>
  );
};

export default KpiCard;
