// MD380 WebUSB Implementation
// Based on Android app smali decompilation: https://github.com/travisgoodspeed/md380-android

export const MD380_USB_VID = 0x0483;
export const MD380_USB_PID = 0xdf11;

// Standard DFU commands
export const DFU = {
  DETACH: 0x00,
  DNLOAD: 0x01,
  UPLOAD: 0x02,
  GETSTATUS: 0x03,
  CLRSTATUS: 0x04,
  GETSTATE: 0x05,
  ABORT: 0x06,
} as const;

// MD380-specific commands (sent via DNLOAD with two-byte payload)
export const MD380_COMMANDS = {
  // Enter programming mode (PC Program USB Mode) - sent as [0x91, 0x01]
  PROGRAMMING_MODE: 0x9101,
  
  // Exit programming and reboot - sent as [0x91, 0x05]
  EXIT_REBOOT: 0x9105,
  
  // Get hardware info - sent as [0xa2, 0x01]
  GET_HW_INFO: 0xa201,
  
  // State sync commands - sent as [0xa2, 0x02-0x07]
  STATE_SYNC_1: 0xa202,
  STATE_SYNC_2: 0xa203,
  STATE_SYNC_3: 0xa204,
  STATE_SYNC_4: 0xa207,
  
  // Firmware flash - sent as [0xa2, 0x31]
  FLASH_STAGE: 0xa231,
  
  // Erase command - sent as [0x41, 0x??, address...]
  ERASE: 0x41,
} as const;

// Transfer sizes
export const BLOCK_SIZE = 0x400;        // 1024 bytes
export const CODEPLUG_SIZE = 0x40000;   // 262144 bytes (0x40000)
export const FIRMWARE_MIN_SIZE = 0xF1B30; // 994816 bytes minimum
export const FIRMWARE_MAX_SIZE = 0x100000; // 1048576 bytes maximum
export const SPI_FLASH_BASE = 0x100000;

// DFU States
export const DFU_STATE = {
  STATE_DFU_IDLE: 2,
  STATE_DFU_DNLOAD_IDLE: 5,
  STATE_DFU_MANIFEST: 7,
  STATE_DFU_ERROR: 10,
} as const;

// USB request types
const USB_REQUEST_TYPE = {
  CLASS_INTERFACE: 0x21,      // DFU class request
  VENDOR_DEVICE: 0x40,        // Vendor request to device
  VENDOR_INTERFACE: 0x41,      // Vendor request to interface
} as const;

const DFU_REQUEST = {
  DNLOAD: 0x01,
  UPLOAD: 0x02,
  GETSTATUS: 0x03,
  CLRSTATUS: 0x04,
  GETSTATE: 0x05,
  ABORT: 0x06,
} as const;

export interface MD380DeviceInfo {
  vendorId: number;
  productId: number;
  manufacturer: string;
  product: string;
  serialNumber: string;
  version: string;
  hasGPS: boolean;
  vocoderType: 'old' | 'new';
  firmwareVersion: string;
}

export interface TransferProgress {
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
}

export class MD380WebUSB {
  private device: USBDevice | null = null;
  private interface: USBInterface | null = null;
  private isConnected: boolean = false;

  async requestDevice(): Promise<USBDevice | null> {
    if (!navigator.usb) {
      console.error('WebUSB not supported');
      return null;
    }
    
    try {
      this.device = await navigator.usb.requestDevice({
        filters: [
          { vendorId: MD380_USB_VID, productId: MD380_USB_PID },
        ],
      });
      
      await this.device.open();
      
      if (this.device.configuration === null) {
        await this.device.selectConfiguration(1);
      }
      
      return this.device;
    } catch (error) {
      console.error('Failed to request device:', error);
      return null;
    }
  }

