'use client';

import { useState, useCallback } from 'react';
import { downloadAndBuildDatabase, type DMRUser } from '@/lib/md380';

interface FirmwareManagerProps {
  onFlashFirmware: (data: Uint8Array) => Promise<boolean>;
  onFlashDatabase: (data: Uint8Array) => Promise<boolean>;
  isConnected: boolean;
}

interface ProgressState {
  phase: string;
  loaded: number;
  total: number;
}

export function FirmwareManager({ onFlashFirmware, onFlashDatabase, isConnected }: FirmwareManagerProps) {
  const [isFlashing, setIsFlashing] = useState(false);
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');

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

  return (
    <div className="bg-neutral-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-6">Firmware & Database</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-200 text-sm">
          {error}
        </div>
      )}

      {progress && (
        <div className="mb-4">
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

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-white mb-3">Firmware Update</h3>
          <p className="text-sm text-neutral-400 mb-3">
            Upload a pre-compiled MD380 firmware .bin file to flash your radio.
          </p>
          <label className="inline-flex items-center px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <input 
              type="file" 
              accept=".bin" 
              className="hidden" 
              onChange={handleFirmwareUpload}
              disabled={!isConnected || isFlashing}
            />
            Upload Firmware
          </label>
        </div>

        <div className="border-t border-neutral-700 pt-6">
          <h3 className="text-lg font-medium text-white mb-3">DMR User Database</h3>
          <p className="text-sm text-neutral-400 mb-3">
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
            className="px-4 py-2 bg-green-700 hover:bg-green-600 disabled:bg-neutral-600 text-white rounded transition-colors"
          >
            {isFlashing ? 'Flashing...' : 'Download & Flash Database'}
          </button>
        </div>
      </div>
    </div>
  );
}