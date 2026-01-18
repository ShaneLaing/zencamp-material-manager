import { Material } from '../types';

// --- Types ---
interface ChangeItem {
  id: string;
  rowIndex: number;
  field: string;
  value: any;
  timestamp: number;
}

interface SyncStatus {
  isDirty: boolean;
  pendingCount: number;
  lastSyncTime: number | null;
  isSyncing: boolean;
  lastError: string | null;
}

type SyncCallback = (materials: Material[]) => void;
type StatusCallback = (status: SyncStatus) => void;

// --- Constants ---
const SYNC_INTERVAL_MS = 60 * 1000; // 1 minute
const MAX_QUEUE_SIZE = 10; // Trigger sync when queue reaches this size
const STORAGE_KEY_DATA = 'zencamp_materials_cache';
const STORAGE_KEY_QUEUE = 'zencamp_sync_queue';

// --- Singleton Sync Manager ---
class SyncManager {
  private changeQueue: ChangeItem[] = [];
  private localData: Material[] = [];
  private serverData: Material[] = [];
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private isSyncing = false;
  private lastSyncTime: number | null = null;
  private lastError: string | null = null;
  private appsScriptUrl: string | null = null;
  
  private onDataUpdate: SyncCallback | null = null;
  private onStatusUpdate: StatusCallback | null = null;

  constructor() {
    // Load persisted queue from localStorage
    this.loadQueue();
    // Setup beforeunload warning
    this.setupExitGuard();
  }

  // --- Initialization ---
  
  init(appsScriptUrl: string, onDataUpdate: SyncCallback, onStatusUpdate: StatusCallback) {
    this.appsScriptUrl = appsScriptUrl;
    this.onDataUpdate = onDataUpdate;
    this.onStatusUpdate = onStatusUpdate;
    
    // Start sync loop
    this.startSyncLoop();
    
    // Initial fetch
    this.pull();
  }

  destroy() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  // --- Queue Management ---

