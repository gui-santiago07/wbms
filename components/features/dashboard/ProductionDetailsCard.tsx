import React from 'react';
import Card from '../../ui/Card';
import LoadingSpinner from '../../ui/LoadingSpinner';

interface ProductionDetailsCardProps {
  productionDetails: {
    turno: string;
    ordemProducao: string;
    quantidadeOP: number;
    productCode: string;
    productId: string;
    operator: string;
    line: string;
    shiftTarget: number;
  } | null;
  isLoading: boolean;
  currentShiftName?: string;
}

const ProductionDetailsCard: React.FC<ProductionDetailsCardProps> = ({
  productionDetails,
  isLoading,
  currentShiftName
}) => {
  return (
    <Card className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Production Details</h3>
        <span className="text-sm font-semibold text-blue-400">
          {productionDetails?.turno || currentShiftName || 'Turno Ativo'}
        </span>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="sm" />
          <span className="text-sm text-muted ml-2">Carregando detalhes...</span>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted">Ordem de Produção</span>
            <span className="text-sm font-semibold text-white">
              {productionDetails?.ordemProducao || 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted">Quantidade OP</span>
            <span className="text-sm font-semibold text-white">
              {productionDetails?.quantidadeOP || 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted">Product Code</span>
            <span className="text-sm font-semibold text-white">
              {productionDetails?.productCode || 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted">Product ID</span>
            <span className="text-sm font-semibold text-white">
              {productionDetails?.productId || 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted">Operador</span>
            <span className="text-sm font-semibold text-white">
              {productionDetails?.operator || 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted">Linha</span>
            <span className="text-sm font-semibold text-white">
              {productionDetails?.line || 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted">Meta do Turno</span>
            <span className="text-sm font-semibold text-white">
              {productionDetails?.shiftTarget || 'N/A'}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ProductionDetailsCard; 