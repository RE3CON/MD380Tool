'use client';

import { useState, useCallback, useMemo } from 'react';
import { 
  parseCodeplug, 
  serializeCodeplug, 
  createEmptyCodeplug,
  CODEPLUG_SIZE,
  type CodeplugData,
  type Channel,
  type DigitalContact,
  type Zone 
} from '@/lib/md380';
import { ProgressBar } from './DeviceConnector';

interface CodeplugEditorProps {
  onReadFromRadio: () => Promise<Uint8Array>;
  onWriteToRadio: (data: Uint8Array) => Promise<boolean>;
  isConnected: boolean;
}

type TabType = 'channels' | 'contacts' | 'zones' | 'hex';

export function CodeplugEditor({ onReadFromRadio, onWriteToRadio, isConnected }: CodeplugEditorProps) {
  const [codeplug, setCodeplug] = useState<CodeplugData | null>(null);
  const [rawData, setRawData] = useState<Uint8Array | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('channels');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRead = useCallback(async () => {
    if (!isConnected) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await onReadFromRadio();
      setRawData(data);
      const parsed = parseCodeplug(data);
      setCodeplug(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read codeplug');
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, onReadFromRadio]);

  const handleWrite = useCallback(async () => {
    if (!isConnected || !codeplug) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      const data = serializeCodeplug(codeplug);
      const success = await onWriteToRadio(data);
      if (!success) {
        setError('Failed to write codeplug to radio');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to write codeplug');
    } finally {
      setIsSaving(false);
    }
  }, [isConnected, codeplug, onWriteToRadio]);

  const handleFileLoad = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      if (buffer) {
        const data = new Uint8Array(buffer);
        setRawData(data);
        try {
          const parsed = parseCodeplug(data);
          setCodeplug(parsed);
        } catch (err) {
          setError('Invalid codeplug file format');
        }
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleFileSave = useCallback(() => {
    if (!codeplug) return;
    
    const data = serializeCodeplug(codeplug);
    const blob = new Blob([new Uint8Array(data)], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'md380_codeplug.bin';
    a.click();
    URL.revokeObjectURL(url);
  }, [codeplug]);

  const hexView = useMemo(() => {
    if (!rawData) return '';
    
    const lines: string[] = [];
    const bytesPerLine = 16;
    
    for (let i = 0; i < rawData.length; i += bytesPerLine) {
      const offset = i.toString(16).padStart(8, '0');
      const hex = Array.from(rawData.slice(i, i + bytesPerLine))
        .map(b => b.toString(16).padStart(2, '0'))
        .join(' ');
      const ascii = Array.from(rawData.slice(i, i + bytesPerLine))
        .map(b => b >= 32 && b < 127 ? String.fromCharCode(b) : '.')
        .join('');
      
      lines.push(`${offset}  ${hex.padEnd(48)}  ${ascii}`);
    }
    
    return lines.join('\n');
  }, [rawData]);

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: 'channels', label: 'Channels', count: codeplug?.channels.length },
    { id: 'contacts', label: 'Contacts', count: codeplug?.contacts.length },
    { id: 'zones', label: 'Zones', count: codeplug?.zones.length },
    { id: 'hex', label: 'Hex View' },
  ];

  return (
    <div className="bg-neutral-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Codeplug Editor</h2>
        
        <div className="flex gap-2">
          <label className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded cursor-pointer transition-colors">
            Load File
            <input type="file" accept=".bin,.rdt" className="hidden" onChange={handleFileLoad} />
          </label>
          
          <button
            onClick={handleRead}
            disabled={!isConnected || isLoading}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-600 disabled:bg-neutral-600 text-white rounded transition-colors"
          >
            {isLoading ? 'Reading...' : 'Read from Radio'}
          </button>
          
          <button
            onClick={handleFileSave}
            disabled={!codeplug}
            className="px-4 py-2 bg-green-700 hover:bg-green-600 disabled:bg-neutral-600 text-white rounded transition-colors"
          >
            Save File
          </button>
          
          <button
            onClick={handleWrite}
            disabled={!isConnected || !codeplug || isSaving}
            className="px-4 py-2 bg-purple-700 hover:bg-purple-600 disabled:bg-neutral-600 text-white rounded transition-colors"
          >
            {isSaving ? 'Writing...' : 'Write to Radio'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-200 text-sm">
          {error}
        </div>
      )}

      {rawData && (
        <div className="text-sm text-neutral-400 mb-4">
          Loaded: {formatBytes(rawData.length)} / {formatBytes(CODEPLUG_SIZE)} bytes
        </div>
      )}

      <div className="border-b border-neutral-700 mb-4">
        <div className="flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-t transition-colors ${
                activeTab === tab.id
                  ? 'bg-neutral-700 text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-700/50'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-2 text-neutral-500">({tab.count})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-neutral-900 rounded p-4 max-h-96 overflow-auto">
        {!codeplug ? (
          <div className="text-neutral-500 text-center py-8">
            Load a codeplug file or read from radio to view contents
          </div>
        ) : activeTab === 'channels' ? (
          <ChannelList channels={codeplug.channels} />
        ) : activeTab === 'contacts' ? (
          <ContactList contacts={codeplug.contacts} />
        ) : activeTab === 'zones' ? (
          <ZoneList zones={codeplug.zones} />
        ) : (
          <pre className="font-mono text-xs text-green-400 whitespace-pre">
            {hexView}
          </pre>
        )}
      </div>
    </div>
  );
}

