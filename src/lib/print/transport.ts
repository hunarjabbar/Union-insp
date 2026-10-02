// FILE: src/lib/print/transport.ts
// STAGE: 3
// UPDATED: 2026-10-01
export interface PrintTransport {
  connect(): Promise<boolean>;
  print(bytes: Uint8Array): Promise<void>;
  disconnect(): void;
}

interface WebUSBPrinterInstance {
  connect(): Promise<boolean>;
  print(bytes: Uint8Array): Promise<void>;
  disconnect(): Promise<void> | void;
}

export class WebUSBTransport implements PrintTransport {
  private printer: WebUSBPrinterInstance | null = null;

  async connect(): Promise<boolean> {
    if (typeof window === 'undefined' || !(navigator as unknown as { usb?: unknown }).usb) {
      return false;
    }
    try {
      const WebUSBModule = await import(/* webpackIgnore: true */ '@point-of-sale/webusb-receipt-printer');
      const WebUSBClass = (WebUSBModule.default || WebUSBModule) as unknown as {
        new (): WebUSBPrinterInstance;
      };
      this.printer = new WebUSBClass();
      await this.printer.connect();
      return true;
    } catch {
      return false;
    }
  }

  async print(bytes: Uint8Array): Promise<void> {
    if (!this.printer) {
      const ok = await this.connect();
      if (!ok || !this.printer) {
        throw new Error('WebUSB receipt printer is not connected.');
      }
    }
    await this.printer.print(bytes);
  }

  disconnect(): void {
    if (this.printer) {
      try {
        void this.printer.disconnect();
      } catch {
        // Ignore errors
      }
      this.printer = null;
    }
  }
}

export class MockTransport implements PrintTransport {
  public printedBuffers: Uint8Array[] = [];
  public isConnected = false;

  async connect(): Promise<boolean> {
    this.isConnected = true;
    return true;
  }

  async print(bytes: Uint8Array): Promise<void> {
    this.printedBuffers.push(bytes);
  }

  disconnect(): void {
    this.isConnected = false;
  }

  clear(): void {
    this.printedBuffers = [];
  }
}
