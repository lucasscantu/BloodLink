import crypto from 'crypto';

/**
 * Generate SHA-256 hash for data
 */
export function generateHash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate hash for blood bag event
 */
export function generateEventHash(
  bagId: string,
  eventType: string,
  institutionId: string,
  userId: string | undefined,
  timestamp: Date,
  additionalData?: Record<string, unknown>
): string {
  const dataString = [
    bagId,
    eventType,
    institutionId,
    userId || '',
    timestamp.toISOString(),
    additionalData ? JSON.stringify(additionalData) : '',
  ].join('|');

  return generateHash(dataString);
}

/**
 * Generate hash for blood bag
 */
export function generateBloodBagHash(
  id: string,
  code: string,
  bloodType: string,
  factorRh: boolean,
  collectionDate: Date,
  expirationDate: Date
): string {
  const dataString = [
    id,
    code,
    bloodType,
    factorRh.toString(),
    collectionDate.toISOString(),
    expirationDate.toISOString(),
  ].join('|');

  return generateHash(dataString);
}

/**
 * Generate unique code for blood bag
 */
export function generateBloodBagCode(bloodType: string, factorRh: boolean): string {
  const typeSuffix = factorRh ? '+' : '-';
  const timestamp = Date.now().toString().slice(-6);
  const random = crypto.randomBytes(2).toString('hex').toUpperCase();
  
  return `${bloodType}-${timestamp}-${random}`;
}

/**
 * Verify hash integrity
 */
export function verifyHash(
  originalData: string,
  storedHash: string
): boolean {
  const generatedHash = generateHash(originalData);
  return generatedHash === storedHash;
}
