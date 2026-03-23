export const CODEPLUG_MAGIC = 0x4d443830;
export const CODEPLUG_SIZE = 262709;
export const MAX_CHANNELS = 1000;
export const CHANNEL_SIZE = 64;
export const MAX_CONTACTS = 1000;
export const CONTACT_SIZE = 36;
export const MAX_ZONES = 64;
export const ZONE_SIZE = 68;
export const CHANNEL_NAME_LENGTH = 16;

export const CHANNEL_MODE = {
  ANALOG: 0x61,
  DMR: 0x62,
} as const;

export const POWER_LEVEL = {
  LOW: 0x04,
  HIGH: 0x24,
} as const;

export interface DigitalContact {
  id: string;
  name: string;
  callsign: string;
  dmrid: number;
  callType: number;
}

export interface RXGroupList {
  id: string;
  name: string;
  contacts: number[];
}

export interface Channel {
  id: string;
  name: string;
  mode: 'analog' | 'dmr';
  rxFrequency: number;
  txFrequency: number;
  power: 'low' | 'high';
  contactIndex: number;
  rxGroupIndex: number;
  colorCode: number;
  timeSlot: 1 | 2;
}

export interface Zone {
  id: string;
  name: string;
  channelIndices: number[];
}

export interface CodeplugData {
  channels: Channel[];
  contacts: DigitalContact[];
  zones: Zone[];
  rxGroups: RXGroupList[];
  generalSettings: Record<string, unknown>;
}

function generateUUID(): string {
  return crypto.randomUUID();
}

function readUInt16LE(data: Uint8Array, offset: number): number {
  return data[offset] | (data[offset + 1] << 8);
}

function readUInt32LE(data: Uint8Array, offset: number): number {
  return data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16) | (data[offset + 3] << 24);
}

function writeUInt16LE(data: Uint8Array, offset: number, value: number): void {
  data[offset] = value & 0xff;
  data[offset + 1] = (value >> 8) & 0xff;
}

function writeUInt32LE(data: Uint8Array, offset: number, value: number): void {
  data[offset] = value & 0xff;
  data[offset + 1] = (value >> 8) & 0xff;
  data[offset + 2] = (value >> 16) & 0xff;
  data[offset + 3] = (value >> 24) & 0xff;
}

export function bcdToFrequency(bytes: number[]): number {
  if (bytes.length !== 4) return 0;
  const reversed = [...bytes].reverse();
  let freq = 0;
  for (let i = 0; i < 4; i++) {
    const nibble = reversed[i] & 0x0f;
    const digit = (reversed[i] >> 4) & 0x0f;
    freq = freq * 10 + digit;
    freq = freq * 10 + nibble;
  }
  return freq * 10;
}

export function frequencyToBCD(freqHz: number): number[] {
  const freq = Math.round(freqHz / 10);
  const bytes = new Array(4);
  let remaining = freq;
  for (let i = 3; i >= 0; i--) {
    bytes[i] = ((remaining % 10) << 4) | Math.floor((remaining / 10) % 10);
    remaining = Math.floor(remaining / 100);
  }
  return bytes;
}

function readString(data: Uint8Array, offset: number, length: number): string {
  let end = offset;
  while (end < offset + length && data[end] !== 0) {
    end++;
  }
  const decoder = new TextDecoder('utf-8', { fatal: false });
  return decoder.decode(data.slice(offset, end)).trim();
}

function writeString(data: Uint8Array, offset: number, str: string, maxLen: number): void {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str.slice(0, maxLen));
  const writeLen = Math.min(bytes.length, maxLen);
  data.set(bytes.slice(0, writeLen), offset);
  for (let i = writeLen; i < maxLen; i++) {
    data[offset + i] = 0;
  }
}

