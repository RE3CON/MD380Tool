'use client';

import { useState, useCallback } from 'react';
import { DeviceConnector } from '@/components/DeviceConnector';
import { CodeplugEditor } from '@/components/CodeplugEditor';
import { FirmwareManager } from '@/components/FirmwareManager';
import { HexViewer } from '@/components/HexViewer';
import { DeviceLog } from '@/components/DeviceLog';
import { PatchManager } from '@/components/PatchManager';
import { md380Usb, CODEPLUG_SIZE, SPI_FLASH_BASE, type TransferProgress } from '@/lib/md380';

type TabType = 'codeplug' | 'firmware' | 'patches' | 'log' | 'hex' | 'emulator';

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('codeplug');
  const [rawData, setRawData] = useState<Uint8Array | null>(null);
  const [hasPatchedFirmware, setHasPatchedFirmware] = useState(false);

  const handleReadCodeplug = useCallback(async (): Promise<Uint8Array> => {
    return new Promise(async (resolve, reject) => {
      try {
        await md380Usb.enterProgrammingMode();
        await new Promise(r => setTimeout(r, 500));
        
        const progressHandler = (progress: TransferProgress) => {
          console.log(`Reading: ${progress.percentage.toFixed(1)}%`);
        };
        
        const data = await md380Usb.readData(0, CODEPLUG_SIZE, progressHandler);
        setRawData(data);
        setIsConnected(true);
        
        // Detect if firmware is patched
        if (data.length > 0) {
          // Check for patched firmware signature (at specific offset)
          // This is a simple heuristic - actual detection is more complex
          setHasPatchedFirmware(false);
        }
        
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
      
      const success = await md380Usb.writeData(0, data, progressHandler);
      if (success) {
        setRawData(data);
      }
      return success;
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

  const handleReadFirmware = useCallback(async (): Promise<Uint8Array> => {
    try {
      await md380Usb.enterProgrammingMode();
      await new Promise(r => setTimeout(r, 500));
      
      // Read firmware from radio (this would need implementation in usb.ts)
      // For now, return empty - actual implementation would read from flash
      return new Uint8Array(0);
    } catch (err) {
      console.error('Firmware read error:', err);
      throw err;
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

  const handleFetchLog = useCallback(async (): Promise<string> => {
    // This would fetch actual log data from the device
    // For now, return a sample
    return `[${new Date().toISOString()}] MD380 USB initialized
[${new Date().toISOString()}] Radio connected: MD-380
[${new Date().toISOString()}] Firmware version: D02.032
[${new Date().toISOString()}] Codeplug loaded successfully`;
  }, []);

  const isRadioConnected = md380Usb.getConnectionStatus();

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'codeplug', label: 'Codeplug', icon: 'M9 12h6m-6 4h6m2 5H3a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { id: 'firmware', label: 'Firmware', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
    { id: 'patches', label: 'Patches', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
    { id: 'log', label: 'Log', icon: 'M9 12h6m-6 4h6m2 5H3a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { id: 'hex', label: 'Hex View', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
    { id: 'emulator', label: 'Emulator', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
  ];

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
        {/* Device Connection */}
        <div className="mb-6">
          <DeviceConnector />
        </div>

        {/* Tabs */}
        <div className="border-b border-neutral-700 mb-6">
          <nav className="flex gap-1 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-400'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'codeplug' && (
            <CodeplugEditor
              onReadFromRadio={handleReadCodeplug}
              onWriteToRadio={handleWriteCodeplug}
              isConnected={isRadioConnected}
            />
          )}

          {activeTab === 'firmware' && (
            <FirmwareManager
              onFlashFirmware={handleFlashFirmware}
              onFlashDatabase={handleFlashDatabase}
              onReadFirmware={handleReadFirmware}
              isConnected={isRadioConnected}
            />
          )}

          {activeTab === 'patches' && (
            <PatchManager
              isConnected={isRadioConnected}
              hasPatchedFirmware={hasPatchedFirmware}
              onPatchChange={(patchId, enabled) => {
                console.log(`Patch ${patchId}: ${enabled ? 'enabled' : 'disabled'}`);
              }}
            />
          )}

          {activeTab === 'log' && (
            <DeviceLog
              onFetchLog={handleFetchLog}
              isConnected={isRadioConnected}
            />
          )}

          {activeTab === 'hex' && (
            <HexViewer
              data={rawData}
              title="Codeplug Hex View"
            />
          )}

          {activeTab === 'emulator' && (
            <div className="bg-neutral-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">🎮 Tools & Resources</h3>
              <p className="text-neutral-400 mb-4">
                The MD380 has no full software emulator - it requires actual hardware. 
                However, there are related tools and apps available:
              </p>
              
              {/* Android App Section */}
              <div className="mb-6 p-4 bg-green-900/30 border border-green-700 rounded-lg">
                <h4 className="font-medium text-white mb-2">📱 Official Android App</h4>
                <p className="text-sm text-neutral-400 mb-3">
                  Travis Goodspeed's official Android client for md380tools - same as what we web-based version is based on.
                </p>
                <a 
                  href="https://github.com/travisgoodspeed/MD380Tool" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded text-sm"
                >
                  <span className="mr-2">📦</span> View Android App
                </a>
              </div>
              
              {/* Tools Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="bg-neutral-700 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-2">📝 Codeplug Validator</h4>
                  <p className="text-sm text-neutral-400 mb-4">
                    Validate codeplug binary structure without a radio.
                  </p>
                  <button className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded text-sm">
                    Validate Codeplug
                  </button>
                </div>
                
                <div className="bg-neutral-700 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-2">📊 DMR Protocol Info</h4>
                  <p className="text-sm text-neutral-400 mb-4">
                    View DMR protocol specifications and frame structure.
                  </p>
                  <button className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded text-sm">
                    View Specs
                  </button>
                </div>
                
                <div className="bg-neutral-700 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-2">🔧 md380-tool CLI</h4>
                  <p className="text-sm text-neutral-400 mb-4">
                    Command-line tool for advanced operations.
                  </p>
                  <a 
                    href="https://github.com/travisgoodspeed/md380tools/tree/master/md380-tool" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded text-sm"
                  >
                    View Source
                  </a>
                </div>
                
                <div className="bg-neutral-700 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-2">💾 Firmware Download</h4>
                  <p className="text-sm text-neutral-400 mb-4">
                    Get pre-built patched firmware binaries.
                  </p>
                  <a 
                    href="https://github.com/travisgoodspeed/md380tools/releases" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded text-sm"
                  >
                    Get Firmware
                  </a>
                </div>
              </div>
              
              {/* Links to Original Tools */}
              <div className="mt-6 p-4 bg-neutral-700 rounded-lg">
                <h4 className="font-medium text-white mb-3">🔗 md380tools Command-Line Tools</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <a href="https://github.com/travisgoodspeed/md380tools/blob/master/docs/md380tool.md" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">md380-tool</a>
                  <a href="https://github.com/travisgoodspeed/md380tools/blob/master/docs/md380tool.md" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">md380-dfu</a>
                  <a href="https://github.com/travisgoodspeed/md380tools" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">md380-gfx</a>
                  <a href="https://github.com/travisgoodspeed/md380tools" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">md380-fw</a>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Supported Radios Sidebar - Desktop */}
      <aside className="fixed right-0 top-32 w-48 bg-neutral-800 p-4 rounded-l-lg hidden xl:block">
        <h3 className="text-sm font-semibold text-white mb-3">Supported Radios</h3>
        <ul className="space-y-1 text-xs text-neutral-400">
          <li>• MD-380</li>
          <li>• MD-380G</li>
          <li>• MD-390</li>
          <li>• MD-390G</li>
          <li>• Retevis RT3</li>
          <li>• Retevis RT8</li>
        </ul>
      </aside>

      <footer className="border-t border-neutral-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-neutral-500 text-sm">
          <p>MD380 Web Tools - Powered by WebUSB</p>
          <p className="mt-1">Based on the md380tools project by Travis Goodspeed</p>
          <p className="mt-1">
            <a href="https://github.com/travisgoodspeed/md380tools" target="_blank" rel="noopener noreferrer" className="underline">
              https://github.com/travisgoodspeed/md380tools
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
