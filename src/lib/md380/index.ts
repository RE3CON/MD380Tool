export { md380Usb, MD380WebUSB, SPI_FLASH_BASE, BLOCK_SIZE as CHUNK_SIZE } from './usb';
export { 
  parseCodeplug, 
  serializeCodeplug, 
  createEmptyCodeplug,
  CODEPLUG_SIZE,
  MAX_CHANNELS,
  CHANNEL_SIZE,
  MAX_CONTACTS,
  CONTACT_SIZE,
  MAX_ZONES,
  ZONE_SIZE,
  CHANNEL_MODE,
  POWER_LEVEL
} from './codeplug';
export type { 
  MD380DeviceInfo, 
  TransferProgress 
} from './usb';
export type { 
  CodeplugData, 
  Channel, 
  DigitalContact, 
  Zone, 
  RXGroupList 
} from './codeplug';
export { 
  fetchDMRUsers, 
  buildDMRBinary, 
  createDMRDatabase,
  downloadAndBuildDatabase 
} from './dmrdb';
export type { DMRUser, DMRDatabase } from './dmrdb';