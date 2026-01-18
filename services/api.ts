import { Material, SheetConfig } from '../types';
import { INITIAL_MATERIALS } from '../constants';
import { syncManager, SyncStatus } from './syncManager';

const STORAGE_KEY_CONFIG = 'zencamp_sheet_config';
const STORAGE_KEY_DATA = 'zencamp_materials_cache';

// --- Configuration Management ---

export const getSheetConfig = (): SheetConfig | null => {
  const stored = localStorage.getItem(STORAGE_KEY_CONFIG);
  return stored ? JSON.parse(stored) : null;
};

export const saveSheetConfig = (config: SheetConfig) => {
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
};

// --- Apps Script API Connection ---

let isConnected = false;
let onMaterialsUpdate: ((materials: Material[]) => void) | null = null;
let onSyncStatusUpdate: ((status: SyncStatus) => void) | null = null;

export const initGoogleApi = async (): Promise<boolean> => {
  const config = getSheetConfig();
  if (!config || !config.appsScriptUrl) {
    isConnected = false;
    return false;
  }
  
  // Initialize the SyncManager with callbacks
  syncManager.init(
    config.appsScriptUrl,
    (materials) => {
      if (onMaterialsUpdate) {
        onMaterialsUpdate(materials);
      }
    },
    (status) => {
      isConnected = !status.lastError;
      if (onSyncStatusUpdate) {
        onSyncStatusUpdate(status);
      }
    }
  );
  
  isConnected = true;
  return true;
};

/**
 * Register callback for materials updates from sync
 */
export const onMaterialsChange = (callback: (materials: Material[]) => void) => {
  onMaterialsUpdate = callback;
};

/**
 * Register callback for sync status updates
 */
export const onSyncStatusChange = (callback: (status: SyncStatus) => void) => {
  onSyncStatusUpdate = callback;
};

export const signIn = async (): Promise<void> => {
  // No sign-in needed for Apps Script Web App
  const connected = await initGoogleApi();
  if (!connected) {
    throw new Error("無法連接到 Apps Script，請檢查 URL 設定");
  }
};

export const isSignedIn = (): boolean => {
  return isConnected;
};

/**
 * Get sync status for UI display
 */
export const getSyncStatus = (): SyncStatus => {
  return syncManager.getStatus();
};

/**
 * Check if there are unsaved changes
 */
export const hasUnsavedChanges = (): boolean => {
  return syncManager.hasUnsavedChanges();
};

/**
 * Force immediate sync
 */
export const forceSync = async (): Promise<boolean> => {
  return syncManager.forceSync();
};

// --- Data Fetching via SyncManager ---

export const fetchMaterials = async (): Promise<Material[]> => {
  const config = getSheetConfig();
  
  // If no config, return cached or initial data
  if (!config || !config.appsScriptUrl) {
    const stored = localStorage.getItem(STORAGE_KEY_DATA);
    return stored ? JSON.parse(stored) : INITIAL_MATERIALS;
  }

  // Return data from SyncManager (which handles the actual fetching)
  const data = syncManager.getData();
  if (data.length > 0) {
    return data;
  }

  // Fallback to cache if SyncManager hasn't loaded yet
  const stored = localStorage.getItem(STORAGE_KEY_DATA);
  return stored ? JSON.parse(stored) : INITIAL_MATERIALS;
};

// --- Data Updating via SyncManager (Optimistic UI) ---

export const updateMaterial = async (id: string, updates: Partial<Material>): Promise<boolean> => {
  // Add each change to the SyncManager queue
  // This is INSTANT - no waiting for API
  for (const [field, value] of Object.entries(updates)) {
    syncManager.addChange(id, field as keyof Material, value);
  }
  
  return true; // Always succeed (optimistic)
};

export const saveMaterials = async (materials: Material[]): Promise<boolean> => {
  localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(materials));
  return true;
};

// Re-export SyncStatus type
export type { SyncStatus };