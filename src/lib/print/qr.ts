// FILE: src/lib/print/qr.ts
// STAGE: 3
// UPDATED: 2026-10-01
import QRCode from 'qrcode';

export async function generateInspectionQrDataUrl(
  verifyUrl: string,
  sizePx = 256
): Promise<string> {
  return QRCode.toDataURL(verifyUrl, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: sizePx,
  });
}
