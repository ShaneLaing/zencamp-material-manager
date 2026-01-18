import React from 'react';
import { ViewMode, UserRole, User } from '../types';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  HandPlatter, 
  Calculator, 
  Receipt, 
  ClipboardCheck, 
  Archive,
  X,
  Link as LinkIcon
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  currentUser: User;
  onSwitchUser: (role: UserRole) => void;
  onOpenConnection: () => void;
}

const ALL_MENU_ITEMS = [
  { mode: ViewMode.OVERVIEW, label: '物資總覽', icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.PROCUREMENT, UserRole.GENERAL] },
  { mode: ViewMode.STOCK, label: '庫存總覽', icon: Package, roles: [UserRole.ADMIN, UserRole.GENERAL] },
  { mode: ViewMode.PROCUREMENT, label: '採購總覽', icon: ShoppingCart, roles: [UserRole.ADMIN, UserRole.PROCUREMENT] },
  { mode: ViewMode.BORROWING, label: '借用總覽', icon: HandPlatter, roles: [UserRole.ADMIN, UserRole.GENERAL] },
  { mode: ViewMode.ESTIMATION, label: '估價', icon: Calculator, roles: [UserRole.ADMIN] },
  { mode: ViewMode.ACTUAL_PURCHASE, label: '實際採買回報', icon: Receipt, roles: [UserRole.ADMIN, UserRole.PROCUREMENT] },
  { mode: ViewMode.CHECKLIST, label: '清單 Check', icon: ClipboardCheck, roles: [UserRole.ADMIN] },
  { mode: ViewMode.SETTLEMENT, label: '結算', icon: Archive, roles: [UserRole.ADMIN] },
];

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, isOpen, setIsOpen, currentUser, onSwitchUser, onOpenConnection }) => {
  
  // Filter menu items based on user role
  const menuItems = ALL_MENU_ITEMS.filter(item => item.roles.includes(currentUser.role));

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col h-full
      `}>
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold tracking-wider">領禪營</h1>
            <p className="text-xs text-slate-400 mt-1">第10屆 物資管理系統</p>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.mode;
              return (
                <li key={item.mode}>
                  <button
                    onClick={() => {
                      onViewChange(item.mode);
                      setIsOpen(false); // Close on mobile after click
                    }}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                      ${isActive 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }
                    `}
                  >
                    <Icon size={18} />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-900">
          <div className="flex flex-col gap-3">
             {/* Connection Button */}
            {currentUser.role === UserRole.ADMIN && (
                <button 
                    onClick={() => {
                        onOpenConnection();
                        setIsOpen(false);
                    }}
                    className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors mb-2 px-1"
                >
                    <LinkIcon size={14} />
                    <span>連接 Sheet</span>
                </button>
            )}

            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                ${currentUser.role === UserRole.ADMIN ? 'bg-indigo-500' : 
                  currentUser.role === UserRole.PROCUREMENT ? 'bg-orange-500' : 'bg-slate-500'}
              `}>
                {currentUser.name.substring(0, 1)}
              </div>
              <div className="text-sm flex-1">
                <p className="font-medium">{currentUser.name}</p>
                <p className="text-slate-400 text-xs">{currentUser.role}</p>
              </div>
            </div>
            
            {/* Role Switcher (Simulator) */}
            <div className="mt-2 pt-2 border-t border-slate-800">
                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">切換身份 (模擬)</label>
                <select 
                    className="w-full mt-1 bg-slate-800 text-xs text-slate-300 border border-slate-700 rounded p-1.5 focus:outline-none focus:border-indigo-500"
                    value={currentUser.role}
                    onChange={(e) => onSwitchUser(e.target.value as UserRole)}
                >
                    <option value={UserRole.ADMIN}>Admin (總召/行政)</option>
                    <option value={UserRole.PROCUREMENT}>Procurement (採購)</option>
                    <option value={UserRole.GENERAL}>General (一般組員)</option>
                </select>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;