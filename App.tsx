import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Material, ViewMode, Stats, User, UserRole } from './types';
import { 
  fetchMaterials, 
  updateMaterial, 
  initGoogleApi, 
  isSignedIn, 
  onMaterialsChange, 
  onSyncStatusChange,
  getSyncStatus,
  forceSync,
  SyncStatus 
} from './services/api';
import Sidebar from './components/Sidebar';
import TopStats from './components/TopStats';
import MaterialTable from './components/MaterialTable';
import ConnectionModal from './components/ConnectionModal';
import { Menu, Download, Search, LogIn, RefreshCw, Cloud, CloudOff } from 'lucide-react';

const App: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.OVERVIEW);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isGoogleSignedIn, setIsGoogleSignedIn] = useState(false);
  
  // Sync Status
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isDirty: false,
    pendingCount: 0,
    lastSyncTime: null,
    isSyncing: false,
    lastError: null
  });

  // User State
  const [currentUser, setCurrentUser] = useState<User>({
    id: '1',
    name: 'Admin User',
    role: UserRole.ADMIN
  });

  // Callback for when SyncManager updates materials
  const handleMaterialsUpdate = useCallback((newMaterials: Material[]) => {
    setMaterials(newMaterials);
    setLoading(false);
  }, []);

  // Callback for sync status updates
  const handleSyncStatusUpdate = useCallback((status: SyncStatus) => {
    setSyncStatus(status);
    setIsGoogleSignedIn(!status.lastError);
  }, []);

  // Load Data Function
  const loadData = async (isPolling = false) => {
    if (!isPolling) setLoading(true);
    const data = await fetchMaterials();
    setMaterials(data);
    if (!isPolling) setLoading(false);
    
    // Check sign in status
    setIsGoogleSignedIn(isSignedIn());
  };

  // Initial Fetch & API Init
  useEffect(() => {
    // Register callbacks before init
    onMaterialsChange(handleMaterialsUpdate);
    onSyncStatusChange(handleSyncStatusUpdate);
    
    const init = async () => {
      await initGoogleApi();
      loadData();
      setSyncStatus(getSyncStatus());
    };
    init();

    // No more polling needed - SyncManager handles it
    return () => {
      // Cleanup if needed
    };
  }, [handleMaterialsUpdate, handleSyncStatusUpdate]);

  // Update Handler - Now uses optimistic update via SyncManager
  const handleUpdateMaterial = async (id: string, updates: Partial<Material>) => {
    // SyncManager handles optimistic UI update internally
    // This will update materials state via the onMaterialsChange callback
    await updateMaterial(id, updates);
  };

  // Handle manual sync
  const handleForceSync = async () => {
    await forceSync();
  };

  // Handle User Switching
  const handleSwitchUser = (role: UserRole) => {
    let name = 'User';
    switch (role) {
        case UserRole.ADMIN: name = 'Admin User'; break;
        case UserRole.PROCUREMENT: name = 'Procurement Staff'; break;
        case UserRole.GENERAL: name = 'General Staff'; break;
    }
    setCurrentUser({ id: role, name, role });
    setViewMode(ViewMode.OVERVIEW);
  };

  // Filter Logic
  const filteredMaterials = useMemo(() => {
    let result = materials;

    // 1. View Filter
    switch (viewMode) {
      case ViewMode.STOCK:
        // Show everything, prioritize showing location
        break;
      case ViewMode.PROCUREMENT:
        // Source is '採買' AND (Lack > 0 OR Status is '待買')
        result = result.filter(m => m.source === '採買' && (m.lack > 0 || m.status === '待買'));
        break;
      case ViewMode.BORROWING:
        result = result.filter(m => m.source === '借用');
        break;
      case ViewMode.ESTIMATION:
        result = result.filter(m => m.lack > 0);
        break;
      case ViewMode.ACTUAL_PURCHASE:
        result = result.filter(m => m.source === '採買');
        break;
      case ViewMode.CHECKLIST:
        // Usually items that have location assigned
        result = result.filter(m => !!m.loc);
        break;
      case ViewMode.SETTLEMENT:
        // All items
        break;
      case ViewMode.OVERVIEW:
      default:
        // All items
        break;
    }

    // 2. Search Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(m => 
        m.name.toLowerCase().includes(q) || 
        m.group.toLowerCase().includes(q) || 
        m.responsible.toLowerCase().includes(q)
      );
    }

    return result;
  }, [materials, viewMode, searchQuery]);

  // Stats Calculation
  const stats: Stats = useMemo(() => {
    const totalBudgetEst = materials
      .filter(m => m.lack > 0)
      .reduce((sum, m) => sum + (m.unitPrice * m.lack), 0);

    const actualSpend = materials
      .reduce((sum, m) => sum + (m.actualPrice * m.actualQty), 0);

    const itemsToBuy = materials.filter(m => m.source === '採買');
    const itemsBought = itemsToBuy.filter(m => m.status === '已買' || m.status === '足夠');
    const procurementProgress = itemsToBuy.length > 0 ? (itemsBought.length / itemsToBuy.length) * 100 : 0;

    const packingProgress = materials.length > 0 
        ? (materials.filter(m => m.packed).length / materials.length) * 100 
        : 0;

    return { totalBudgetEst, actualSpend, procurementProgress, packingProgress };
  }, [materials]);

  // CSV Export
  const handleExport = () => {
    const headers = ["ID", "組別", "品項", "規格", "來源", "位置", "負責人", "需求", "缺額", "預估單價", "實際單價", "實際數量", "狀態", "裝箱", "清點", "備註"];
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + materials.map(m => [
          m.id, m.group, m.name, m.description, m.source, m.loc, m.responsible, m.need, m.lack, m.unitPrice, m.actualPrice, m.actualQty, m.status, m.packed, m.counted, m.note
        ].join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "materials_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPageTitle = (mode: ViewMode) => {
    switch (mode) {
      case ViewMode.OVERVIEW: return '物資總覽';
      case ViewMode.STOCK: return '庫存總覽';
      case ViewMode.PROCUREMENT: return '採購總覽';
      case ViewMode.BORROWING: return '借用總覽';
      case ViewMode.ESTIMATION: return '預算估價';
      case ViewMode.ACTUAL_PURCHASE: return '實際採買回報';
      case ViewMode.CHECKLIST: return '裝箱清單 Check';
      case ViewMode.SETTLEMENT: return '營後結算';
      default: return '';
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* Sidebar */}
      <Sidebar 
        currentView={viewMode} 
        onViewChange={setViewMode} 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        onOpenConnection={() => setIsConnectionModalOpen(true)}
      />

      {/* Connection Modal */}
      <ConnectionModal 
        isOpen={isConnectionModalOpen} 
        onClose={() => setIsConnectionModalOpen(false)}
        onSave={() => {
            loadData(false);
            setIsGoogleSignedIn(true);
        }} 
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Header Toolbar */}
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between z-30 shadow-sm shrink-0">
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="lg:hidden p-2 hover:bg-slate-100 rounded-md text-slate-600"
                >
                    <Menu size={24} />
                </button>
                <h2 className="text-xl font-bold text-slate-800 hidden sm:block">
                    {getPageTitle(viewMode)}
                </h2>
                
                {/* Auth Status / Connection Button */}
                {!isGoogleSignedIn ? (
                    <button 
                        onClick={() => setIsConnectionModalOpen(true)}
                        className="flex items-center gap-1.5 text-xs bg-white border border-slate-300 px-3 py-1.5 rounded-full hover:bg-slate-50 transition text-slate-600"
                    >
                        <LogIn size={14} />
                        <span className="hidden sm:inline">連接 Apps Script</span>
                        <span className="sm:hidden">連接</span>
                    </button>
                ) : (
                    <div className="flex items-center gap-2">
                        {/* Sync Status Indicator */}
                        <button
                            onClick={handleForceSync}
                            disabled={syncStatus.isSyncing}
                            className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded border transition-colors ${
                                syncStatus.pendingCount > 0 
                                    ? 'text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100' 
                                    : 'text-emerald-600 bg-emerald-50 border-emerald-100 hover:bg-emerald-100'
                            } ${syncStatus.isSyncing ? 'opacity-70 cursor-wait' : ''}`}
                            title={syncStatus.lastSyncTime 
                                ? `上次同步: ${new Date(syncStatus.lastSyncTime).toLocaleTimeString('zh-TW')}\n點擊立即同步` 
                                : '點擊立即同步'}
                        >
                            {syncStatus.isSyncing ? (
                                <RefreshCw size={12} className="animate-spin" />
                            ) : syncStatus.pendingCount > 0 ? (
                                <CloudOff size={12} />
                            ) : (
                                <Cloud size={12} />
                            )}
                            <span className="hidden sm:inline">
                                {syncStatus.isSyncing 
                                    ? '同步中...' 
                                    : syncStatus.pendingCount > 0 
                                        ? `${syncStatus.pendingCount} 待同步`
                                        : '已同步'}
                            </span>
                        </button>
                        <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 hidden sm:inline-block">
                            已連線
                        </span>
                    </div>
                )}

                {/* Mobile User Role Indicator */}
                <span className={`sm:hidden text-xs font-bold px-2 py-1 rounded text-white
                    ${currentUser.role === UserRole.ADMIN ? 'bg-indigo-500' : 
                      currentUser.role === UserRole.PROCUREMENT ? 'bg-orange-500' : 'bg-slate-500'}
                `}>
                    {currentUser.role}
                </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto ml-4 sm:ml-0">
                <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="搜尋品項、組別..." 
                        className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <button 
                    onClick={handleExport}
                    className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-full transition-colors"
                    title="匯出 CSV"
                >
                    <Download size={20} />
                </button>
            </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20">
            
            {/* Stats Dashboard */}
            <TopStats stats={stats} />

            {/* View Title (Mobile Only) */}
            <h2 className="text-xl font-bold text-slate-800 mb-4 sm:hidden">
                {getPageTitle(viewMode)}
            </h2>

            {/* List */}
            {loading ? (
                <div className="flex justify-center items-center h-64 text-slate-500">
                    載入中...
                </div>
            ) : (
                <>
                     <MaterialTable
                      materials={filteredMaterials}
                      viewMode={viewMode}
                      onUpdate={handleUpdateMaterial}
                      currentUser={currentUser}
                     />
                   {filteredMaterials.length === 0 && (
                       <div className="text-center py-12 text-slate-400">
                           <p>沒有符合條件的項目</p>
                       </div>
                   )}
                </>
            )}
        </div>
      </main>
    </div>
  );
};

export default App;