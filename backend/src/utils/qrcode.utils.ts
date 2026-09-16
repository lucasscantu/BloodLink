import QRCode from 'qrcode';
import { config } from '../config';

/**
 * Generate QR Code as data URL
 */
export async function generateQRCode(data: string): Promise<string> {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(data, {
      width: 300,
      height: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR Code:', error);
    throw new Error('Failed to generate QR Code');
  }
}

/**
 * Generate QR Code for blood bag
 */
export async function generateBloodBagQRCode(bagCode: string): Promise<string> {
  const url = `${config.frontend.url}/blood-bags/${encodeURIComponent(bagCode)}`;
  return generateQRCode(url);
}

/**
 * Generate QR Code as base64
 */
export async function generateQRCodeBase64(data: string): Promise<string> {
  try {
    const qrCodeString = await QRCode.toString(data, {
      type: 'terminal',
      small: true,
    });
    return qrCodeString;
  } catch (error) {
    console.error('Error generating QR Code:', error);
    throw new Error('Failed to generate QR Code');
  }
}
