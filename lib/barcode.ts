import QRCode from 'qrcode';

/**
 * Generate a QR code as a base64 Data URL.
 * @param text The text or URL to encode in the QR code
 * @returns A Promise that resolves to a base64 encoded PNG Data URL
 */
export async function generateQRCode(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 200,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Failed to generate QR code', err);
    throw err;
  }
}

/**
 * Generate a QR code URL specifically for verifying a document.
 * @param origin The base URL of the site (e.g. https://pdam.go.id)
 * @param documentId The ID of the document/decision to verify
 */
export async function generateVerifyQRCode(origin: string, documentId: string): Promise<string> {
  const url = `${origin}/verify/${documentId}`;
  return generateQRCode(url);
}
