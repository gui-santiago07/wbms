import React, { useState } from 'react';
import TimelineService from '../../services/timelineService';

const DebugPanel: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlantId, setSelectedPlantId] = useState<string>('');
  const [selectedSectorId, setSelectedSectorId] = useState<string>('');

  const testPlantsAPI = async () => {
    setIsLoading(true);
    setTestResult('Testando API de plantas...');
    
    try {
      const timelineService = new TimelineService();
      const plants = await timelineService.getPlants();
      
      if (plants.length > 0) {
        setSelectedPlantId(plants[0].id);
        setTestResult(`✅ Sucesso! ${plants.length} plantas encontradas:\n${plants.map(p => `- ${p.name} (ID: ${p.id})`).join('\n')}`);
      } else {
        setTestResult('⚠️ Nenhuma planta encontrada. Verifique as permissões do usuário.');
      }
    } catch (error) {
      console.error('Erro no teste de plantas:', error);
      setTestResult(`❌ Erro ao buscar plantas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testSectorsAPI = async () => {
    if (!selectedPlantId) {
      setTestResult('❌ Selecione uma planta primeiro!');
      return;
    }
    
    setIsLoading(true);
    setTestResult('Testando API de setores...');
    
    try {
      const timelineService = new TimelineService();
      const sectors = await timelineService.getSectors(selectedPlantId);
      
      if (sectors.length > 0) {
        setSelectedSectorId(sectors[0].id);
        setTestResult(`✅ Sucesso! ${sectors.length} setores encontrados para planta ${selectedPlantId}:\n${sectors.map(s => `- ${s.name} (ID: ${s.id})`).join('\n')}`);
      } else {
        setTestResult(`⚠️ Nenhum setor encontrado para a planta ${selectedPlantId}. Verifique as permissões.`);
      }
    } catch (error) {
      console.error('Erro no teste de setores:', error);
      setTestResult(`❌ Erro ao buscar setores: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testLinesAPI = async () => {
    if (!selectedSectorId) {
      setTestResult('❌ Selecione um setor primeiro!');
      return;
    }
    
    setIsLoading(true);
    setTestResult('Testando API de linhas...');
    
    try {
      const timelineService = new TimelineService();
      const lines = await timelineService.getLines(selectedSectorId);
      
      if (lines.length > 0) {
        setTestResult(`✅ Sucesso! ${lines.length} linhas encontradas para setor ${selectedSectorId}:\n${lines.map(l => `- ${l.name} (ID: ${l.id})`).join('\n')}`);
      } else {
        setTestResult(`⚠️ Nenhuma linha encontrada para o setor ${selectedSectorId}. Verifique as permissões.`);
      }
    } catch (error) {
      console.error('Erro no teste de linhas:', error);
      setTestResult(`❌ Erro ao buscar linhas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testAllAPIs = async () => {
    setIsLoading(true);
    setTestResult('Testando todas as APIs em sequência...\n\n');
    
    try {
      const timelineService = new TimelineService();
      
      // Teste 1: Plantas
      setTestResult(prev => prev + '1. Testando plantas...\n');
      const plants = await timelineService.getPlants();
      setTestResult(prev => prev + `✅ ${plants.length} plantas encontradas\n\n`);
      
      if (plants.length === 0) {
        setTestResult(prev => prev + '❌ Parando testes - nenhuma planta disponível\n');
        return;
      }
      
      // Teste 2: Setores
      setTestResult(prev => prev + '2. Testando setores...\n');
      const sectors = await timelineService.getSectors(plants[0].id);
      setTestResult(prev => prev + `✅ ${sectors.length} setores encontrados\n\n`);
      
      if (sectors.length === 0) {
        setTestResult(prev => prev + '❌ Parando testes - nenhum setor disponível\n');
        return;
      }
      
      // Teste 3: Linhas
      setTestResult(prev => prev + '3. Testando linhas...\n');
      const lines = await timelineService.getLines(sectors[0].id);
      setTestResult(prev => prev + `✅ ${lines.length} linhas encontradas\n\n`);
      
      setTestResult(prev => prev + '🎉 Todos os testes passaram com sucesso!');
      
    } catch (error) {
      console.error('Erro no teste completo:', error);
      setTestResult(prev => prev + `❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

    return (
    <div className="bg-gray-100 p-4 rounded-lg mb-4">
      <h3 className="text-lg font-semibold mb-2">🔧 Debug Panel - API Option7</h3>
      
      <div className="space-y-2 mb-4">
      <button
          onClick={testPlantsAPI}
          disabled={isLoading}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 disabled:opacity-50"
      >
          Testar API Plantas
      </button>

          <button
          onClick={testSectorsAPI}
          disabled={isLoading || !selectedPlantId}
          className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 disabled:opacity-50 ml-2"
          >
          Testar API Setores
          </button>
        
          <button
          onClick={testLinesAPI}
          disabled={isLoading || !selectedSectorId}
          className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600 disabled:opacity-50 ml-2"
          >
          Testar API Linhas
          </button>
        
          <button
          onClick={testAllAPIs}
          disabled={isLoading}
          className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600 disabled:opacity-50 ml-2"
          >
          Testar Todas as APIs
          </button>
        </div>
      
      <div className="text-xs text-gray-600 mb-2">
        <strong>IDs Selecionados:</strong> Planta: {selectedPlantId || 'Nenhuma'} | Setor: {selectedSectorId || 'Nenhum'}
      </div>
      
      {testResult && (
        <div className="mt-3 p-2 bg-white rounded border">
          <pre className="text-sm whitespace-pre-wrap">{testResult}</pre>
            </div>
        )}
    </div>
  );
};

export default DebugPanel; 