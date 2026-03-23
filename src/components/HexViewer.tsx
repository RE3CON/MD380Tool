'use client';

import { useState, useMemo } from 'react';

interface HexViewerProps {
  data: Uint8Array | null;
  title?: string;
  onEdit?: (offset: number, value: number) => void;
}

export function HexViewer({ data, title = 'Hex View', onEdit }: HexViewerProps) {
  const [bytesPerRow, setBytesPerRow] = useState(16);
  const [startOffset, setStartOffset] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [jumpToOffset, setJumpToOffset] = useState('');

  const displayData = useMemo(() => {
    if (!data) return [];
    
    const maxOffset = Math.max(0, data.length - bytesPerRow);
    const start = Math.min(startOffset, maxOffset);
    const end = Math.min(start + 512, data.length); // Show 512 bytes max for performance
    
    const lines = [];
    
    for (let i = start; i < end; i += bytesPerRow) {
      const lineData = data.slice(i, Math.min(i + bytesPerRow, data.length));
      const offset = i;
      
      // Format hex bytes
      const hexBytes = Array.from(lineData)
        .map(b => b.toString(16).padStart(2, '0'))
        .join(' ');
      
      // Pad hex to full row width
      const paddingNeeded = bytesPerRow - lineData.length;
      const paddedHex = hexBytes + '   '.repeat(paddingNeeded);
      
      // Format ASCII
      const ascii = Array.from(lineData)
        .map(b => (b >= 32 && b < 127) ? String.fromCharCode(b) : '.')
        .join('');
      
      lines.push({
        offset,
        hex: paddedHex,
        ascii,
      });
    }
    
    return lines;
  }, [data, bytesPerRow, startOffset]);

  const handleJump = () => {
    const offset = parseInt(jumpToOffset, 16);
    if (!isNaN(offset) && data && offset >= 0 && offset < data.length) {
      setStartOffset(offset);
      setJumpToOffset('');
    }
  };

  const totalPages = data ? Math.ceil(data.length / 512) : 0;
  const currentPage = Math.floor(startOffset / 512) + 1;

  if (!data) {
    return (
      <div className="bg-neutral-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        <div className="text-neutral-500 text-center py-8">
          No data loaded for hex view
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-400">
            {data.length.toLocaleString()} bytes
          </span>
          <select
            value={bytesPerRow}
            onChange={e => setBytesPerRow(Number(e.target.value))}
            className="bg-neutral-700 text-white text-sm px-2 py-1 rounded"
          >
            <option value={8}>8 bytes/row</option>
            <option value={16}>16 bytes/row</option>
            <option value={32}>32 bytes/row</option>
          </select>
        </div>
      </div>

      {/* Search and Jump */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search hex or ASCII..."
          className="flex-1 bg-neutral-700 text-white text-sm px-3 py-2 rounded"
        />
        <input
          type="text"
          value={jumpToOffset}
          onChange={e => setJumpToOffset(e.target.value)}
          placeholder="0x0000"
          className="w-24 bg-neutral-700 text-white text-sm px-3 py-2 rounded"
        />
        <button
          onClick={handleJump}
          className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white text-sm rounded"
        >
          Jump
        </button>
      </div>

      {/* Hex Display */}
      <div className="bg-neutral-900 rounded overflow-auto max-h-96">
        <pre className="font-mono text-xs p-4">
          {displayData.map(line => (
            <div key={line.offset} className="flex hover:bg-neutral-800">
              <span className="text-blue-400 w-12 flex-shrink-0">
                {line.offset.toString(16).padStart(8, '0')}
              </span>
              <span className="text-green-400 w-[calc(100%-3rem)] flex-shrink-0 px-4">
                {line.hex}
              </span>
              <span className="text-yellow-400 flex-shrink-0">
                {line.ascii}
              </span>
            </div>
          ))}
        </pre>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <button
            onClick={() => setStartOffset(Math.max(0, startOffset - 512))}
            disabled={startOffset === 0}
            className="px-3 py-1 bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 text-white rounded"
          >
            Previous
          </button>
          <span className="text-neutral-400">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setStartOffset(Math.min(data.length - 512, startOffset + 512))}
            disabled={startOffset >= data.length - 512}
            className="px-3 py-1 bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 text-white rounded"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
