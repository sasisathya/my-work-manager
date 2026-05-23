import fs from 'fs';
import path from 'path';
import { encryption } from './encryption';
import { getConfig } from './config';

export class SecureStorage {
  private secretsPath: string;

  constructor() {
    const config = getConfig();
    this.secretsPath = path.join(process.cwd(), config.storage.secretsPath);
  }

  async saveSecret(key: string, value: any): Promise<void> {
    const encrypted = encryption.encryptObject(value);
    const filePath = path.join(this.secretsPath, `${key}.enc`);

    fs.writeFileSync(filePath, encrypted, 'utf-8');
  }

  async getSecret<T>(key: string): Promise<T | null> {
    const filePath = path.join(this.secretsPath, `${key}.enc`);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    const encrypted = fs.readFileSync(filePath, 'utf-8');
    return encryption.decryptObject<T>(encrypted);
  }

  async deleteSecret(key: string): Promise<void> {
    const filePath = path.join(this.secretsPath, `${key}.enc`);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  async listSecrets(): Promise<string[]> {
    const files = fs.readdirSync(this.secretsPath);
    return files
      .filter(f => f.endsWith('.enc'))
      .map(f => f.replace('.enc', ''));
  }
}

export const storage = new SecureStorage();