export function parseCodeplug(data: Uint8Array): CodeplugData {
  if (data.length !== CODEPLUG_SIZE) {
    throw new Error(`Invalid codeplug size: ${data.length}, expected ${CODEPLUG_SIZE}`);
  }

  const contacts: DigitalContact[] = [];
  const contactOffset = 0x10000;
  for (let i = 0; i < MAX_CONTACTS; i++) {
    const offset = contactOffset + i * CONTACT_SIZE;
    const dmrid = readUInt32LE(data, offset);
    if (dmrid !== 0 && dmrid !== 0xffffffff) {
      contacts.push({
        id: generateUUID(),
        name: readString(data, offset + 8, 16),
        callsign: readString(data, offset + 24, 10).replace(/\0/g, '').trim(),
        dmrid,
        callType: data[offset + 34],
      });
    }
  }

  const channels: Channel[] = [];
  const channelOffset = 0x20000;
  for (let i = 0; i < MAX_CHANNELS; i++) {
    const offset = channelOffset + i * CHANNEL_SIZE;
    const mode = data[offset];
    if (mode === CHANNEL_MODE.ANALOG || mode === CHANNEL_MODE.DMR) {
      const rxFreq = bcdToFrequency(Array.from(data.slice(offset + 16, offset + 20)));
      const txFreq = bcdToFrequency(Array.from(data.slice(offset + 20, offset + 24)));
      
      if (rxFreq > 0 && txFreq > 0) {
        channels.push({
          id: generateUUID(),
          name: readString(data, offset + 32, CHANNEL_NAME_LENGTH),
          mode: mode === CHANNEL_MODE.ANALOG ? 'analog' : 'dmr',
          rxFrequency: rxFreq,
          txFrequency: txFreq,
          power: data[offset + 4] === POWER_LEVEL.HIGH ? 'high' : 'low',
          contactIndex: readUInt16LE(data, offset + 6),
          rxGroupIndex: data[offset + 12],
          colorCode: data[offset + 8] & 0x0f,
          timeSlot: (data[offset + 9] & 0x01) === 0 ? 1 : 2,
        });
      }
    }
  }

  const zones: Zone[] = [];
  const zoneOffset = 0x40000;
  for (let i = 0; i < MAX_ZONES; i++) {
    const offset = zoneOffset + i * ZONE_SIZE;
    const zoneName = readString(data, offset, 16);
    const channelCount = readUInt16LE(data, offset + 64);
    
    if (zoneName.trim().length > 0 || channelCount > 0) {
      const channelIndices: number[] = [];
      for (let j = 0; j < Math.min(channelCount, 16); j++) {
        const ch = readUInt16LE(data, offset + 16 + j * 2);
        if (ch < channels.length) {
          channelIndices.push(ch);
        }
      }
      
      zones.push({
        id: generateUUID(),
        name: zoneName || `Zone ${i + 1}`,
        channelIndices,
      });
    }
  }

  return {
    channels,
    contacts,
    zones,
    rxGroups: [],
    generalSettings: {},
  };
}

export function serializeCodeplug(data: CodeplugData): Uint8Array {
  const codeplug = new Uint8Array(CODEPLUG_SIZE);
  
  const contactOffset = 0x10000;
  for (let i = 0; i < MAX_CONTACTS; i++) {
    const offset = contactOffset + i * CONTACT_SIZE;
    if (i < data.contacts.length) {
      const contact = data.contacts[i];
      writeUInt32LE(codeplug, offset, contact.dmrid);
      writeString(codeplug, offset + 8, contact.name, 16);
      writeString(codeplug, offset + 24, contact.callsign, 10);
      codeplug[offset + 34] = contact.callType;
    } else {
      writeUInt32LE(codeplug, offset, 0xffffffff);
    }
  }

  const channelOffset = 0x20000;
  for (let i = 0; i < MAX_CHANNELS; i++) {
    const offset = channelOffset + i * CHANNEL_SIZE;
    if (i < data.channels.length) {
      const channel = data.channels[i];
      codeplug[offset] = channel.mode === 'analog' ? CHANNEL_MODE.ANALOG : CHANNEL_MODE.DMR;
      codeplug[offset + 4] = channel.power === 'high' ? POWER_LEVEL.HIGH : POWER_LEVEL.LOW;
      writeUInt16LE(codeplug, offset + 6, channel.contactIndex);
      codeplug[offset + 8] = channel.colorCode & 0x0f;
      codeplug[offset + 9] = channel.timeSlot === 2 ? 0x01 : 0x00;
      codeplug[offset + 12] = channel.rxGroupIndex;
      
      const rxBCD = frequencyToBCD(channel.rxFrequency);
      const txBCD = frequencyToBCD(channel.txFrequency);
      codeplug.set(rxBCD.slice().reverse(), offset + 16);
      codeplug.set(txBCD.slice().reverse(), offset + 20);
      
      writeString(codeplug, offset + 32, channel.name, CHANNEL_NAME_LENGTH);
    } else {
      codeplug[offset] = 0xff;
    }
  }

  const zoneOffset = 0x40000;
  for (let i = 0; i < MAX_ZONES; i++) {
    const offset = zoneOffset + i * ZONE_SIZE;
    if (i < data.zones.length) {
      const zone = data.zones[i];
      writeString(codeplug, offset, zone.name, 16);
      writeUInt16LE(codeplug, offset + 64, zone.channelIndices.length);
      for (let j = 0; j < Math.min(zone.channelIndices.length, 16); j++) {
        writeUInt16LE(codeplug, offset + 16 + j * 2, zone.channelIndices[j]);
      }
    }
  }

  return codeplug;
}

export function createEmptyCodeplug(): CodeplugData {
  return {
    channels: [],
    contacts: [],
    zones: [],
    rxGroups: [],
    generalSettings: {},
  };
}