  async connect(): Promise<boolean> {
    if (!this.device) {
      const device = await this.requestDevice();
      if (!device) return false;
    }
    
    try {
      if (!this.device) return false;
      
      if (this.device.opened) {
        this.isConnected = true;
        return true;
      }
      
      await this.device.open();
      
      if (this.device.configuration === null) {
        await this.device.selectConfiguration(1);
      }
      
      // Find DFU interface (class 0xFE = Application Specific)
      const interface_ = this.device.configuration?.interfaces.find(
        (i) => i.alternates[0].interfaceClass === 0xfe
      );
      
      if (!interface_) {
        console.error('DFU interface not found');
        return false;
      }
      
      await this.device.claimInterface(interface_.interfaceNumber);
      this.interface = interface_;
      this.isConnected = true;
      
      return true;
    } catch (error) {
      console.error('Failed to connect:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.device && this.interface) {
      try {
        await this.device.releaseInterface(this.interface.interfaceNumber);
      } catch (e) {
        console.error('Error releasing interface:', e);
      }
    }
    
    if (this.device?.opened) {
      try {
        await this.device.close();
      } catch (e) {
        console.error('Error closing device:', e);
      }
    }
    
    this.isConnected = false;
    this.device = null;
    this.interface = null;
  }

  // Send a DFU class request
  private async dfuRequest(request: number, value: number = 0, index: number = 0, data?: Uint8Array): Promise<boolean> {
    if (!this.device || !this.isConnected) {
      throw new Error('Device not connected');
    }

    try {
      const payload = data || new Uint8Array([0]);
      const result = await this.device.controlTransferOut(
        {
          requestType: 'class',
          recipient: 'interface',
          request,
          value,
          index,
        },
        payload as unknown as BufferSource
      );
      return result.status === 'ok';
    } catch (error) {
      console.error('DFU request failed:', error);
      return false;
    }
  }

  // Send MD380-specific command (two-byte payload via DNLOAD)
  private async md380cmd(a: number, b: number): Promise<boolean> {
    return this.dfuRequest(DFU_REQUEST.DNLOAD, 0, 0, new Uint8Array([a, b]));
  }

  // Enter DFU mode (standard)
  async enterDfuMode(): Promise<void> {
    // Poll until in dfuIDLE state
    while (true) {
      const state = await this.getState();
      if (state === DFU_STATE.STATE_DFU_IDLE) return;
      if (state === DFU_STATE.STATE_DFU_ERROR) {
        await this.dfuRequest(DFU_REQUEST.CLRSTATUS);
      } else if (state !== 2 && state !== 5) {
        // Not in dfuIDLE or dfuDNLOAD-IDLE, abort
        await this.dfuRequest(DFU_REQUEST.ABORT);
      }
      await new Promise(r => setTimeout(r, 10));
    }
  }

  // Enter programming mode (MD380-specific: 0x91 0x01)
  async enterProgrammingMode(): Promise<boolean> {
    return this.md380cmd(0x91, 0x01);
  }

  // Exit programming mode and reboot (MD380-specific: 0x91 0x05)
  async exitProgrammingMode(): Promise<void> {
    await this.md380cmd(0x91, 0x05);
    await this.disconnect();
  }

  // Get DFU state
  async getState(): Promise<number> {
    const data = await this.dfuRequest(DFU_REQUEST.GETSTATE, 0, 0, new Uint8Array(1));
    if (!data) return 0;
    
    const result = await this.device?.controlTransferIn(
      {
        requestType: 'class',
        recipient: 'interface',
        request: DFU_REQUEST.GETSTATE,
        value: 0,
        index: 0,
      },
      1
    );
    
    if (result?.data) {
      return result.data.getUint8(0);
    }
    return 0;
  }

  // Get DFU status
  async getStatus(): Promise<Uint8Array | null> {
    const result = await this.device?.controlTransferIn(
      {
        requestType: 'class',
        recipient: 'interface',
        request: DFU_REQUEST.GETSTATUS,
        value: 0,
        index: 0,
      },
      6
    );
    
    if (result?.data) {
      return new Uint8Array(result.data.buffer);
    }
    return null;
  }

  // Set memory address for next transfer
  async setAddress(address: number): Promise<boolean> {
    const buffer = new Uint8Array(5);
    buffer[0] = 0x21; // SET_ADDRESS pointer command
    buffer[1] = address & 0xFF;
    buffer[2] = (address >> 8) & 0xFF;
    buffer[3] = (address >> 16) & 0xFF;
    buffer[4] = (address >> 24) & 0xFF;
    
    return this.dfuRequest(DFU_REQUEST.DNLOAD, 0, 0, buffer);
  }

  // Erase flash block at address
  async eraseBlock(address: number): Promise<boolean> {
    const buffer = new Uint8Array(5);
    buffer[0] = MD380_COMMANDS.ERASE; // 0x41
    buffer[1] = address & 0xFF;
    buffer[2] = (address >> 8) & 0xFF;
    buffer[3] = (address >> 16) & 0xFF;
    buffer[4] = (address >> 24) & 0xFF;
    
    const result = await this.dfuRequest(DFU_REQUEST.DNLOAD, 0, 0, buffer);
    await this.getStatus(); // Poll status
    return result;
  }

  // Upload data from device (read)
  async upload(blockNumber: number, length: number = BLOCK_SIZE): Promise<Uint8Array | null> {
    const result = await this.device?.controlTransferIn(
      {
        requestType: 'vendor',
        recipient: 'device',
        request: 0xa0, // Custom vendor request
        value: blockNumber,
        index: 0,
      },
      length
    );
    
    if (result?.data) {
      return new Uint8Array(result.data.buffer);
    }
    return null;
  }

  // Download data to device (write)
  async download(blockNumber: number, data: Uint8Array): Promise<boolean> {
    if (!this.device || !this.isConnected) {
      throw new Error('Device not connected');
    }

    try {
      const result = await this.device.controlTransferOut(
        {
          requestType: 'vendor',
          recipient: 'device',
          request: 0xa0,
          value: blockNumber,
          index: 0,
        },
        data as unknown as BufferSource
      );
      
      return result.status === 'ok';
    } catch (error) {
      console.error('Download failed:', error);
      return false;
    }
  }

  // Read codeplug from radio (262144 bytes)
  async readCodeplug(
    onProgress?: (progress: TransferProgress) => void
  ): Promise<Uint8Array> {
    if (!this.device || !this.isConnected) {
      throw new Error('Device not connected');
    }

    // Enter programming mode
    await this.enterProgrammingMode();
    await new Promise(r => setTimeout(r, 500));

    // Send MD380 sync commands
    await this.md380cmd(0xa2, 0x01); // GET_HW_INFO
    await this.md380cmd(0xa2, 0x02); // STATE_SYNC_1
    await this.md380cmd(0xa2, 0x03); // STATE_SYNC_2
    await this.md380cmd(0xa2, 0x04); // STATE_SYNC_3
    await this.md380cmd(0xa2, 0x07); // STATE_SYNC_4

    // Set address to 0
    await this.setAddress(0);
    await this.enterProgrammingMode();
    await new Promise(r => setTimeout(r, 100));

    const totalBytes = CODEPLUG_SIZE;
    const data = new Uint8Array(totalBytes);
    let bytesRead = 0;
    let blockNumber = 2;

    while (bytesRead < totalBytes && blockNumber <= 0x102) {
      const chunk = await this.upload(blockNumber, BLOCK_SIZE);
      if (chunk && chunk.length > 0) {
        data.set(chunk, bytesRead);
        bytesRead += chunk.length;
        
        if (onProgress) {
          onProgress({
            bytesTransferred: bytesRead,
            totalBytes,
            percentage: (bytesRead / totalBytes) * 100,
          });
        }
      }
      blockNumber++;
    }

    return data;
  }

  // Write codeplug to radio (262144 bytes)
  async writeCodeplug(
    data: Uint8Array,
    onProgress?: (progress: TransferProgress) => void
  ): Promise<boolean> {
    if (!this.device || !this.isConnected) {
      throw new Error('Device not connected');
    }

    if (data.length !== CODEPLUG_SIZE) {
      console.error(`Codeplug must be ${CODEPLUG_SIZE} bytes, got ${data.length}`);
      return false;
    }

    // Enter programming mode
    await this.enterProgrammingMode();
    await new Promise(r => setTimeout(r, 500));

    // Send MD380 sync commands
    await this.md380cmd(0xa2, 0x01);
    await this.md380cmd(0xa2, 0x02);
    await this.md380cmd(0xa2, 0x03);
    await this.md380cmd(0xa2, 0x04);
    await this.md380cmd(0xa2, 0x07);

    // Erase blocks
    await this.eraseBlock(0);
    await this.eraseBlock(0x10000);
    await this.eraseBlock(0x20000);
    await this.eraseBlock(0x30000);

    // Set address to 0
    await this.setAddress(0);
    await this.enterProgrammingMode();
    await new Promise(r => setTimeout(r, 100));

    // Upload codeplug data in 1024-byte blocks
    const totalBytes = data.length;
    let bytesWritten = 0;
    let blockNumber = 2;

    while (bytesWritten < totalBytes && blockNumber <= 0x102) {
      const chunk = data.slice(bytesWritten, bytesWritten + BLOCK_SIZE);
      const success = await this.download(blockNumber, chunk);
      
      if (!success) {
        throw new Error(`Failed to write block ${blockNumber}`);
      }
      
      bytesWritten += chunk.length;
      blockNumber++;
      
      if (onProgress) {
        onProgress({
          bytesTransferred: bytesWritten,
          totalBytes,
          percentage: (bytesWritten / totalBytes) * 100,
        });
      }
      
      await new Promise(r => setTimeout(r, 5));
    }

    // Reboot
    await this.exitProgrammingMode();
    return true;
  }

  // Flash firmware to radio
  async flashFirmware(
    firmware: Uint8Array,
    onProgress?: (progress: TransferProgress) => void
  ): Promise<boolean> {
    if (!this.device || !this.isConnected) {
      throw new Error('Device not connected');
    }

    const totalBytes = firmware.length;
    
    if (totalBytes < FIRMWARE_MIN_SIZE || totalBytes > FIRMWARE_MAX_SIZE) {
      console.error(`Firmware must be ${FIRMWARE_MIN_SIZE}-${FIRMWARE_MAX_SIZE} bytes`);
      return false;
    }

    // Enter firmware upgrade mode
    await this.md380cmd(0x91, 0x01);
    await this.md380cmd(0xa2, 0x31);

    // Erase firmware area (0x0800C000 to 0x080F0000)
    await this.eraseBlock(0x0800C000);
    for (let addr = 0x08010000; addr < 0x080F0000; addr += 0x10000) {
      await this.eraseBlock(addr);
    }

    // Upload firmware
    let bytesWritten = 0;
    let blockNumber = 0;

    while (bytesWritten < totalBytes) {
      const chunk = firmware.slice(bytesWritten, bytesWritten + BLOCK_SIZE);
      
      await this.setAddress(0x0800C000 + bytesWritten);
      await this.download(blockNumber, chunk);
      
      bytesWritten += chunk.length;
      blockNumber++;
      
      if (onProgress) {
        onProgress({
          bytesTransferred: bytesWritten,
          totalBytes,
          percentage: (bytesWritten / totalBytes) * 100,
        });
      }
      
      await new Promise(r => setTimeout(r, 5));
    }

    // Reboot
    await this.exitProgrammingMode();
    return true;
  }

  getDeviceInfo(): MD380DeviceInfo | null {
    if (!this.device) return null;

    const product = this.device.productName || '';
    const hasGPS = product.toLowerCase().includes('g');

    return {
      vendorId: this.device.vendorId,
      productId: this.device.productId,
      manufacturer: this.device.manufacturerName || 'Unknown',
      product: product,
      serialNumber: this.device.serialNumber || 'Unknown',
      version: this.device.deviceVersion || '0.0',
      hasGPS,
      vocoderType: 'new', // Would need additional detection
      firmwareVersion: 'Unknown',
    };
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Legacy readData method (wrapper around readCodeplug)
  async readData(
    address: number,
    length: number,
    onProgress?: (progress: TransferProgress) => void
  ): Promise<Uint8Array> {
    if (address === 0 && length === CODEPLUG_SIZE) {
      return this.readCodeplug(onProgress);
    }
    throw new Error('Unsupported address/length');
  }

  // Legacy writeData method (wrapper around writeCodeplug)
  async writeData(
    address: number,
    data: Uint8Array,
    onProgress?: (progress: TransferProgress) => void
  ): Promise<boolean> {
    if (address === 0 && data.length === CODEPLUG_SIZE) {
      return this.writeCodeplug(data, onProgress);
    }
    throw new Error('Unsupported address/length');
  }

  // Write to SPI Flash
  async writeSPIFlash(
    offset: number,
    data: Uint8Array,
    onProgress?: (progress: TransferProgress) => void
  ): Promise<boolean> {
    // SPI Flash write - simplified implementation
    if (!this.device || !this.isConnected) {
      throw new Error('Device not connected');
    }
    
    // Enter programming mode first
    await this.enterProgrammingMode();
    await new Promise(r => setTimeout(r, 500));
    
    // Write to SPI Flash at base + offset
    const address = SPI_FLASH_BASE + offset;
    await this.setAddress(address);
    
    let bytesWritten = 0;
    let blockNumber = 0;
    
    while (bytesWritten < data.length) {
      const chunk = data.slice(bytesWritten, bytesWritten + BLOCK_SIZE);
      await this.download(blockNumber, chunk);
      bytesWritten += chunk.length;
      blockNumber++;
      
      if (onProgress) {
        onProgress({
          bytesTransferred: bytesWritten,
          totalBytes: data.length,
          percentage: (bytesWritten / data.length) * 100,
        });
      }
    }
    
    return true;
  }
}

export const md380Usb = new MD380WebUSB();
