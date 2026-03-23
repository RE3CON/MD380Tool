'use client';

import { useState } from 'react';

interface Patch {
  id: string;
  name: string;
  description: string;
  category: 'display' | 'network' | 'audio' | 'experimental';
  enabled: boolean;
  requiresPatchedFirmware: boolean;
}

interface PatchManagerProps {
  isConnected: boolean;
  hasPatchedFirmware: boolean;
  onPatchChange?: (patchId: string, enabled: boolean) => void;
}

// List of available patches from md380tools
const AVAILABLE_PATCHES: Patch[] = [
  {
    id: 'promiscuous',
    name: 'Promiscuous Mode',
    description: 'Allow receiving DMR traffic from any talkgroup, not just your own. Essential for monitoring.',
    category: 'network',
    enabled: false,
    requiresPatchedFirmware: true,
  },
  {
    id: 'netmon',
    name: 'Network Monitor',
    description: 'Display network statistics and debug info on the radio screen.',
    category: 'display',
    enabled: false,
    requiresPatchedFirmware: true,
  },
  {
    id: 'calllog',
    name: 'Call Log',
    description: 'Log received and transmitted calls with timestamps.',
    category: 'network',
    enabled: false,
    requiresPatchedFirmware: true,
  },
  {
    id: 'bootmsg',
    name: 'Boot Message',
    description: 'Custom boot message displayed when radio starts.',
    category: 'display',
    enabled: false,
    requiresPatchedFirmware: true,
  },
  {
    id: 'hamlogo',
    name: 'Ham Logo',
    description: 'Display custom logo on the radio screen.',
    category: 'display',
    enabled: false,
    requiresPatchedFirmware: true,
  },
  {
    id: 'disableencryption',
    name: 'Disable Encryption',
    description: 'Allow monitoring of encrypted channels (experimental).',
    category: 'experimental',
    enabled: false,
    requiresPatchedFirmware: true,
  },
  {
    id: 'extendedmenu',
    name: 'Extended Menu',
    description: 'Add additional menu options for advanced configuration.',
    category: 'display',
    enabled: false,
    requiresPatchedFirmware: true,
  },
  {
    id: 'autopatch',
    name: 'Auto Patch',
    description: 'Automatically connect to DMR repeater internet gateway.',
    category: 'network',
    enabled: false,
    requiresPatchedFirmware: true,
  },
  {
    id: 'sms',
    name: 'SMS Support',
    description: 'Enable sending and receiving SMS messages over DMR.',
    category: 'network',
    enabled: false,
    requiresPatchedFirmware: true,
  },
  {
    id: 'gps',
    name: 'GPS Spoofing',
    description: 'Spoof GPS coordinates (for testing, requires patched firmware).',
    category: 'experimental',
    enabled: false,
    requiresPatchedFirmware: true,
  },
];

export function PatchManager({ isConnected, hasPatchedFirmware, onPatchChange }: PatchManagerProps) {
  const [patches, setPatches] = useState<Patch[]>(AVAILABLE_PATCHES);
  const [filter, setFilter] = useState<Patch['category'] | 'all'>('all');

  const handleToggle = (patchId: string) => {
    if (!isConnected) return;
    
    setPatches(prev => prev.map(p => {
      if (p.id === patchId) {
        const newEnabled = !p.enabled;
        onPatchChange?.(patchId, newEnabled);
        return { ...p, enabled: newEnabled };
      }
      return p;
    }));
  };

  const filteredPatches = filter === 'all' 
    ? patches 
    : patches.filter(p => p.category === filter);

  const categories: { id: Patch['category'] | 'all'; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'display', label: 'Display' },
    { id: 'network', label: 'Network' },
    { id: 'audio', label: 'Audio' },
    { id: 'experimental', label: 'Experimental' },
  ];

  const getCategoryColor = (category: Patch['category']) => {
    switch (category) {
      case 'display': return 'bg-blue-700';
      case 'network': return 'bg-green-700';
      case 'audio': return 'bg-purple-700';
      case 'experimental': return 'bg-red-700';
      default: return 'bg-neutral-700';
    }
  };

  return (
    <div className="bg-neutral-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Firmware Patches</h3>
        
        {/* Firmware Status */}
        <div className={`px-3 py-1 rounded text-sm ${
          hasPatchedFirmware 
            ? 'bg-green-700 text-white' 
            : 'bg-yellow-700 text-white'
        }`}>
          {hasPatchedFirmware ? 'Patched Firmware Detected' : 'Stock Firmware'}
        </div>
      </div>

      {/* Warning for stock firmware */}
      {!hasPatchedFirmware && (
        <div className="mb-4 p-3 bg-yellow-900/50 border border-yellow-700 rounded text-yellow-200 text-sm">
          ⚠️ Patches require patched firmware. 
          <a 
            href="https://github.com/travisgoodspeed/md380tools" 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline ml-1"
          >
            Learn how to patch
          </a>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id)}
            className={`px-3 py-1 rounded text-sm whitespace-nowrap ${
              filter === cat.id
                ? 'bg-blue-700 text-white'
                : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Patch List */}
      <div className="space-y-3">
        {filteredPatches.map(patch => (
          <div
            key={patch.id}
            className={`p-4 rounded-lg border ${
              patch.enabled 
                ? 'bg-blue-900/30 border-blue-600' 
                : 'bg-neutral-700/30 border-neutral-600'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-white">{patch.name}</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${getCategoryColor(patch.category)}`}>
                    {patch.category}
                  </span>
                </div>
                <p className="text-sm text-neutral-400">{patch.description}</p>
                
                {patch.requiresPatchedFirmware && !hasPatchedFirmware && (
                  <p className="text-xs text-yellow-500 mt-2">
                    ⚠️ Requires patched firmware
                  </p>
                )}
              </div>
              
              <button
                onClick={() => handleToggle(patch.id)}
                disabled={!isConnected || (patch.requiresPatchedFirmware && !hasPatchedFirmware)}
                className={`ml-4 px-4 py-2 rounded text-sm font-medium transition-colors ${
                  patch.enabled
                    ? 'bg-blue-600 text-white'
                    : 'bg-neutral-600 text-neutral-300 hover:bg-neutral-500'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {patch.enabled ? 'Enabled' : 'Enable'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="mt-4 p-3 bg-neutral-700/50 rounded text-sm text-neutral-400">
        <p>
          <strong className="text-neutral-300">Note:</strong> Patch configuration requires 
          writing to the radio's codeplug. Changes are saved when you write the codeplug.
        </p>
      </div>
    </div>
  );
}
