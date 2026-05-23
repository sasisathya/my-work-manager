import fs from 'fs';
import path from 'path';

export interface AppConfig {
  app: {
    name: string;
    port: number;
    description: string;
  };
  jira: {
    baseUrl: string;
    email: string;
    apiToken: string;
    defaultProject: string;
  };
  confluence?: {
    baseUrl: string;
    email: string;
    token: string;
  };
  github: {
    token: string;
    repository?: string;
  };
  ai: {
    provider: string;
    apiKey: string;
    model: string;
    baseUrl?: string;
    enabled: boolean;
  };
  storage: {
    encryptionKey: string;
    dataPath: string;
    attachmentsPath: string;
    secretsPath: string;
  };
  features: {
    aiTextEnhancement: boolean;
    imageUpload: boolean;
    autoTransitionToInProgress: boolean;
    maxAttachmentSizeMB: number;
  };
  theme?: {
    primaryColor: string;
    secondaryColor: string;
  };
  kafka?: {
    bootstrapServers: string;
    apiKey: string;
    apiSecret: string;
  };
  docker?: {
    kafkaComposePath: string;
    observabilityComposePath: string;
  };
}

let cachedConfig: AppConfig | null = null;

export function loadConfig(): AppConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const configPath = path.join(process.cwd(), 'config.json');

  if (!fs.existsSync(configPath)) {
    throw new Error('config.json not found. Please create it from config.json template.');
  }

  const configData = fs.readFileSync(configPath, 'utf-8');
  cachedConfig = JSON.parse(configData);

  // Auto-generate encryption key if not set
  if (cachedConfig && cachedConfig.storage.encryptionKey === 'AUTO_GENERATED_ON_FIRST_RUN') {
    cachedConfig.storage.encryptionKey = generateEncryptionKey();
    saveConfig(cachedConfig);
  }

  // Ensure data directories exist
  if (cachedConfig) {
    ensureDirectories(cachedConfig);
  }

  return cachedConfig!;
}

function generateEncryptionKey(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}

function ensureDirectories(config: AppConfig) {
  const dirs = [
    config.storage.dataPath,
    config.storage.attachmentsPath,
    config.storage.secretsPath,
  ];

  dirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });
}

export function saveConfig(config: AppConfig) {
  const configPath = path.join(process.cwd(), 'config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  cachedConfig = config; // Update cache
}

export function getConfig() {
  return loadConfig();
}

export function isConfigured(): boolean {
  try {
    const config = loadConfig();

    // Check if Jira is configured
    const jiraConfigured =
      config.jira.baseUrl !== 'https://your-domain.atlassian.net' &&
      config.jira.email !== 'your-email@example.com' &&
      config.jira.apiToken !== 'YOUR_JIRA_API_TOKEN_HERE' &&
      config.jira.baseUrl.trim() !== '' &&
      config.jira.email.trim() !== '' &&
      config.jira.apiToken.trim() !== '';

    return jiraConfigured;
  } catch (error) {
    return false;
  }
}

export function updateConfig(updates: Partial<AppConfig>): AppConfig {
  const current = loadConfig();
  const updated: AppConfig = {
    ...current,
    ...updates,
    jira: { ...current.jira, ...(updates.jira || {}) },
    github: { ...current.github, ...(updates.github || {}) },
    ai: { ...current.ai, ...(updates.ai || {}) },
    app: { ...current.app, ...(updates.app || {}) },
    storage: { ...current.storage, ...(updates.storage || {}) },
    features: { ...current.features, ...(updates.features || {}) },
  };

  // Handle optional fields separately
  if (current.confluence || updates.confluence) {
    updated.confluence = { ...current.confluence, ...(updates.confluence || {}) } as AppConfig['confluence'];
  }
  if (current.theme || updates.theme) {
    updated.theme = { ...current.theme, ...(updates.theme || {}) } as AppConfig['theme'];
  }
  if (current.kafka || updates.kafka) {
    updated.kafka = { ...current.kafka, ...(updates.kafka || {}) } as AppConfig['kafka'];
  }
  if (current.docker || updates.docker) {
    updated.docker = { ...current.docker, ...(updates.docker || {}) } as AppConfig['docker'];
  }

  saveConfig(updated);
  return updated;
}
