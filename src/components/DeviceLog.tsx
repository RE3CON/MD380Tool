'use client';

import { useState, useRef, useEffect } from 'react';

interface LogEntry {
  timestamp: number;
  type: 'info' | 'error' | 'success' | 'warning' | 'data';
  message: string;
  data?: string;
}

interface DeviceLogProps {
  onFetchLog?: () => Promise<string>;
  isConnected: boolean;
}

export function DeviceLog({ onFetchLog, isConnected }: DeviceLogProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const addLog = (type: LogEntry['type'], message: string, data?: string) => {
    setLogs(prev => [...prev, {
      timestamp: Date.now(),
      type,
      message,
      data,
    }]);
  };

  const handleFetchLog = async () => {
    if (!isConnected || !onFetchLog) return;
    
    setIsFetching(true);
    addLog('info', 'Fetching device log...');
    
    try {
      const log = await onFetchLog();
      addLog('success', 'Log fetched successfully');
      
      // Parse and display log lines
      const lines = log.split('\n').filter(l => l.trim());
      lines.forEach((line, i) => {
        if (line.includes('error') || line.includes('ERROR')) {
          addLog('error', line);
        } else if (line.includes('warning') || line.includes('WARN')) {
          addLog('warning', line);
        } else if (line.length > 0) {
          addLog('info', line);
        }
      });
    } catch (err) {
      addLog('error', 'Failed to fetch log', err instanceof Error ? err.message : String(err));
    } finally {
      setIsFetching(false);
    }
  };

  const handleClear = () => {
    setLogs([]);
  };

  const handleExport = () => {
    const content = logs.map(l => {
      const time = new Date(l.timestamp).toISOString();
      return `[${time}] [${l.type.toUpperCase()}] ${l.message}${l.data ? '\n  ' + l.data : ''}`;
    }).join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `md380-log-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getTypeColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      case 'success': return 'text-green-400';
      case 'data': return 'text-blue-400';
      default: return 'text-neutral-300';
    }
  };

  return (
    <div className="bg-neutral-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Device Log (dmesg)</h3>
        
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-neutral-400">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={e => setAutoScroll(e.target.checked)}
              className="rounded"
            />
            Auto-scroll
          </label>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleFetchLog}
          disabled={!isConnected || isFetching}
          className="px-4 py-2 bg-blue-700 hover:bg-blue-600 disabled:bg-neutral-600 text-white rounded text-sm"
        >
          {isFetching ? 'Fetching...' : 'Fetch Log'}
        </button>
        <button
          onClick={handleClear}
          className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded text-sm"
        >
          Clear
        </button>
        <button
          onClick={handleExport}
          disabled={logs.length === 0}
          className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 disabled:bg-neutral-600 text-white rounded text-sm"
        >
          Export
        </button>
      </div>

      {/* Log Display */}
      <div
        ref={logContainerRef}
        className="bg-neutral-900 rounded p-4 h-64 overflow-auto font-mono text-xs"
      >
        {logs.length === 0 ? (
          <div className="text-neutral-500 text-center py-8">
            No logs yet. Click "Fetch Log" to retrieve device logs.
          </div>
        ) : (
          logs.map((log, i) => (
            <div key={i} className={`${getTypeColor(log.type)} mb-1`}>
              <span className="text-neutral-500">
                [{new Date(log.timestamp).toLocaleTimeString()}]
              </span>{' '}
              {log.message}
              {log.data && (
                <div className="text-neutral-500 ml-4 mt-1">
                  {log.data}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