function ChannelList({ channels }: { channels: Channel[] }) {
  if (channels.length === 0) {
    return <div className="text-neutral-500 text-center py-4">No channels defined</div>;
  }
  
  return (
    <table className="w-full text-sm">
      <thead className="text-neutral-400 border-b border-neutral-700">
        <tr>
          <th className="text-left py-2">Name</th>
          <th className="text-left py-2">Mode</th>
          <th className="text-left py-2">RX Freq</th>
          <th className="text-left py-2">TX Freq</th>
          <th className="text-left py-2">Power</th>
        </tr>
      </thead>
      <tbody className="text-white">
        {channels.map((ch, i) => (
          <tr key={ch.id || i} className="border-b border-neutral-800 hover:bg-neutral-800/50">
            <td className="py-2">{ch.name}</td>
            <td className="py-2">{ch.mode.toUpperCase()}</td>
            <td className="py-2">{formatFrequency(ch.rxFrequency)}</td>
            <td className="py-2">{formatFrequency(ch.txFrequency)}</td>
            <td className="py-2">{ch.power}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ContactList({ contacts }: { contacts: DigitalContact[] }) {
  if (contacts.length === 0) {
    return <div className="text-neutral-500 text-center py-4">No contacts defined</div>;
  }
  
  return (
    <table className="w-full text-sm">
      <thead className="text-neutral-400 border-b border-neutral-700">
        <tr>
          <th className="text-left py-2">DMR ID</th>
          <th className="text-left py-2">Callsign</th>
          <th className="text-left py-2">Name</th>
        </tr>
      </thead>
      <tbody className="text-white">
        {contacts.map((c, i) => (
          <tr key={c.id || i} className="border-b border-neutral-800 hover:bg-neutral-800/50">
            <td className="py-2">{c.dmrid}</td>
            <td className="py-2">{c.callsign}</td>
            <td className="py-2">{c.name}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ZoneList({ zones }: { zones: Zone[] }) {
  if (zones.length === 0) {
    return <div className="text-neutral-500 text-center py-4">No zones defined</div>;
  }
  
  return (
    <table className="w-full text-sm">
      <thead className="text-neutral-400 border-b border-neutral-700">
        <tr>
          <th className="text-left py-2">Name</th>
          <th className="text-left py-2">Channels</th>
        </tr>
      </thead>
      <tbody className="text-white">
        {zones.map((z, i) => (
          <tr key={z.id || i} className="border-b border-neutral-800 hover:bg-neutral-800/50">
            <td className="py-2">{z.name}</td>
            <td className="py-2">{z.channelIndices.length}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function formatFrequency(hz: number): string {
  if (hz >= 100000000) {
    return `${(hz / 1000000).toFixed(4)} MHz`;
  }
  return `${(hz / 1000).toFixed(3)} kHz`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}