  private loadQueue() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_QUEUE);
      if (stored) {
        this.changeQueue = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load sync queue:', e);
      this.changeQueue = [];
    }
  }

  private saveQueue() {
    try {
      localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(this.changeQueue));
    } catch (e) {
      console.warn('Failed to save sync queue:', e);
    }
  }

  private clearQueue() {
    this.changeQueue = [];
    localStorage.removeItem(STORAGE_KEY_QUEUE);
  }

  // --- Public API ---

  /**
   * Add a change to the queue (called by UI on user input)
   * This is INSTANT - no waiting for API
   */
  addChange(id: string, field: keyof Material, value: any) {
    const material = this.localData.find(m => m.id === id);
    if (!material) return;

    // Update local data immediately (Optimistic UI)
    const index = this.localData.findIndex(m => m.id === id);
    if (index !== -1) {
      this.localData[index] = { ...this.localData[index], [field]: value };
      
      // Notify UI immediately
      if (this.onDataUpdate) {
        this.onDataUpdate([...this.localData]);
      }
      
      // Save to local storage for persistence
      localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(this.localData));
    }

    // Add to change queue (deduplicate by id+field)
    const existingIndex = this.changeQueue.findIndex(
      c => c.id === id && c.field === field
    );
    
    const change: ChangeItem = {
      id,
      rowIndex: material.rowIndex || parseInt(id),
      field,
      value,
      timestamp: Date.now()
    };

    if (existingIndex !== -1) {
      // Update existing change
      this.changeQueue[existingIndex] = change;
    } else {
      // Add new change
      this.changeQueue.push(change);
    }

    this.saveQueue();
    this.notifyStatus();

    // Trigger sync if queue is large enough
    if (this.changeQueue.length >= MAX_QUEUE_SIZE) {
      this.sync();
    }
  }

  /**
   * Get current local data
   */
  getData(): Material[] {
    return this.localData;
  }

  /**
   * Get sync status for UI display
   */
  getStatus(): SyncStatus {
    return {
      isDirty: this.changeQueue.length > 0,
      pendingCount: this.changeQueue.length,
      lastSyncTime: this.lastSyncTime,
      isSyncing: this.isSyncing,
      lastError: this.lastError
    };
  }

  /**
   * Force immediate sync
   */
  async forceSync(): Promise<boolean> {
    return this.sync();
  }

  /**
   * Check if there are unsaved changes
   */
  hasUnsavedChanges(): boolean {
    return this.changeQueue.length > 0;
  }

  // --- Sync Logic ---

  private startSyncLoop() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    
    this.syncTimer = setInterval(() => {
      this.sync();
    }, SYNC_INTERVAL_MS);
  }

  private async sync(): Promise<boolean> {
    if (this.isSyncing || !this.appsScriptUrl) return false;

    this.isSyncing = true;
    this.lastError = null;
    this.notifyStatus();

    try {
      // Step 1: Push local changes if any
      if (this.changeQueue.length > 0) {
        await this.push();
      }

      // Step 2: Pull latest data from server
      await this.pull();

      this.lastSyncTime = Date.now();
      this.isSyncing = false;
      this.notifyStatus();
      return true;

    } catch (error: any) {
      console.error('Sync failed:', error);
      this.lastError = error.message || 'Sync failed';
      this.isSyncing = false;
      this.notifyStatus();
      return false;
    }
  }

  private async push(): Promise<void> {
    if (!this.appsScriptUrl || this.changeQueue.length === 0) return;

    // Prepare batch update payload
    const updates = this.changeQueue.map(c => ({
      rowIndex: c.rowIndex,
      field: c.field,
      value: c.value
    }));

    const response = await fetch(this.appsScriptUrl, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({
        action: 'batch_update',
        updates
      }),
    });

    if (!response.ok) {
      throw new Error(`Push failed: HTTP ${response.status}`);
    }

    const result = await response.json();
    if (result.status === 'error') {
      throw new Error(result.message || 'Push failed');
    }

    // Clear the queue after successful push
    this.clearQueue();
  }

  private async pull(): Promise<void> {
    if (!this.appsScriptUrl) {
      // No API configured, load from cache
      const stored = localStorage.getItem(STORAGE_KEY_DATA);
      if (stored) {
        this.localData = JSON.parse(stored);
        this.serverData = [...this.localData];
      }
      return;
    }

    const response = await fetch(this.appsScriptUrl, {
      method: 'GET',
      mode: 'cors',
    });

    if (!response.ok) {
      throw new Error(`Pull failed: HTTP ${response.status}`);
    }

    const rawData = await response.json();
    
    // Parse response
    let items: any[] = [];
    if (Array.isArray(rawData)) {
      items = rawData;
    } else if (rawData.status === 'error') {
      throw new Error(rawData.message || 'Pull failed');
    } else {
      items = rawData.data || rawData;
    }

    // Transform to Material type
    const newServerData: Material[] = items.map((item: any) => ({
      id: String(item.rowIndex || ''),
      rowIndex: item.rowIndex,
      category: String(item.category || ''),
      group: String(item.group || ''),
      name: String(item.name || ''),
      description: String(item.description || ''),
      source: String(item.source || ''),
      loc: String(item.loc || ''),
      owned: Number(item.owned) || 0,
      need: Number(item.need) || 0,
      lack: Number(item.lack) || 0,
      unitPrice: Number(item.unitPrice) || 0,
      totalEst: Number(item.totalEst) || 0,
      responsible: String(item.responsible || ''),
      actualPrice: Number(item.actualPrice) || 0,
      actualQty: Number(item.actualQty) || 0,
      actualTotal: Number(item.actualTotal) || 0,
      actualItem: String(item.actualItem || ''),
      receiptPhoto: String(item.receiptPhoto || ''),
      status: String(item.status || ''),
      packed: item.packed === true || String(item.packed).toLowerCase() === 'true',
      counted: item.counted === true || String(item.counted).toLowerCase() === 'true',
      countPhoto: String(item.countPhoto || ''),
      note: String(item.note || ''),
      remaining: Number(item.remaining) || 0,
      refill: String(item.refill || ''),
      suggestion: String(item.suggestion || ''),
    }));

    // Merge with local changes (Local-First strategy)
    this.serverData = newServerData;
    this.localData = this.mergeData(newServerData);

    // Save merged data to cache
    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(this.localData));

    // Notify UI
    if (this.onDataUpdate) {
      this.onDataUpdate([...this.localData]);
    }
  }

  /**
   * Merge server data with pending local changes
   * Local changes take priority (Local-First)
   */
  private mergeData(serverData: Material[]): Material[] {
    // Create a map of pending changes by id
    const pendingChanges = new Map<string, Map<string, any>>();
    
    for (const change of this.changeQueue) {
      if (!pendingChanges.has(change.id)) {
        pendingChanges.set(change.id, new Map());
      }
      pendingChanges.get(change.id)!.set(change.field, change.value);
    }

    // Apply pending changes over server data
    return serverData.map(item => {
      const changes = pendingChanges.get(item.id);
      if (!changes) return item;

      // Apply each pending change to this item
      const merged = { ...item };
      changes.forEach((value, field) => {
        (merged as any)[field] = value;
      });

      return merged;
    });
  }

  // --- Exit Guard ---

  private setupExitGuard() {
    window.addEventListener('beforeunload', (event) => {
      if (this.changeQueue.length > 0) {
        event.preventDefault();
        event.returnValue = ''; // Modern browsers standard
      }
    });
  }

  private notifyStatus() {
    if (this.onStatusUpdate) {
      this.onStatusUpdate(this.getStatus());
    }
  }
}

// Export singleton instance
export const syncManager = new SyncManager();
export type { SyncStatus };
