import React, { useEffect, useState } from 'react';
import { ShiftEvent } from '../../../types';
import productionService from '../../../services/productionService';
import Card from '../../ui/Card';
import LoadingSpinner from '../../ui/LoadingSpinner';

interface ProductionHistoryProps {
  timesheetId: string;
}

const ProductionHistory: React.FC<ProductionHistoryProps> = ({ timesheetId }) => {
  const [events, setEvents] = useState<ShiftEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEvents = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const eventsData = await productionService.getShiftEvents(timesheetId);
        setEvents(eventsData);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Erro ao carregar histórico');
      } finally {
        setIsLoading(false);
      }
    };

    if (timesheetId) {
      loadEvents();
    }
  }, [timesheetId]);

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'SETUP':
        return (
          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'RUN':
        return (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'STOP':
        return (
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'PAUSE':
        return (
          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'RESUME':
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          </div>
        );
    }
  };

  const getEventTypeLabel = (eventType: string) => {
    switch (eventType) {
      case 'SETUP':
        return 'Setup';
      case 'RUN':
        return 'Produção Iniciada';
      case 'STOP':
        return 'Produção Parada';
      case 'PAUSE':
        return 'Produção Pausada';
      case 'RESUME':
        return 'Produção Retomada';
      default:
        return eventType;
    }
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'SETUP':
        return 'text-yellow-800 bg-yellow-100';
      case 'RUN':
        return 'text-green-800 bg-green-100';
      case 'STOP':
        return 'text-red-800 bg-red-100';
      case 'PAUSE':
        return 'text-orange-800 bg-orange-100';
      case 'RESUME':
        return 'text-blue-800 bg-blue-100';
      default:
        return 'text-gray-800 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <LoadingSpinner />
          <span className="ml-2 text-gray-600">Carregando histórico...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          <p>Erro ao carregar histórico: {error}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Histórico de Eventos
      </h3>

      {events.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <p>Nenhum evento registrado ainda</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event, index) => (
            <div key={event.id} className="flex items-start space-x-4">
              {/* Ícone do evento */}
              {getEventIcon(event.event_type)}
              
              {/* Conteúdo do evento */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEventTypeColor(event.event_type)}`}>
                    {getEventTypeLabel(event.event_type)}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(event.created_at).toLocaleString('pt-BR')}
                  </span>
                </div>
                
                {event.description && (
                  <p className="text-sm text-gray-700">{event.description}</p>
                )}
                
                {event.operator && (
                  <p className="text-xs text-gray-500 mt-1">
                    Operador: {event.operator}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default ProductionHistory; 