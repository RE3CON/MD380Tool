'use client';

import { useState, useCallback, useEffect } from 'react';
import { md380Usb, type MD380DeviceInfo, type TransferProgress } from '@/lib/md380';

interface ConnectionState {
  isConnected: boolean;
  deviceInfo: MD380DeviceInfo | null;
  isConnecting: boolean;
  error: string | null;
  webUsbSupported: boolean;
}

export function DeviceConnector() {
  const [state, setState] = useState<ConnectionState>({
    isConnected: false,
    deviceInfo: null,
    isConnecting: false,
    error: null,
    webUsbSupported: true,
  });

  useEffect(() => {
    if (typeof navigator !== 'undefined' && !navigator.usb) {
      setState(prev => ({ ...prev, webUsbSupported: false, 
        error: 'WebUSB is not supported on this device. Please use a desktop browser (Chrome/Edge on Windows, macOS, or Linux).' }));
    }
  }, []);

  const handleConnect = useCallback(async () => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));
    
    try {
      if (!navigator.usb) {
        throw new Error('WebUSB is not supported in this browser. Please use Chrome or Edge.');
      }
      
      const connected = await md380Usb.connect();
      
      if (connected) {
        const info = md380Usb.getDeviceInfo();
        setState(prev => ({
          ...prev,
          isConnected: true,
          deviceInfo: info,
          isConnecting: false,
          error: null,
        }));
      } else {
        setState(prev => ({
          ...prev,
          isConnected: false,
          deviceInfo: null,
          isConnecting: false,
          error: 'No device selected or connection failed.',
        }));
      }
    } catch (err) {
      setState(prev => ({
        ...prev,
        isConnected: false,
        deviceInfo: null,
        isConnecting: false,
        error: err instanceof Error ? err.message : 'Connection failed',
      }));
    }
  }, []);

  const handleDisconnect = useCallback(async () => {
    await md380Usb.disconnect();
    setState(prev => ({
      ...prev,
      isConnected: false,
      deviceInfo: null,
      isConnecting: false,
      error: null,
    }));
  }, []);

  return (
    <div className="bg-neutral-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Device Connection</h2>
      
      {state.error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-200 text-sm">
          {state.error}
        </div>
      )}
      
      {state.isConnected && state.deviceInfo ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-400 font-medium">Connected</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-neutral-400">Model:</div>
            <div className="text-white">{state.deviceInfo.product || 'Unknown'}</div>
            
            <div className="text-neutral-400">Serial:</div>
            <div className="text-white">{state.deviceInfo.serialNumber}</div>
            
            <div className="text-neutral-400">GPS:</div>
            <div className="text-white">{state.deviceInfo.hasGPS ? 'Yes' : 'No'}</div>
            
            <div className="text-neutral-400">Vocoder:</div>
            <div className="text-white">{state.deviceInfo.vocoderType}</div>
          </div>
          
          <button
            onClick={handleDisconnect}
            className="mt-4 w-full py-2 px-4 bg-red-700 hover:bg-red-600 text-white rounded font-medium transition-colors"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={handleConnect}
          disabled={state.isConnecting || !state.webUsbSupported}
          className="w-full py-3 px-4 bg-blue-700 hover:bg-blue-600 disabled:bg-neutral-600 disabled:cursor-not-allowed text-white rounded font-medium transition-colors"
        >
          {!state.webUsbSupported ? 'WebUSB Not Available' : state.isConnecting ? 'Connecting...' : 'Connect to Radio'}
        </button>
      )}
    </div>
  );
}

interface ProgressBarProps {
  progress: TransferProgress | null;
  label?: string;
}

export function ProgressBar({ progress, label }: ProgressBarProps) {
  if (!progress) return null;
  
  return (
    <div className="mt-4">
      {label && (
        <div className="flex justify-between text-sm text-neutral-400 mb-1">
          <span>{label}</span>
          <span>{progress.percentage.toFixed(1)}%</span>
        </div>
      )}
      <div className="h-2 bg-neutral-700 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${progress.percentage}%` }}
        />
      </div>
      <div className="text-xs text-neutral-500 mt-1">
        {formatBytes(progress.bytesTransferred)} / {formatBytes(progress.totalBytes)}
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}