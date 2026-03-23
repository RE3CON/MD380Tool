'use client';

import { useState, useCallback } from 'react';
import { DeviceConnector } from '@/components/DeviceConnector';
import { CodeplugEditor } from '@/components/CodeplugEditor';
import { FirmwareManager } from '@/components/FirmwareManager';
import { md380Usb, CODEPLUG_SIZE, SPI_FLASH_BASE, type TransferProgress } from '@/lib/md380';

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);

  const handleReadCodeplug = useCallback(async (): Promise<Uint8Array> => {
    return new Promise(async (resolve, reject) => {
      try {
        await md380Usb.enterProgrammingMode();
        await new Promise(r => setTimeout(r, 500));
        
        const progressHandler = (progress: TransferProgress) => {
          console.log(`Reading: ${progress.percentage.toFixed(1)}%`);
        };
        
        const data = await md380Usb.readData(0, CODEPLUG_SIZE, progressHandler);
        setIsConnected(true);
        resolve(data);
      } catch (err) {
        reject(err);
      }
    });
  }, []);

  const handleWriteCodeplug = useCallback(async (data: Uint8Array): Promise<boolean> => {
    try {
      await md380Usb.enterProgrammingMode();
      await new Promise(r => setTimeout(r, 500));
      
      const progressHandler = (progress: TransferProgress) => {
        console.log(`Writing: ${progress.percentage.toFixed(1)}%`);
      };
      
      return await md380Usb.writeData(0, data, progressHandler);
    } catch (err) {
      console.error('Write error:', err);
      return false;
    }
  }, []);

  const handleFlashFirmware = useCallback(async (data: Uint8Array): Promise<boolean> => {
    try {
      await md380Usb.enterProgrammingMode();
      await new Promise(r => setTimeout(r, 500));
      
      const progressHandler = (progress: TransferProgress) => {
        console.log(`Firmware: ${progress.percentage.toFixed(1)}%`);
      };
      
      return await md380Usb.writeData(0, data, progressHandler);
    } catch (err) {
      console.error('Firmware flash error:', err);
      return false;
    }
  }, []);

  const handleFlashDatabase = useCallback(async (data: Uint8Array): Promise<boolean> => {
    try {
      const progressHandler = (progress: TransferProgress) => {
        console.log(`Database: ${progress.percentage.toFixed(1)}%`);
      };
      
      return await md380Usb.writeSPIFlash(0, data, progressHandler);
    } catch (err) {
      console.error('Database flash error:', err);
      return false;
    }
  }, []);

  const isRadioConnected = md380Usb.getConnectionStatus();

  return (
    <div className="min-h-screen bg-neutral-900">
      <header className="bg-neutral-800 border-b border-neutral-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">MD380 Web Tools</h1>
                <p className="text-sm text-neutral-400">Browser-based firmware and codeplug management</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isRadioConnected ? 'bg-green-500' : 'bg-neutral-500'}`} />
              <span className="text-sm text-neutral-400">
                {isRadioConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <DeviceConnector />
            
            <div className="bg-neutral-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
              
              <div className="space-y-2">
                <button
                  disabled={!isRadioConnected}
                  className="w-full py-2 px-4 bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-left flex items-center gap-3 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Read Codeplug
                </button>
                
                <button
                  disabled={!isRadioConnected}
                  className="w-full py-2 px-4 bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-left flex items-center gap-3 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Write Codeplug
                </button>
                
                <button
                  disabled={!isRadioConnected}
                  className="w-full py-2 px-4 bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-left flex items-center gap-3 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                  Read Dmesg Log
                </button>
              </div>
            </div>

            <div className="bg-neutral-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Supported Radios</h2>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li>• Tytera MD-380 (non-GPS)</li>
                <li>• Tytera MD-380G (GPS)</li>
                <li>• Tytera MD-390 (non-GPS)</li>
                <li>• Tytera MD-390G (GPS)</li>
                <li>• Retevis RT3</li>
                <li>• Retevis RT8</li>
              </ul>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <CodeplugEditor
              onReadFromRadio={handleReadCodeplug}
              onWriteToRadio={handleWriteCodeplug}
              isConnected={isRadioConnected}
            />
            
            <FirmwareManager
              onFlashFirmware={handleFlashFirmware}
              onFlashDatabase={handleFlashDatabase}
              isConnected={isRadioConnected}
            />
          </div>
        </div>
      </main>

      <footer className="border-t border-neutral-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-neutral-500 text-sm">
          <p>MD380 Web Tools - Powered by WebUSB</p>
          <p className="mt-1">Based on the md380tools project by Travis Goodspeed</p>
        </div>
      </footer>
    </div>
  );
}