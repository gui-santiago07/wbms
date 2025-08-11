import React from 'react';
import { Timesheet, ProductionStatus as ProductionStatusType } from '../../../types';
import Card from '../../ui/Card';

interface ProductionStatusProps {
  timesheet: Timesheet;
  status: ProductionStatusType;
}

const ProductionStatus: React.FC<ProductionStatusProps> = ({ timesheet, status }) => {
  const getStatusColor = (machineStatus: string) => {
    switch (machineStatus) {
      case 'RUNNING':
        return 'text-green-600 bg-green-100';
      case 'STOPPED':
        return 'text-red-600 bg-red-100';
      case 'SETUP':
        return 'text-yellow-600 bg-yellow-100';
      case 'PAUSED':
        return 'text-orange-600 bg-orange-100';
      case 'STANDBY':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (machineStatus: string) => {
    switch (machineStatus) {
      case 'RUNNING':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
          </svg>
        );
      case 'STOPPED':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
          </svg>
        );
      case 'SETUP':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
        );
      case 'PAUSED':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <Card className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Status da Máquina */}
        <div className="text-center">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status.machine_status)}`}>
            {getStatusIcon(status.machine_status)}
            <span className="ml-2 capitalize">{status.machine_status.toLowerCase()}</span>
          </div>
          <p className="text-sm text-gray-600 mt-2">Status da Máquina</p>
        </div>

        {/* Produção Total */}
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{status.total_produced}</div>
          <p className="text-sm text-gray-600">Total Produzido</p>
        </div>

        {/* Produção Boa */}
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{status.good_produced}</div>
          <p className="text-sm text-gray-600">Produção Boa</p>
        </div>

        {/* Rejeitos */}
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{status.rejects}</div>
          <p className="text-sm text-gray-600">Rejeitos</p>
        </div>
      </div>

      {/* Informações do Turno */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-900">Linha de Produção</p>
            <p className="text-sm text-gray-600">{timesheet.line_name}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Produto</p>
            <p className="text-sm text-gray-600">{timesheet.product_name}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Início do Turno</p>
            <p className="text-sm text-gray-600">
              {new Date(timesheet.start_time).toLocaleString('pt-BR')}
            </p>
          </div>
        </div>
      </div>

      {/* Métricas OEE */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Indicadores OEE</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {(status.oee.overall * 100).toFixed(1)}%
            </div>
            <p className="text-sm text-gray-600">OEE Geral</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {(status.oee.availability * 100).toFixed(1)}%
            </div>
            <p className="text-sm text-gray-600">Disponibilidade</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {(status.oee.performance * 100).toFixed(1)}%
            </div>
            <p className="text-sm text-gray-600">Performance</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {(status.oee.quality * 100).toFixed(1)}%
            </div>
            <p className="text-sm text-gray-600">Qualidade</p>
          </div>
        </div>
      </div>

      {/* Velocidade e Tempos */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-900">Velocidade Atual</p>
            <p className="text-lg font-semibold text-gray-900">{status.current_speed} un/h</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Velocidade Meta</p>
            <p className="text-lg font-semibold text-gray-900">{status.target_speed} un/h</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Tempo Ativo</p>
            <p className="text-lg font-semibold text-green-600">{status.uptime}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Tempo Parado</p>
            <p className="text-lg font-semibold text-red-600">{status.downtime}</p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ProductionStatus; 