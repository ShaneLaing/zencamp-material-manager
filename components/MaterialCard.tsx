import React, { useState } from 'react';
import { Material, ViewMode, UserRole, User } from '../types';
import { MapPin, Camera } from 'lucide-react';

interface MaterialCardProps {
  material: Material;
  viewMode: ViewMode;
  onUpdate: (id: string, updates: Partial<Material>) => void;
  currentUser: User;
}

const MaterialCard: React.FC<MaterialCardProps> = ({ material, viewMode, onUpdate, currentUser }) => {
  const [uploading, setUploading] = useState(false);

  // Helper to handle input changes
  const handleChange = (field: keyof Material, value: any) => {
    onUpdate(material.id, { [field]: value });
  };

  const handlePhotoUpload = () => {
    setUploading(true);
    // Simulate upload
    setTimeout(() => {
      alert('模擬功能：照片上傳成功！');
      setUploading(false);
    }, 1000);
  };

  // Permission Logic
  const canEdit = (): boolean => {
    if (currentUser.role === UserRole.ADMIN) return true;
    if (currentUser.role === UserRole.GENERAL) return false;
    
    // Procurement can ONLY edit in 'Actual Purchase Report'
    if (currentUser.role === UserRole.PROCUREMENT) {
        return viewMode === ViewMode.ACTUAL_PURCHASE;
    }
    
    return false;
  };

  const isEditable = canEdit();

  // Status Badge Logic
  const getStatusColor = (status: string) => {
    const s = String(status || '').trim();
    if (s.includes('已買') || s.includes('OK')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (s.includes('待買')) return 'bg-orange-100 text-orange-700 border-orange-200';
    if (s.includes('缺貨')) return 'bg-red-100 text-red-700 border-red-200';
    if (s.includes('庫存')) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (s.includes('借用')) return 'bg-purple-100 text-purple-700 border-purple-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className={`
      bg-white rounded-xl shadow-sm border overflow-hidden transition-shadow
      ${isEditable ? 'border-slate-200 hover:shadow-md' : 'border-slate-100 opacity-90'}
    `}>
      
      {/* Header Row */}
      <div className="p-4 border-b border-slate-100 flex justify-between items-start">
        <div>
            <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {material.group}
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${getStatusColor(material.status)}`}>
                    {material.status || '未定'}
                </span>
            </div>
            <h3 className="text-lg font-bold text-slate-800">{material.name}</h3>
            {/* Description/Usage */}
            <p className="text-sm text-slate-500 font-mono mt-0.5">{material.description || '無用途說明'}</p>
        </div>
        <div className="text-right">
             <div className="text-sm font-medium text-slate-600">{material.responsible}</div>
             {viewMode === ViewMode.STOCK && (
                 <div className="flex items-center gap-1 text-xs text-indigo-600 mt-1 font-bold">
                     <MapPin size={12} />
                     {material.loc || '未定'}
                 </div>
             )}
        </div>
      </div>

      {/* Body: Dynamic Content */}
      <div className="p-4 bg-slate-50/50">
        
        {/* VIEW: STOCK */}
        {viewMode === ViewMode.STOCK && (
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-2 text-slate-700">
                <MapPin size={16} className="text-indigo-500" />
                <span className="font-semibold">{material.loc || '未分配'}</span>
             </div>
             <div className="text-right">
                <p className="text-xs text-slate-500">擁有數量</p>
                <p className="text-xl font-bold text-slate-800">{material.owned || 0}</p>
             </div>
          </div>
        )}

        {/* VIEW: PROCUREMENT */}
        {viewMode === ViewMode.PROCUREMENT && (
          <div className="flex justify-between items-center">
             <div>
                <p className="text-xs text-slate-500">來源</p>
                <p className="font-medium text-slate-700">{material.source}</p>
             </div>
             <div className="text-right">
                <p className="text-xs text-slate-500">缺額 / 需求</p>
                <p className="text-lg font-bold text-orange-600">
                    {material.lack} <span className="text-slate-400 text-sm">/ {material.need}</span>
                </p>
             </div>
          </div>
        )}

        {/* VIEW: BORROWING */}
        {viewMode === ViewMode.BORROWING && (
            <div className="space-y-2">
                <div className="flex justify-between">
                    <span className="text-sm text-slate-500">借用對象:</span>
                    <span className="text-sm font-medium">{material.responsible}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-sm text-slate-500">備註:</span>
                    <input 
                        type="text" 
                        value={material.note}
                        disabled={!isEditable}
                        onChange={(e) => handleChange('note', e.target.value)}
                        placeholder={isEditable ? "備註..." : ""}
                        className={`text-sm border-b bg-transparent outline-none w-2/3 text-right
                            ${isEditable ? 'border-slate-300 focus:border-indigo-500' : 'border-transparent text-slate-500'}
                        `}
                    />
                </div>
            </div>
        )}

        {/* VIEW: ESTIMATION */}
        {viewMode === ViewMode.ESTIMATION && (
             <div className="flex justify-between items-center">
                <div>
                   <p className="text-xs text-slate-500">單價預估</p>
                   <div className="flex items-center text-slate-700">
                       <span className="text-xs mr-1">$</span>
                       <input 
                           type="number"
                           disabled={!isEditable}
                           className={`w-20 rounded px-2 py-1 text-sm outline-none border
                                ${isEditable ? 'bg-white border-slate-300 focus:ring-2 focus:ring-indigo-500' : 'bg-transparent border-transparent'}
                           `}
                           value={material.unitPrice}
                           onChange={(e) => handleChange('unitPrice', Number(e.target.value))}
                       />
                   </div>
                </div>
                <div className="text-right">
                   <p className="text-xs text-slate-500">缺額 x 單價</p>
                   <p className="text-lg font-bold text-slate-800">
                       ${((material.lack || 0) * (material.unitPrice || 0)).toLocaleString()}
                   </p>
                </div>
             </div>
        )}

        {/* VIEW: ACTUAL PURCHASE (SOP 6) */}
        {viewMode === ViewMode.ACTUAL_PURCHASE && (
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-slate-500 block mb-1">實際單價</label>
                        <input 
                           type="number"
                           disabled={!isEditable}
                           className={`w-full rounded px-2 py-2 text-sm outline-none border
                                ${isEditable ? 'bg-white border-slate-300 focus:ring-2 focus:ring-indigo-500' : 'bg-slate-100 border-slate-200 text-slate-500'}
                           `}
                           value={material.actualPrice}
                           onChange={(e) => handleChange('actualPrice', Number(e.target.value))}
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 block mb-1">實際數量</label>
                        <input 
                           type="number"
                           disabled={!isEditable}
                           className={`w-full rounded px-2 py-2 text-sm outline-none border
                                ${isEditable ? 'bg-white border-slate-300 focus:ring-2 focus:ring-indigo-500' : 'bg-slate-100 border-slate-200 text-slate-500'}
                           `}
                           value={material.actualQty}
                           onChange={(e) => handleChange('actualQty', Number(e.target.value))}
                        />
                    </div>
                </div>
                
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={handlePhotoUpload}
                            disabled={!isEditable}
                            className={`p-2 rounded-full transition-colors ${isEditable ? 'text-slate-500 hover:bg-slate-200' : 'text-slate-300 cursor-not-allowed'}`}
                            title="上傳收據"
                        >
                            <Camera size={20} />
                        </button>
                    </div>
                    <div className="text-right">
                        <span className="text-xs text-slate-500 mr-2">小計</span>
                        <span className={`text-lg font-bold ${(material.actualQty * material.actualPrice) > (material.lack * material.unitPrice) * 1.1 ? 'text-red-500' : 'text-slate-800'}`}>
                             ${((material.actualQty || 0) * (material.actualPrice || 0)).toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>
        )}

        {/* VIEW: CHECKLIST (SOP 7) */}
        {viewMode === ViewMode.CHECKLIST && (
            <div className="space-y-3">
                 <div className="flex items-center justify-between bg-white p-2 rounded border border-slate-200">
                    <label className={`flex items-center gap-3 select-none ${isEditable ? 'cursor-pointer' : 'cursor-default'}`}>
                        <input 
                            type="checkbox" 
                            className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 disabled:text-slate-400"
                            checked={material.packed}
                            disabled={!isEditable}
                            onChange={(e) => handleChange('packed', e.target.checked)}
                        />
                        <span className={`font-medium ${material.packed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>裝箱 Check</span>
                    </label>
                    <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">{material.loc}</span>
                 </div>

                 <div className="flex items-center justify-between bg-white p-2 rounded border border-slate-200">
                    <label className={`flex items-center gap-3 select-none ${isEditable ? 'cursor-pointer' : 'cursor-default'}`}>
                        <input 
                            type="checkbox" 
                            className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 disabled:text-slate-400"
                            checked={material.counted}
                            disabled={!isEditable}
                            onChange={(e) => handleChange('counted', e.target.checked)}
                        />
                        <span className={`font-medium ${material.counted ? 'text-slate-400 line-through' : 'text-slate-700'}`}>清點 Check</span>
                    </label>
                 </div>
                 
                 <input 
                    type="text"
                    placeholder={isEditable ? "備註..." : "無備註"}
                    className={`w-full text-sm border-b py-1 bg-transparent outline-none
                        ${isEditable ? 'border-slate-300 focus:border-indigo-500' : 'border-transparent text-slate-500'}
                    `}
                    disabled={!isEditable}
                    value={material.note}
                    onChange={(e) => handleChange('note', e.target.value)}
                 />
            </div>
        )}

        {/* VIEW: SETTLEMENT (SOP 8) */}
        {viewMode === ViewMode.SETTLEMENT && (
             <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <p className="text-xs text-slate-500 mb-1">實際擁有</p>
                        <p className="font-medium">{material.actualQty}</p>
                     </div>
                     <div>
                        <label className="text-xs text-slate-500 block mb-1">剩餘數量</label>
                        <input 
                           type="number"
                           disabled={!isEditable}
                           className={`w-full rounded px-2 py-1 text-sm border
                                ${isEditable ? 'bg-white border-slate-300' : 'bg-slate-100 border-slate-200 text-slate-500'}
                           `}
                           value={material.remaining}
                           onChange={(e) => handleChange('remaining', Number(e.target.value))}
                        />
                     </div>
                </div>
                <div>
                    <label className="text-xs text-slate-500 block mb-1">是否需要補充?</label>
                    <select 
                        className={`w-full rounded px-2 py-2 text-sm border
                             ${isEditable ? 'bg-white border-slate-300' : 'bg-slate-100 border-slate-200 text-slate-500'}
                        `}
                        disabled={!isEditable}
                        value={material.refill || ''}
                        onChange={(e) => handleChange('refill', e.target.value)}
                    >
                        <option value="">請選擇...</option>
                        <option value="是">是 (需補充)</option>
                        <option value="否">否 (不需補充)</option>
                    </select>
                </div>
                <div>
                     <label className="text-xs text-slate-500 block mb-1">傳承備註</label>
                    <textarea 
                        className={`w-full border rounded p-2 text-sm h-16
                             ${isEditable ? 'border-slate-300' : 'border-slate-200 bg-slate-100 text-slate-500'}
                        `}
                        placeholder={isEditable ? "給下一梯的話..." : ""}
                        disabled={!isEditable}
                        value={material.suggestion}
                        onChange={(e) => handleChange('suggestion', e.target.value)}
                    />
                </div>
             </div>
        )}

      </div>
    </div>
  );
};

export default MaterialCard;