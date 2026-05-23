import CryptoJS from 'crypto-js';
import { getConfig } from './config';

export class EncryptionService {
  private encryptionKey: string;

  constructor() {
    const config = getConfig();
    this.encryptionKey = config.storage.encryptionKey;
  }

  encrypt(data: string): string {
    return CryptoJS.AES.encrypt(data, this.encryptionKey).toString();
  }

  decrypt(encryptedData: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  encryptObject(obj: any): string {
    const jsonString = JSON.stringify(obj);
    return this.encrypt(jsonString);
  }

  decryptObject<T>(encryptedData: string): T {
    const decrypted = this.decrypt(encryptedData);
    return JSON.parse(decrypted);
  }
}

export const encryption = new EncryptionService();
