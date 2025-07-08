import React from 'react';
import Card from '../../ui/Card';
import { DeviceFormData, ProductionLine, ConnectionTestResult } from '../../../types/device';

interface DeviceFormProps {
  formState: DeviceFormData;
  productionLines: ProductionLine[];
  connectionTestResult: ConnectionTestResult;
  isLoading: boolean;
  isFormDirty: boolean;
  isNewDevice: boolean;
  onUpdateField: (field: keyof DeviceFormData, value: string) => void;
  onTestConnection: () => void;
  onSave: () => void;
  onResetConnectionTest: () => void;
}

const DeviceForm: React.FC<DeviceFormProps> = ({
  formState,
  productionLines,
  connectionTestResult,
  isLoading,
  isFormDirty,
  isNewDevice,
  onUpdateField,
  onTestConnection,
  onSave,
  onResetConnectionTest
}) => {
  const isFormValid = formState.name && formState.lineId && formState.token && formState.equipmentId;

  if (!isNewDevice && !formState.name && !isLoading) {
    return (
      <Card className="text-center py-12">
        <div className="text-muted">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4">
            <rect width="20" height="14" x="2" y="3" rx="2"/>
            <line x1="8" x2="16" y1="21" y2="21"/>
            <line x1="12" x2="12" y1="17" y2="21"/>
          </svg>
          <h3 className="text-xl font-semibold text-white mb-2">Selecione um Dispositivo</h3>
          <p>Escolha um dispositivo da lista ao lado para editar suas configurações ou clique em "Adicionar Novo" para criar um novo dispositivo WBMS.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">
          {isNewDevice ? 'Novo Dispositivo WBMS' : 'Editar Dispositivo'}
        </h2>
        {isFormDirty && (
          <div className="text-sm text-yellow-400 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v4"/>
              <path d="M12 16h.01"/>
            </svg>
            Alterações não salvas
          </div>
        )}
      </div>

      {/* Seção: Informações Gerais */}
      <Card>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          Informações Gerais
        </h3>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="deviceName" className="block text-sm font-medium text-white mb-2">
              Nome do Dispositivo *
            </label>
            <input
              type="text"
              id="deviceName"
              value={formState.name}
              onChange={(e) => onUpdateField('name', e.target.value)}
              className="w-full px-4 py-3 bg-background border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Ex: Dispositivo Linha Principal"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="productionLine" className="block text-sm font-medium text-white mb-2">
              Linha Associada *
            </label>
            <select
              id="productionLine"
              value={formState.lineId}
              onChange={(e) => onUpdateField('lineId', e.target.value)}
              className="w-full px-4 py-3 bg-background border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={isLoading}
            >
              <option value="">Selecione uma linha de produção</option>
              {productionLines.map((line) => (
                <option key={line.id} value={line.id}>
                  {line.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Seção: Configuração da API WBMS */}
      <Card>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
          Configuração da API WBMS
        </h3>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="apiEndpoint" className="block text-sm font-medium text-white mb-2">
              Endpoint da API
            </label>
            <input
              type="url"
              id="apiEndpoint"
              value={formState.apiEndpoint}
              onChange={(e) => onUpdateField('apiEndpoint', e.target.value)}
              className="w-full px-4 py-3 bg-background border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="https://www.wbms.com.br/serv/apiWbms.php"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="token" className="block text-sm font-medium text-white mb-2">
              Token de Autenticação (tkn) *
            </label>
            <input
              type="password"
              id="token"
              value={formState.token}
              onChange={(e) => onUpdateField('token', e.target.value)}
              className="w-full px-4 py-3 bg-background border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Insira o token de autenticação"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="equipmentId" className="block text-sm font-medium text-white mb-2">
              ID do Equipamento (equ) *
            </label>
            <input
              type="text"
              id="equipmentId"
              value={formState.equipmentId}
              onChange={(e) => onUpdateField('equipmentId', e.target.value)}
              className="w-full px-4 py-3 bg-background border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Ex: Rivets_PH6601"
              disabled={isLoading}
            />
          </div>
        </div>
      </Card>

      {/* Seção: Ações e Diagnóstico */}
      <Card>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 12l2 2 4-4"/>
            <path d="M21 12c.552 0 1-.448 1-1V5c0-.552-.448-1-1-1H3c-.552 0-1 .448-1 1v6c0 .552.448 1 1 1"/>
            <path d="M3 12v6c0 .552.448 1 1 1h16c.552 0 1-.448 1-1v-6"/>
          </svg>
          Ações e Diagnóstico
        </h3>
        
        <div className="space-y-4">
          {/* Teste de Conexão */}
          <div>
            <div className="flex items-center gap-4 mb-3">
              <button
                onClick={onTestConnection}
                disabled={isLoading || !formState.token || !formState.equipmentId}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Testando...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12.55a8 8 0 0 1 14 0"/>
                      <path d="M2 8.82a15 15 0 0 1 20 0"/>
                      <path d="M8.5 16.42a4 4 0 0 1 7 0"/>
                      <line x1="12" x2="12.01" y1="20" y2="20"/>
                    </svg>
                    Testar Conexão
                  </>
                )}
              </button>
              
              {connectionTestResult.status !== 'idle' && (
                <button
                  onClick={onResetConnectionTest}
                  className="text-sm text-muted hover:text-white transition-colors"
                >
                  Limpar resultado
                </button>
              )}
            </div>
            
            {/* Resultado do Teste */}
            {connectionTestResult.status !== 'idle' && (
              <div className={`p-4 rounded-lg border ${
                connectionTestResult.status === 'success' 
                  ? 'bg-green-500/10 border-green-500 text-green-400' 
                  : 'bg-red-500/10 border-red-500 text-red-400'
              }`}>
                <div className="flex items-center gap-2">
                  {connectionTestResult.status === 'success' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="15" x2="9" y1="9" y2="15"/>
                      <line x1="9" x2="15" y1="9" y2="15"/>
                    </svg>
                  )}
                  <span className="font-medium">
                    {connectionTestResult.status === 'success' ? 'Sucesso' : 'Erro'}
                  </span>
                </div>
                <p className="mt-1 text-sm">{connectionTestResult.message}</p>
              </div>
            )}
          </div>

          {/* Botão Salvar */}
          <div className="pt-4 border-t border-gray-600">
            <button
              onClick={onSave}
              disabled={!isFormValid || !isFormDirty || isLoading}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Salvando...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                  </svg>
                  {isNewDevice ? 'Criar Dispositivo' : 'Salvar Alterações'}
                </>
              )}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DeviceForm; 