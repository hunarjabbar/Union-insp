declare module '@point-of-sale/receipt-printer-encoder' {
  interface ReceiptPrinterEncoderOptions {
    columns?: number;
    language?: string;
    imageMode?: string;
    feedBeforeCut?: number;
  }

  export default class ReceiptPrinterEncoder {
    constructor(options?: ReceiptPrinterEncoderOptions);
    initialize(): this;
    align(value: 'left' | 'center' | 'right'): this;
    bold(value: boolean): this;
    line(text: string): this;
    rule(): this;
    qrcode(data: string, model?: number, size?: number, errorCorrection?: 'l' | 'm' | 'q' | 'h'): this;
    feed(lines: number): this;
    cut(): this;
    encode(): Uint8Array;
  }
}

declare module '@point-of-sale/webusb-receipt-printer' {
  export default class WebUSBReceiptPrinter {
    constructor();
    connect(): Promise<boolean>;
    print(bytes: Uint8Array): Promise<void>;
    disconnect(): Promise<void> | void;
  }
}
