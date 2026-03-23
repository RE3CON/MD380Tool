'use client';

import { useState, useCallback } from 'react';
import { downloadAndBuildDatabase, type DMRUser } from '@/lib/md380';

interface FirmwareManagerProps {
  onFlashFirmware: (data: Uint8Array) => Promise<boolean>;
  onFlashDatabase: (data: Uint8Array) => Promise<boolean>;
  onReadFirmware?: () => Promise<Uint8Array>;
  isConnected: boolean;
}

interface ProgressState {
  phase: string;
  loaded: number;
  total: number;
}

interface FirmwareSource {
  name: string;
  url: string;
  description: string;
}

// Popular firmware download sources
const FIRMWARE_SOURCES: FirmwareSource[] = [
  {
    name: 'md380tools Latest (D13)',
    url: 'https://github.com/travisgoodspeed/md380tools/releases/latest/download/firmware.bin',
    description: 'Latest patched firmware from md380tools',
  },
  {
    name: 'md380tools D02',
    url: 'https://github.com/travisgoodspeed/md380tools/releases/download/fw-D02/firmware.bin',
    description: 'D02 firmware version',
  },
  {
    name: 'md380-v3.1.5 (D13)',
    url: 'https://github.com/DM3YEH/MD380-Tools/releases/download/v3.1.5/firmware.bin',
    description: 'Alternative patched firmware',
  },
];

