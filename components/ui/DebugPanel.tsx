import React, { useState, useEffect } from 'react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'error' | 'warning' | 'success';
  message: string;
  data?: any;
}

// Store global para logs (fora do componente para evitar re-renders)
let globalLogs: LogEntry[] = [];
let logListeners: ((logs: LogEntry[]) => void)[] = [];

const addGlobalLog = (level: LogEntry['level'], message: string, data?: any) => {
  const logEntry: LogEntry = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toLocaleTimeString(),
    level,
    message: message.substring(0, 500),
    data
  };

  globalLogs = [...globalLogs, logEntry].slice(-50); // Manter apenas os últimos 50
  logListeners.forEach(listener => listener(globalLogs));
};

// Função global para adicionar logs
(window as any).addDebugLog = addGlobalLog;

const DebugPanel: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isAutoScroll, setIsAutoScroll] = useState(true);

  useEffect(() => {
    // Adicionar listener para atualizações de logs
    const listener = (newLogs: LogEntry[]) => {
      setLogs(newLogs);
    };
    
    logListeners.push(listener);
    setLogs(globalLogs); // Carregar logs existentes

    return () => {
      logListeners = logListeners.filter(l => l !== listener);
    };
  }, []);

  useEffect(() => {
    if (isAutoScroll && logs.length > 0) {
      const debugPanel = document.getElementById('debug-panel');
      if (debugPanel) {
        setTimeout(() => {
          debugPanel.scrollTop = debugPanel.scrollHeight;
        }, 10);
      }
    }
  }, [logs, isAutoScroll]);

  const clearLogs = () => {
    globalLogs = [];
    logListeners.forEach(listener => listener([]));
  };

  const getLogColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      case 'success': return 'text-green-400';
      default: return 'text-gray-300';
    }
  };

  const addTestLog = () => {
    addGlobalLog('info', 'Teste de log do DebugPanel');
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg shadow-lg z-50"
      >
        🐛 Debug ({logs.length})
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-64 bg-surface border border-gray-600 rounded-lg shadow-lg z-50">
      <div className="flex items-center justify-between p-3 border-b border-gray-600">
        <h3 className="text-white font-semibold">🐛 Debug Panel</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={addTestLog}
            className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
          >
            Test
          </button>
          <label className="flex items-center gap-1 text-xs text-gray-300">
            <input
              type="checkbox"
              checked={isAutoScroll}
              onChange={(e) => setIsAutoScroll(e.target.checked)}
              className="w-3 h-3"
            />
            Auto-scroll
          </label>
          <button
            onClick={clearLogs}
            className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
          >
            Clear
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-xs bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded"
          >
            ✕
          </button>
        </div>
      </div>
      
      <div
        id="debug-panel"
        className="h-48 overflow-y-auto p-2 text-xs font-mono bg-background"
      >
        {logs.length === 0 ? (
          <div className="text-gray-500 text-center mt-8">
            Nenhum log ainda...
            <br />
            <small>Use (window as any).addDebugLog() para adicionar logs</small>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="mb-1 break-words">
              <span className="text-gray-500">[{log.timestamp}]</span>
              <span className={`ml-2 ${getLogColor(log.level)}`}>
                {log.message}
              </span>
              {log.data && (
                <pre className="mt-1 text-xs text-gray-400 bg-gray-800 p-1 rounded overflow-x-auto">
                  {JSON.stringify(log.data, null, 2)}
                </pre>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DebugPanel; 