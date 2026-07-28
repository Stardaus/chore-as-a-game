import { describe, it, expect } from 'vitest';
import { urlBase64ToUint8Array } from '../services/PushSubscriptionService';

describe('PushSubscriptionService - VAPID Key Validation', () => {
  const validVapidKey =
    'BESP-9psMEssn0nr6XJjKr0F4Fu_rYRfcBdwtFMFm90sGi344hfNtbT16MPF2-a7pdzvy3saBcjn54rWVp1qdGY';

  it('correctly converts valid uncompressed 65-byte VAPID key', () => {
    const bytes = urlBase64ToUint8Array(validVapidKey);
    expect(bytes.length).toBe(65);
    expect(bytes[0]).toBe(4); // 0x04 header for uncompressed P-256 point
  });

  it('strips surrounding quotes and whitespace from environment string', () => {
    const quotedKey = `  "${validVapidKey}"\n `;
    const bytes = urlBase64ToUint8Array(quotedKey);
    expect(bytes.length).toBe(65);
    expect(bytes[0]).toBe(4);
  });

  it('throws descriptive error for invalid key string length or content', () => {
    expect(() => urlBase64ToUint8Array('invalid_short_key')).toThrowError(
      /VAPID public key contains invalid base64 encoding|Invalid VAPID P-256 public key/
    );
  });

  it('detects when user accidentally copies 32-byte VAPID_PRIVATE_KEY instead of PUBLIC_KEY', () => {
    // 32-byte private key base64 (43 chars)
    const privateKey = 'MHcCAQEEIIG344hfNtbT16MPF2-a7pdzvy3saBcjn54';
    expect(() => urlBase64ToUint8Array(privateKey)).toThrowError(/You copied VAPID_PRIVATE_KEY/);
  });

  it('strips terminal table pipe characters', () => {
    const tableOutputKey = `│ ${validVapidKey} │`;
    const bytes = urlBase64ToUint8Array(tableOutputKey);
    expect(bytes.length).toBe(65);
  });

  it('throws descriptive error for empty VAPID key string', () => {
    expect(() => urlBase64ToUint8Array('')).toThrowError(/empty/);
  });
});