export function FirmwareManager({ 
  onFlashFirmware, 
  onFlashDatabase, 
  onReadFirmware,
  isConnected 
}: FirmwareManagerProps) {
  const [isFlashing, setIsFlashing] = useState(false);
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [customFirmwareUrl, setCustomFirmwareUrl] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  // Handle firmware backup - read from radio
  const handleBackup = useCallback(async () => {
    if (!isConnected || !onReadFirmware) return;
    
    setIsFlashing(true);
    setError(null);
    setProgress({ phase: 'Reading firmware from radio...', loaded: 0, total: 100 });

    try {
      const handleProgress = (loaded: number, total: number) => {
        setProgress({ phase: 'Reading firmware...', loaded, total });
      };

      const firmwareData = await onReadFirmware();
      
      // Download as file
      const blob = new Blob([new Uint8Array(firmwareData)], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `md380-firmware-backup-${new Date().toISOString().split('T')[0]}.bin`;
      a.click();
      URL.revokeObjectURL(url);
      
      setProgress({ phase: 'Backup complete!', loaded: firmwareData.length, total: firmwareData.length });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to backup firmware');
    } finally {
      setIsFlashing(false);
      setTimeout(() => setProgress(null), 3000);
    }
  }, [isConnected, onReadFirmware]);

  // Handle firmware from URL
  const handleFirmwareFromUrl = useCallback(async () => {
    if (!customFirmwareUrl.trim()) return;
    
    setIsDownloading(true);
    setError(null);
    setProgress({ phase: 'Downloading firmware...', loaded: 0, total: 100 });

    try {
      const response = await fetch(customFirmwareUrl);
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }
      
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const firmwareData = new Uint8Array(arrayBuffer);
      
      setProgress({ phase: 'Downloaded, flashing...', loaded: firmwareData.length, total: firmwareData.length });
      
      const success = await onFlashFirmware(firmwareData);
      
      if (!success) {
        setError('Failed to flash firmware from URL');
      } else {
        setProgress({ phase: 'Flash complete!', loaded: firmwareData.length, total: firmwareData.length });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download/flash firmware');
    } finally {
      setIsDownloading(false);
      setTimeout(() => setProgress(null), 3000);
    }
  }, [customFirmwareUrl, onFlashFirmware]);

  // Handle firmware from quick source
  const handleFirmwareFromSource = useCallback(async (source: FirmwareSource) => {
    setCustomFirmwareUrl(source.url);
    setIsDownloading(true);
    setError(null);
    setProgress({ phase: `Downloading ${source.name}...`, loaded: 0, total: 100 });

    try {
      const response = await fetch(source.url);
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }
      
      // Get content-length for progress if available
      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength) : 0;
      
      const chunks: Uint8Array[] = [];
      const reader = response.body?.getReader();
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          chunks.push(value);
          if (total) {
            const loaded = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
            setProgress({ phase: `Downloading ${source.name}...`, loaded, total });
          }
        }
      }
      
      // Combine chunks
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const firmwareData = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        firmwareData.set(chunk, offset);
        offset += chunk.length;
      }
      
      setProgress({ phase: 'Flashing firmware...', loaded: firmwareData.length, total: firmwareData.length });
      
      const success = await onFlashFirmware(firmwareData);
      
      if (!success) {
        setError(`Failed to flash ${source.name}`);
      } else {
        setProgress({ phase: `Successfully flashed ${source.name}!`, loaded: firmwareData.length, total: firmwareData.length });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to download/flash ${source.name}`);
    } finally {
      setIsDownloading(false);
      setTimeout(() => setProgress(null), 3000);
    }
  }, [onFlashFirmware]);

  // Handle local file upload
  const handleFirmwareUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsFlashing(true);
    setError(null);
    setProgress({ phase: 'Reading firmware file...', loaded: 0, total: file.size });

    const reader = new FileReader();
    reader.onload = async (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      if (buffer) {
        const data = new Uint8Array(buffer);
        
        setProgress({ phase: 'Flashing firmware...', loaded: 0, total: data.length });
        
        try {
          const success = await onFlashFirmware(data);
          if (!success) {
            setError('Failed to flash firmware');
          } else {
            setProgress({ phase: 'Complete!', loaded: data.length, total: data.length });
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Firmware flash failed');
        } finally {
          setIsFlashing(false);
          setTimeout(() => setProgress(null), 3000);
        }
      }
    };
    reader.readAsArrayBuffer(file);
  }, [onFlashFirmware]);

  // Handle database flash
  const handleFlashDatabase = useCallback(async () => {
    if (!isConnected) return;
    
    setIsFlashing(true);
    setError(null);
    setProgress({ phase: 'Downloading from RadioID.net...', loaded: 0, total: 100 });

    try {
      const handleProgress = (loaded: number, total: number) => {
        setProgress({ phase: 'Fetching DMR users...', loaded, total });
      };

      const dbData = await downloadAndBuildDatabase(country || undefined, state || undefined, handleProgress);
      
      setProgress({ phase: 'Flashing to radio SPI flash...', loaded: 0, total: dbData.length });
      
      const handleWriteProgress = (loaded: number, total: number) => {
        setProgress({ phase: 'Writing database...', loaded, total });
      };

      const success = await onFlashDatabase(dbData);
      
      if (!success) {
        setError('Failed to flash database to radio');
      } else {
        setProgress({ phase: 'Complete!', loaded: dbData.length, total: dbData.length });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Database flash failed');
    } finally {
      setIsFlashing(false);
      setTimeout(() => setProgress(null), 3000);
    }
  }, [isConnected, country, state, onFlashDatabase]);

  return (
    <div className="space-y-6">
      {/* Error/Progress Display */}
      {error && (
        <div className="p-3 bg-red-900/50 border border-red-700 rounded text-red-200 text-sm">
          {error}
        </div>
      )}

      {progress && (
        <div>
          <div className="flex justify-between text-sm text-neutral-400 mb-1">
            <span>{progress.phase}</span>
            {progress.total > 0 && (
              <span>{Math.round((progress.loaded / progress.total) * 100)}%</span>
            )}
          </div>
          <div className="h-2 bg-neutral-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-600 transition-all duration-300"
              style={{ width: progress.total > 0 ? `${(progress.loaded / progress.total) * 100}%` : '0%' }}
            />
          </div>
        </div>
      )}

      {/* Backup Section */}
      <div className="bg-neutral-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-white">📥 Backup Firmware</h3>
        </div>
        <p className="text-sm text-neutral-400 mb-4">
          Read and save the current firmware from your radio for backup or restoration.
        </p>
        <button
          onClick={handleBackup}
          disabled={!isConnected || !onReadFirmware || isFlashing}
          className="px-4 py-2 bg-blue-700 hover:bg-blue-600 disabled:bg-neutral-600 text-white rounded transition-colors"
        >
          {isFlashing ? 'Reading...' : '🔄 Backup Firmware from Radio'}
        </button>
      </div>

      {/* Quick Flash Section */}
      <div className="bg-neutral-800 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-4">⚡ Quick Flash</h3>
        <p className="text-sm text-neutral-400 mb-4">
          One-click flash from popular firmware sources:
        </p>
        
        <div className="space-y-2">
          {FIRMWARE_SOURCES.map((source, i) => (
            <button
              key={i}
              onClick={() => handleFirmwareFromSource(source)}
              disabled={!isConnected || isDownloading}
              className="w-full p-3 bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 rounded text-left transition-colors"
            >
              <div className="font-medium text-white">{source.name}</div>
              <div className="text-sm text-neutral-400">{source.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom URL Section */}
      <div className="bg-neutral-800 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-4">🔗 Flash from URL</h3>
        <p className="text-sm text-neutral-400 mb-4">
          Enter a direct link to a firmware .bin file:
        </p>
        
        <div className="flex gap-2">
          <input
            type="url"
            value={customFirmwareUrl}
            onChange={e => setCustomFirmwareUrl(e.target.value)}
            placeholder="https://example.com/firmware.bin"
            className="flex-1 px-3 py-2 bg-neutral-700 border border-neutral-600 rounded text-white text-sm"
          />
          <button
            onClick={handleFirmwareFromUrl}
            disabled={!isConnected || !customFirmwareUrl || isDownloading}
            className="px-4 py-2 bg-green-700 hover:bg-green-600 disabled:bg-neutral-600 text-white rounded transition-colors"
          >
            {isDownloading ? 'Downloading...' : 'Flash'}
          </button>
        </div>
      </div>

      {/* Local File Section - Mobile Friendly */}
      <div className="bg-neutral-800 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-4">💾 Flash from Device</h3>
        <p className="text-sm text-neutral-400 mb-4">
          Upload a firmware .bin file from your phone/tablet:
        </p>
        
        <label 
          className={`flex flex-col items-center justify-center w-full h-32 px-4 py-4 bg-blue-700 hover:bg-blue-600 disabled:bg-neutral-600 border-2 border-dashed border-blue-500 rounded-lg cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed ${!isConnected || isFlashing ? 'opacity-50' : ''}`}
        >
          <input 
            type="file" 
            accept=".bin,application/octet-stream"
            className="hidden" 
            onChange={handleFirmwareUpload}
            disabled={!isConnected || isFlashing}
            id="firmware-file-input"
          />
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg className="w-10 h-10 mb-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="mb-2 text-sm text-white text-center">
              <span className="font-semibold">Tap to select firmware</span>
            </p>
            <p className="text-xs text-blue-200">.bin files up to 2MB</p>
          </div>
        </label>
        
        {/* Alternative touch-friendly button */}
        <label 
          htmlFor="firmware-file-input"
          className={`mt-4 flex items-center justify-center w-full px-4 py-4 bg-blue-700 hover:bg-blue-600 disabled:bg-neutral-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${!isConnected || isFlashing ? 'opacity-50' : ''}`}
        >
          <span className="mr-2 text-xl">📁</span>
          {isFlashing ? 'Flashing...' : 'Select Firmware File'}
        </label>
      </div>

      {/* DMR Database Section */}
      <div className="bg-neutral-800 rounded-lg p-6 border-t border-neutral-700">
        <h3 className="text-lg font-medium text-white mb-4">📡 DMR User Database</h3>
        <p className="text-sm text-neutral-400 mb-4">
          Download and flash the DMR user database for caller ID display.
        </p>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-neutral-400 mb-1">Country (optional)</label>
            <input
              type="text"
              value={country}
              onChange={e => setCountry(e.target.value)}
              placeholder="e.g., United States"
              className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-400 mb-1">State (optional)</label>
            <input
              type="text"
              value={state}
              onChange={e => setState(e.target.value)}
              placeholder="e.g., Texas"
              className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded text-white text-sm"
            />
          </div>
        </div>

        <button
          onClick={handleFlashDatabase}
          disabled={!isConnected || isFlashing}
          className="px-4 py-2 bg-purple-700 hover:bg-purple-600 disabled:bg-neutral-600 text-white rounded transition-colors"
        >
          {isFlashing ? 'Downloading & Flashing...' : '📥 Download & Flash Database'}
        </button>
      </div>
    </div>
  );
}
