/**
 * Web Crypto API AES-GCM Encryption Adapter for IndexedDB storage.
 * 
 * Provides transparent encryption/decryption of local persisted application state.
 */

const SALT = new TextEncoder().encode('ChoreQuest-Secure-Storage-Salt-v1');
const SECRET_KEY_SEED = 'ChoreQuest-App-State-Encryption-Passphrase-2026';

let cryptoKeyCache: CryptoKey | null = null;

async function getEncryptionKey(): Promise<CryptoKey> {
    if (cryptoKeyCache) return cryptoKeyCache;

    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(SECRET_KEY_SEED),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    cryptoKeyCache = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: SALT,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );

    return cryptoKeyCache;
}

export const StorageEncryption = {
    /**
     * Encrypt a string value into a base64 string (containing IV + Ciphertext).
     */
    encrypt: async (plaintext: string): Promise<string> => {
        try {
            const key = await getEncryptionKey();
            const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
            const encodedPlaintext = new TextEncoder().encode(plaintext);

            const ciphertextBuffer = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv },
                key,
                encodedPlaintext
            );

            const combined = new Uint8Array(iv.length + ciphertextBuffer.byteLength);
            combined.set(iv, 0);
            combined.set(new Uint8Array(ciphertextBuffer), iv.length);

            // Return prefixed string to easily identify encrypted state
            return 'enc:' + btoa(String.fromCharCode(...combined));
        } catch (error) {
            console.error('Encryption failed, falling back to raw payload:', error);
            return plaintext;
        }
    },

    /**
     * Decrypt a base64 string back into plaintext. Backward compatible with plain JSON strings.
     */
    decrypt: async (payload: string): Promise<string> => {
        if (!payload) return payload;

        // Backward compatibility: If payload isn't encrypted, return directly
        if (!payload.startsWith('enc:')) {
            return payload;
        }

        try {
            const key = await getEncryptionKey();
            const base64Data = payload.slice(4);
            const binaryStr = atob(base64Data);
            const combined = new Uint8Array(binaryStr.length);
            for (let i = 0; i < binaryStr.length; i++) {
                combined[i] = binaryStr.charCodeAt(i);
            }

            const iv = combined.slice(0, 12);
            const ciphertext = combined.slice(12);

            const decryptedBuffer = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                key,
                ciphertext
            );

            return new TextDecoder().decode(decryptedBuffer);
        } catch (error) {
            console.error('Decryption failed:', error);
            return payload;
        }
    }
};
