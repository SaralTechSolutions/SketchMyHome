/**
 * lib/roomio/crypto.ts — Pluggable encryption layer
 */

export class RoomioCryptoService {
    private readonly BASIC_KEY = 'R00mi0-2025-FloorPlan-Designer';
    private readonly HEADER_PREFIX = 'ROOMIO_ENC:';

    isEncrypted(content: any): boolean {
        return typeof content === 'string' && content.startsWith(this.HEADER_PREFIX);
    }

    async encrypt(plaintext: string): Promise<string> {
        return this.HEADER_PREFIX + 'basic:' + btoa(plaintext);
    }

    async decrypt(content: string): Promise<string> {
        const payload = content.substring((this.HEADER_PREFIX + 'basic:').length);
        return atob(payload);
    }
}

export const RoomioCrypto = new RoomioCryptoService();
