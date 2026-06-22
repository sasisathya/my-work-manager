'use client';

import { useConfig as useGlobalConfig } from '@/contexts/ConfigContext';

/**
 * useConfig Hook - Simplified wrapper around global config context
 *
 * This hook is the recommended way to access configuration throughout the app
 * It automatically handles loading and error states
 *
 * Usage:
 * const { isConfigured, config, refetch } = useConfig();
 * if (!isConfigured) return <SetupRequired />;
 *
 * The global config is fetched ONCE on app startup, not per-page
 */
export { useGlobalConfig as useConfig };
