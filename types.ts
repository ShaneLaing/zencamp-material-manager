export enum ViewMode {
  OVERVIEW = 'OVERVIEW',
  STOCK = 'STOCK',
  PROCUREMENT = 'PROCUREMENT',
  BORROWING = 'BORROWING',
  ESTIMATION = 'ESTIMATION',
  ACTUAL_PURCHASE = 'ACTUAL_PURCHASE',
  CHECKLIST = 'CHECKLIST',
  SETTLEMENT = 'SETTLEMENT',
}

export enum UserRole {
  ADMIN = 'ADMIN',
  PROCUREMENT = 'PROCUREMENT',
  GENERAL = 'GENERAL',
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export interface SheetConfig {
  appsScriptUrl: string;
}

export interface Material {
  id: string; // Mapped from rowIndex
  rowIndex?: number; // 1-based row index in Sheet
  
  category: string; // 用途分類
  group: string; // 組別
  name: string; // 品項
  description: string; // 用途
  source: string; // 來源
  loc: string; // 位置
  
  owned: number; // 擁有數量
  need: number; // 這屆需求數量
  lack: number; // 缺多少
  
  unitPrice: number; // 單價
  totalEst: number; // 總額
  
  responsible: string; // 採購負責人
  
  actualPrice: number; // 實際單價
  actualQty: number; // 實際數量
  actualTotal: number; // 實際總額
  actualItem: string; // 實際物品
  
  receiptPhoto: string; // 收據照片
  
  status: string; // 採買CHECK
  
  packed: boolean; // 裝箱CHECK
  counted: boolean; // 清點CHECK(6/18)
  
  countPhoto: string; // 清點照片
  
  note: string; // 備註
  remaining: number; // 剩餘物資數量
  refill: string; // 是否需要補充
  suggestion: string; // 給第下一梯的備註
}

export interface Stats {
  totalBudgetEst: number;
  actualSpend: number;
  procurementProgress: number; // 0-100
  packingProgress: number; // 0-100
}

export type MaterialUpdate = Partial<Material>;

export type OverviewGroupBy = 'none' | 'category' | 'group' | 'source' | 'responsible';