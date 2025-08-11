
import React from 'react';
import Card from '../../ui/Card';
import { useProductionStore } from '../../../store/useProductionStore';

const GaugeRing: React.FC<{ radius: number; stroke: number; progress: number; color: string }> = ({ radius, stroke, progress, color }) => {
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <circle
      stroke={color}
      fill="transparent"
      strokeWidth={stroke}
      strokeDasharray={circumference + ' ' + circumference}
      style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-out' }}
      r={normalizedRadius}
      cx={radius}
      cy={radius}
      transform={`rotate(-90 ${radius} ${radius})`}
    />
  );
};

const OeeGauge: React.FC = () => {
  const { oee, availability, performance, quality } = useProductionStore((state) => state.liveMetrics);

  const radius = 90;
  const stroke = 12;

  return (
    <Card className="flex flex-col items-center justify-center h-full">
      <div className="relative" style={{ width: radius * 2, height: radius * 2 }}>
        <svg height={radius * 2} width={radius * 2}>
          {/* Background ring */}
          <circle stroke="#374151" fill="transparent" strokeWidth={stroke} r={radius - stroke * 2} cx={radius} cy={radius} />
          {/* Main OEE ring */}
          <GaugeRing radius={radius} stroke={stroke} progress={oee} color="#3b82f6" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black text-white">{oee.toFixed(1)}%</span>
          <span className="text-sm font-semibold text-muted">OEE</span>
        </div>
      </div>
      <div className="flex justify-around w-full mt-4 text-center">
        <div>
          <p className="text-xs text-muted">Availability</p>
          <p className="text-lg font-bold text-info">{availability.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-xs text-muted">Performance</p>
          <p className="text-lg font-bold text-success">{performance.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-xs text-muted">Quality</p>
          <p className="text-lg font-bold text-secondary">{quality.toFixed(1)}%</p>
        </div>
      </div>
    </Card>
  );
};

export default OeeGauge;
