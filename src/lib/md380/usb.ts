export const MD380_USB_VID = 0x0483;
export const MD380_USB_PID = 0xdf11;

export const DFU_INTERFACE = 0;

export const MD380_COMMANDS = {
  PROGRAMMING_MODE: [0x91, 0x01],
  GET_HARDWARE_INFO: [0xa2, 0x01],
  STATE_SYNC_READ: [0xa2, 0x02],
  STATE_SYNC_ACK: [0xa2, 0x03],
  STATE_SYNC_READ2: [0xa2, 0x04],
  MEMORY_ALIGN: [0xa2, 0x07],
  FLASH_STAGING: [0xa2, 0x31],
  FLASH_EXECUTE: [0x91, 0x31],
  EXIT_PROGRAMMING: [0x91, 0x05],
} as const;

export const CHUNK_SIZE = 1024;
export const CODEPLUG_SIZE = 262709;
export const SPI_FLASH_BASE = 0x100000;

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
  private altSetting: USBAlternateInterface | null = null;
  private isConnected: boolean = false;

  async requestDevice(): Promise<USBDevice | null> {
    if (!navigator.usb) {
      console.error('WebUSB not supported in this browser');
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

  async sendCommand(command: number[]): Promise<boolean> {
    if (!this.device || !this.isConnected) {
      throw new Error('Device not connected');
    }

    try {
      const result = await this.device.controlTransferOut(
        {
          requestType: 'class',
          recipient: 'interface',
          request: 0xdf,
          value: 0,
          index: 0,
        },
        new Uint8Array(command)
      );

      return result.status === 'ok';
    } catch (error) {
      console.error('Command transfer failed:', error);
      return false;
    }
  }

  async enterProgrammingMode(): Promise<boolean> {
    return this.sendCommand([...MD380_COMMANDS.PROGRAMMING_MODE]);
  }

  async exitProgrammingMode(): Promise<boolean> {
    const result = await this.sendCommand([...MD380_COMMANDS.EXIT_PROGRAMMING]);
    await this.disconnect();
    return result;
  }

  async readData(
    address: number,
    length: number,
    onProgress?: (progress: TransferProgress) => void
  ): Promise<Uint8Array> {
    if (!this.device || !this.isConnected) {
      throw new Error('Device not connected');
    }

    const chunks: Uint8Array[] = [];
    let bytesTransferred = 0;
    const totalBytes = length;

    await this.sendCommand([...MD380_COMMANDS.STATE_SYNC_READ]);
    await this.sendCommand([...MD380_COMMANDS.STATE_SYNC_ACK]);

    while (bytesTransferred < length) {
      const chunkSize = Math.min(CHUNK_SIZE, length - bytesTransferred);
      
      try {
        const result = await this.device.controlTransferOut(
          {
            requestType: 'vendor',
            recipient: 'device',
            request: 0xa0,
            value: address + bytesTransferred,
            index: 0,
          },
          new Uint8Array([0xa2, 0x07])
        );

        if (result.status !== 'ok') {
          throw new Error('Control transfer failed');
        }

        const response = await this.device.controlTransferIn(
          {
            requestType: 'vendor',
            recipient: 'device',
            request: 0xa0,
            value: 0,
            index: 0,
          },
          chunkSize
        );

        if (response.data) {
          chunks.push(new Uint8Array(response.data.buffer));
          bytesTransferred += chunkSize;

          if (onProgress) {
            onProgress({
              bytesTransferred,
              totalBytes,
              percentage: (bytesTransferred / totalBytes) * 100,
            });
          }
        }
      } catch (error) {
        console.error('Read error:', error);
        throw error;
      }
    }

    const totalArray = new Uint8Array(bytesTransferred);
    let offset = 0;
    for (const chunk of chunks) {
      totalArray.set(chunk, offset);
      offset += chunk.length;
    }

    return totalArray;
  }

  async writeData(
    address: number,
    data: Uint8Array,
    onProgress?: (progress: TransferProgress) => void
  ): Promise<boolean> {
    if (!this.device || !this.isConnected) {
      throw new Error('Device not connected');
    }

    await this.sendCommand([...MD380_COMMANDS.FLASH_STAGING]);

    const totalBytes = data.length;
    let bytesTransferred = 0;
    let blockNumber = 0;

    while (bytesTransferred < totalBytes) {
      const chunkSize = Math.min(CHUNK_SIZE, totalBytes - bytesTransferred);
      const chunk = data.slice(bytesTransferred, bytesTransferred + chunkSize);

      try {
        const result = await this.device.controlTransferOut(
          {
            requestType: 'vendor',
            recipient: 'device',
            request: 0xa0,
            value: blockNumber,
            index: 0,
          },
          chunk
        );

        if (result.status !== 'ok') {
          throw new Error('Write transfer failed');
        }

        bytesTransferred += chunkSize;
        blockNumber++;

        if (onProgress) {
          onProgress({
            bytesTransferred,
            totalBytes,
            percentage: (bytesTransferred / totalBytes) * 100,
          });
        }

        await new Promise((resolve) => setTimeout(resolve, 10));
      } catch (error) {
        console.error('Write error:', error);
        throw error;
      }
    }

    await this.sendCommand([...MD380_COMMANDS.FLASH_EXECUTE]);
    return true;
  }

  async readCodeplug(
    onProgress?: (progress: TransferProgress) => void
  ): Promise<Uint8Array> {
    await this.enterProgrammingMode();
    await new Promise((resolve) => setTimeout(resolve, 500));
    return this.readData(0, CODEPLUG_SIZE, onProgress);
  }

  async writeCodeplug(
    data: Uint8Array,
    onProgress?: (progress: TransferProgress) => void
  ): Promise<boolean> {
    await this.enterProgrammingMode();
    await new Promise((resolve) => setTimeout(resolve, 500));
    return this.writeData(0, data, onProgress);
  }

  async readSPIFlash(
    offset: number,
    length: number,
    onProgress?: (progress: TransferProgress) => void
  ): Promise<Uint8Array> {
    return this.readData(SPI_FLASH_BASE + offset, length, onProgress);
  }

  async writeSPIFlash(
    offset: number,
    data: Uint8Array,
    onProgress?: (progress: TransferProgress) => void
  ): Promise<boolean> {
    return this.writeData(SPI_FLASH_BASE + offset, data, onProgress);
  }

  getDeviceInfo(): MD380DeviceInfo | null {
    if (!this.device) return null;

    const product = this.device.productName || '';
    const hasGPS = product.toLowerCase().includes('g');
    const vocoderType: 'old' | 'new' = 'new';

    return {
      vendorId: this.device.vendorId,
      productId: this.device.productId,
      manufacturer: this.device.manufacturerName || 'Unknown',
      product: product,
      serialNumber: this.device.serialNumber || 'Unknown',
      version: this.device.deviceVersion || '0.0',
      hasGPS,
      vocoderType,
      firmwareVersion: 'Unknown',
    };
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

export const md380Usb = new MD380WebUSB();
