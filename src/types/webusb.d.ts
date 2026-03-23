export {};

declare global {
  interface Navigator {
    usb?: {
      requestDevice(options: USBDeviceRequestOptions): Promise<USBDevice>;
      getDevices(): Promise<USBDevice[]>;
      addEventListener(event: 'connect', listener: (event: USBConnectionEvent) => void): void;
      addEventListener(event: 'disconnect', listener: (event: USBConnectionEvent) => void): void;
    };
  }

  interface USBDeviceRequestOptions {
    filters: USBDeviceFilter[];
    multiple?: boolean;
  }

  interface USBDeviceFilter {
    vendorId?: number;
    productId?: number;
    classCode?: number;
    subclassCode?: number;
    protocolCode?: number;
    serialNumber?: string;
  }

  interface USBConnectionEvent extends Event {
    device: USBDevice;
  }

  interface USBDevice {
    vendorId: number;
    productId: number;
    deviceVersion: string;
    manufacturerName?: string;
    productName?: string;
    serialNumber?: string;
    configuration?: USBConfiguration;
    opened: boolean;
    configurationValue: number;

    open(): Promise<void>;
    close(): Promise<void>;
    selectConfiguration(configurationValue: number): Promise<void>;
    claimInterface(interfaceNumber: number): Promise<void>;
    releaseInterface(interfaceNumber: number): Promise<void>;
    selectAlternateInterface(interfaceNumber: number, alternateSetting: number): Promise<void>;
    controlTransferIn(
      setup: USBControlTransferParameters,
      length: number
    ): Promise<USBTransferResult>;
    controlTransferOut(
      setup: USBControlTransferParameters,
      data?: BufferSource
    ): Promise<USBTransferResult>;
    isochronousTransferIn(
      endpointNumber: number,
      packetLengths: number[]
    ): Promise<USBIsochronousInTransferResult>;
    isochronousTransferOut(
      endpointNumber: number,
      data: BufferSource,
      packetLengths: number[]
    ): Promise<USBIsochronousOutTransferResult>;
    transferIn(
      endpointNumber: number,
      length: number
    ): Promise<USBInTransferResult>;
    transferOut(
      endpointNumber: number,
      data: BufferSource
    ): Promise<USBOutTransferResult>;
  }

  interface USBConfiguration {
    configurationValue: number;
    configurationName?: string;
    interfaces: USBInterface[];
  }

  interface USBInterface {
    interfaceNumber: number;
    alternates: USBAlternateInterface[];
  }

  interface USBAlternateInterface {
    alternateSetting: number;
    interfaceClass: number;
    interfaceSubclass: number;
    interfaceProtocol: number;
    interfaceName?: string;
    endpoints: USBEndpoint[];
  }

  interface USBEndpoint {
    endpointNumber: number;
    direction: 'in' | 'out';
    type: 'bulk' | 'interrupt' | 'isochronous' | 'control';
    packetSize: number;
  }

  interface USBControlTransferParameters {
    requestType: 'standard' | 'class' | 'vendor';
    recipient: 'device' | 'interface' | 'endpoint' | 'other';
    request: number;
    value: number;
    index: number;
  }

  interface USBTransferResult {
    status: 'ok' | 'stalled' | 'babble' | 'timeout' | 'aborted' | 'reserved';
    bytesWritten?: number;
    data?: DataView;
  }

  interface USBInTransferResult extends USBTransferResult {
    data?: DataView;
  }

  interface USBOutTransferResult extends USBTransferResult {
    bytesWritten: number;
  }

  interface USBIsochronousInTransferResult {
    data?: DataView;
    packets: USBIsochronousInTransferPacket[];
  }

  interface USBIsochronousInTransferPacket {
    data?: DataView;
    status: 'ok' | 'error' | 'abort' | 'babble' | 'reserved';
  }

  interface USBIsochronousOutTransferResult {
    packets: USBIsochronousOutTransferPacket[];
  }

  interface USBIsochronousOutTransferPacket {
    status: 'ok' | 'error' | 'abort' | 'babble' | 'reserved';
  }
}