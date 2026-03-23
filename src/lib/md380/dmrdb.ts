function writeUInt32BE(data: Uint8Array, offset: number, value: number): void {
  data[offset] = (value >> 24) & 0xff;
  data[offset + 1] = (value >> 16) & 0xff;
  data[offset + 2] = (value >> 8) & 0xff;
  data[offset + 3] = value & 0xff;
}

export interface DMRUser {
  id: number;
  callsign: string;
  name: string;
  surname: string;
  city: string;
  state: string;
  country: string;
}

export interface RadioIDApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: DMRUser[];
}

export interface DMRDatabase {
  users: Map<number, DMRUser>;
  lastUpdated: Date;
}

const RADIOID_API_BASE = 'https://radioid.net/api/users';
const USER_NAME_LENGTH = 16;

export async function fetchDMRUsers(
  country?: string,
  state?: string,
  limit: number = 10000,
  onProgress?: (loaded: number, total: number) => void
): Promise<DMRUser[]> {
  const users: DMRUser[] = [];
  let url = `${RADIOID_API_BASE}?limit=${limit}`;
  
  if (country) {
    url += `&country=${encodeURIComponent(country)}`;
  }
  if (state) {
    url += `&state=${encodeURIComponent(state)}`;
  }

  let total = 0;
  let loaded = 0;

  while (url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data: RadioIDApiResponse = await response.json();
      total = data.count;
      users.push(...data.results);
      loaded = users.length;
      
      if (onProgress) {
        onProgress(loaded, total);
      }
      
      url = data.next || '';
    } catch (error) {
      console.error('Failed to fetch DMR users:', error);
      throw error;
    }
  }

  return users;
}

export function buildDMRBinary(users: DMRUser[]): Uint8Array {
  const sortedUsers = [...users].sort((a, b) => a.id - b.id);
  
  const entries: { id: number; name: Uint8Array }[] = [];
  
  for (const user of sortedUsers) {
    const name = `${user.callsign || ''} ${user.name || ''}`.trim().slice(0, USER_NAME_LENGTH);
    const encoder = new TextEncoder();
    const nameBytes = encoder.encode(name);
    
    const paddedName = new Uint8Array(USER_NAME_LENGTH);
    paddedName.set(nameBytes.slice(0, USER_NAME_LENGTH));
    
    entries.push({
      id: user.id,
      name: paddedName,
    });
  }

  const headerSize = 8;
  const entrySize = 4 + USER_NAME_LENGTH;
  const totalSize = headerSize + entries.length * entrySize;
  
  const buffer = new Uint8Array(totalSize);
  
  buffer[0] = 0x44;
  buffer[1] = 0x42;
  buffer[2] = 0x31;
  buffer[3] = 0x30;
  
  writeUInt32BE(buffer, 4, entries.length);
  
  let offset = headerSize;
  for (const entry of entries) {
    writeUInt32BE(buffer, offset, entry.id);
    offset += 4;
    buffer.set(entry.name, offset);
    offset += USER_NAME_LENGTH;
  }
  
  return buffer;
}

export function searchUserByID(db: DMRDatabase, dmrid: number): DMRUser | undefined {
  return db.users.get(dmrid);
}

export function createDMRDatabase(users: DMRUser[]): DMRDatabase {
  const userMap = new Map<number, DMRUser>();
  for (const user of users) {
    userMap.set(user.id, user);
  }
  return {
    users: userMap,
    lastUpdated: new Date(),
  };
}

export async function downloadAndBuildDatabase(
  country?: string,
  state?: string,
  onProgress?: (loaded: number, total: number) => void
): Promise<Uint8Array> {
  const users = await fetchDMRUsers(country, state, 10000, onProgress);
  return buildDMRBinary(users);
}