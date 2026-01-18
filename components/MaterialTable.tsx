import React from 'react';
import { Material, ViewMode, UserRole, User } from '../types';
import { Camera } from 'lucide-react';

interface MaterialTableProps {
  materials: Material[];
  viewMode: ViewMode;
  onUpdate: (id: string, updates: Partial<Material>) => void;
  currentUser: User;
}

const MaterialTable: React.FC<MaterialTableProps> = ({ materials, viewMode, onUpdate, currentUser }) => {
  // Permission Logic
  const canEdit = (): boolean => {
    if (currentUser.role === UserRole.ADMIN) return true;
    if (currentUser.role === UserRole.GENERAL) return false;
    if (currentUser.role === UserRole.PROCUREMENT) {
      return viewMode === ViewMode.ACTUAL_PURCHASE;
    }
    return false;
  };

  const isEditable = canEdit();

  const handleChange = (id: string, field: keyof Material, value: any) => {
    onUpdate(id, { [field]: value });
  };

  const handlePhotoUpload = () => {
    alert('模擬功能：照片上傳成功！');
  };

  const getStatusColor = (status: string) => {
    const s = String(status || '').trim();
    if (s.includes('已買') || s.includes('OK')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (s.includes('待買')) return 'bg-orange-100 text-orange-700 border-orange-200';
    if (s.includes('缺貨')) return 'bg-red-100 text-red-700 border-red-200';
    if (s.includes('庫存')) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (s.includes('借用')) return 'bg-purple-100 text-purple-700 border-purple-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const renderHeader = () => {
    switch (viewMode) {
      case ViewMode.STOCK:
        return (
          <tr>
            <th className="px-3 py-2 text-left">組別</th>
            <th className="px-3 py-2 text-left">狀態</th>
            <th className="px-3 py-2 text-left">品項</th>
            <th className="px-3 py-2 text-left">用途</th>
            <th className="px-3 py-2 text-left">負責人</th>
            <th className="px-3 py-2 text-left">位置</th>
            <th className="px-3 py-2 text-right">擁有數量</th>
          </tr>
        );
      case ViewMode.PROCUREMENT:
        return (
          <tr>
            <th className="px-3 py-2 text-left">組別</th>
            <th className="px-3 py-2 text-left">狀態</th>
            <th className="px-3 py-2 text-left">品項</th>
            <th className="px-3 py-2 text-left">用途</th>
            <th className="px-3 py-2 text-left">負責人</th>
            <th className="px-3 py-2 text-left">來源</th>
            <th className="px-3 py-2 text-right">缺額 / 需求</th>
          </tr>
        );
      case ViewMode.BORROWING:
        return (
          <tr>
            <th className="px-3 py-2 text-left">組別</th>
            <th className="px-3 py-2 text-left">狀態</th>
            <th className="px-3 py-2 text-left">品項</th>
            <th className="px-3 py-2 text-left">用途</th>
            <th className="px-3 py-2 text-left">借用對象</th>
            <th className="px-3 py-2 text-left">備註</th>
          </tr>
        );
      case ViewMode.ESTIMATION:
        return (
          <tr>
            <th className="px-3 py-2 text-left">組別</th>
            <th className="px-3 py-2 text-left">狀態</th>
            <th className="px-3 py-2 text-left">品項</th>
            <th className="px-3 py-2 text-left">用途</th>
            <th className="px-3 py-2 text-left">負責人</th>
            <th className="px-3 py-2 text-left">單價預估</th>
            <th className="px-3 py-2 text-right">小計</th>
          </tr>
        );
      case ViewMode.ACTUAL_PURCHASE:
        return (
          <tr>
            <th className="px-3 py-2 text-left">組別</th>
            <th className="px-3 py-2 text-left">狀態</th>
            <th className="px-3 py-2 text-left">品項</th>
            <th className="px-3 py-2 text-left">用途</th>
            <th className="px-3 py-2 text-left">負責人</th>
            <th className="px-3 py-2 text-left">實際單價</th>
            <th className="px-3 py-2 text-left">實際數量</th>
            <th className="px-3 py-2 text-right">小計</th>
            <th className="px-3 py-2 text-center">收據</th>
          </tr>
        );
      case ViewMode.CHECKLIST:
        return (
          <tr>
            <th className="px-3 py-2 text-left">組別</th>
            <th className="px-3 py-2 text-left">狀態</th>
            <th className="px-3 py-2 text-left">品項</th>
            <th className="px-3 py-2 text-left">用途</th>
            <th className="px-3 py-2 text-left">裝箱</th>
            <th className="px-3 py-2 text-left">清點</th>
            <th className="px-3 py-2 text-left">位置</th>
            <th className="px-3 py-2 text-left">備註</th>
          </tr>
        );
      case ViewMode.SETTLEMENT:
        return (
          <tr>
            <th className="px-3 py-2 text-left">組別</th>
            <th className="px-3 py-2 text-left">狀態</th>
            <th className="px-3 py-2 text-left">品項</th>
            <th className="px-3 py-2 text-left">用途</th>
            <th className="px-3 py-2 text-left">實際擁有</th>
            <th className="px-3 py-2 text-left">剩餘數量</th>
            <th className="px-3 py-2 text-left">是否需要補充</th>
            <th className="px-3 py-2 text-left">傳承備註</th>
          </tr>
        );
      case ViewMode.OVERVIEW:
      default:
        return (
          <tr>
            <th className="px-3 py-2 text-left">組別</th>
            <th className="px-3 py-2 text-left">狀態</th>
            <th className="px-3 py-2 text-left">品項</th>
            <th className="px-3 py-2 text-left">用途</th>
            <th className="px-3 py-2 text-left">負責人</th>
          </tr>
        );
    }
  };

  const renderRow = (material: Material) => {
    switch (viewMode) {
      case ViewMode.STOCK:
        return (
          <tr key={material.id} className="border-b border-slate-100">
            <td className="px-3 py-2 text-sm text-slate-700">{material.group}</td>
            <td className="px-3 py-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded border ${getStatusColor(material.status)}`}>
                {material.status || '未定'}
              </span>
            </td>
            <td className="px-3 py-2 text-sm font-medium text-slate-800">{material.name}</td>
            <td className="px-3 py-2 text-sm text-slate-500">{material.description || '無用途說明'}</td>
            <td className="px-3 py-2 text-sm text-slate-600">{material.responsible}</td>
            <td className="px-3 py-2 text-sm text-indigo-600">{material.loc || '未分配'}</td>
            <td className="px-3 py-2 text-right text-sm font-semibold text-slate-800">{material.owned || 0}</td>
          </tr>
        );
      case ViewMode.PROCUREMENT:
        return (
          <tr key={material.id} className="border-b border-slate-100">
            <td className="px-3 py-2 text-sm text-slate-700">{material.group}</td>
            <td className="px-3 py-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded border ${getStatusColor(material.status)}`}>
                {material.status || '未定'}
              </span>
            </td>
            <td className="px-3 py-2 text-sm font-medium text-slate-800">{material.name}</td>
            <td className="px-3 py-2 text-sm text-slate-500">{material.description || '無用途說明'}</td>
            <td className="px-3 py-2 text-sm text-slate-600">{material.responsible}</td>
            <td className="px-3 py-2 text-sm text-slate-700">{material.source}</td>
            <td className="px-3 py-2 text-right text-sm font-semibold text-orange-600">
              {material.lack} <span className="text-slate-400">/ {material.need}</span>
            </td>
          </tr>
        );
      case ViewMode.BORROWING:
        return (
          <tr key={material.id} className="border-b border-slate-100">
            <td className="px-3 py-2 text-sm text-slate-700">{material.group}</td>
            <td className="px-3 py-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded border ${getStatusColor(material.status)}`}>
                {material.status || '未定'}
              </span>
            </td>
            <td className="px-3 py-2 text-sm font-medium text-slate-800">{material.name}</td>
            <td className="px-3 py-2 text-sm text-slate-500">{material.description || '無用途說明'}</td>
            <td className="px-3 py-2 text-sm text-slate-600">{material.responsible}</td>
            <td className="px-3 py-2">
              <input
                type="text"
                value={material.note}
                disabled={!isEditable}
                onChange={(e) => handleChange(material.id, 'note', e.target.value)}
                placeholder={isEditable ? '備註...' : ''}
                className={`w-full text-sm border-b bg-transparent outline-none
                  ${isEditable ? 'border-slate-300 focus:border-indigo-500' : 'border-transparent text-slate-500'}
                `}
              />
            </td>
          </tr>
        );
      case ViewMode.ESTIMATION:
        return (
          <tr key={material.id} className="border-b border-slate-100">
            <td className="px-3 py-2 text-sm text-slate-700">{material.group}</td>
            <td className="px-3 py-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded border ${getStatusColor(material.status)}`}>
                {material.status || '未定'}
              </span>
            </td>
            <td className="px-3 py-2 text-sm font-medium text-slate-800">{material.name}</td>
            <td className="px-3 py-2 text-sm text-slate-500">{material.description || '無用途說明'}</td>
            <td className="px-3 py-2 text-sm text-slate-600">{material.responsible}</td>
            <td className="px-3 py-2">
              <input
                type="number"
                disabled={!isEditable}
                className={`w-24 rounded px-2 py-1 text-sm outline-none border
                  ${isEditable ? 'bg-white border-slate-300 focus:ring-2 focus:ring-indigo-500' : 'bg-transparent border-transparent'}
                `}
                value={material.unitPrice}
                onChange={(e) => handleChange(material.id, 'unitPrice', Number(e.target.value))}
              />
            </td>
            <td className="px-3 py-2 text-right text-sm font-semibold text-slate-800">
              ${((material.lack || 0) * (material.unitPrice || 0)).toLocaleString()}
            </td>
          </tr>
        );
      case ViewMode.ACTUAL_PURCHASE:
        return (
          <tr key={material.id} className="border-b border-slate-100">
            <td className="px-3 py-2 text-sm text-slate-700">{material.group}</td>
            <td className="px-3 py-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded border ${getStatusColor(material.status)}`}>
                {material.status || '未定'}
              </span>
            </td>
            <td className="px-3 py-2 text-sm font-medium text-slate-800">{material.name}</td>
            <td className="px-3 py-2 text-sm text-slate-500">{material.description || '無用途說明'}</td>
            <td className="px-3 py-2 text-sm text-slate-600">{material.responsible}</td>
            <td className="px-3 py-2">
              <input
                type="number"
                disabled={!isEditable}
                className={`w-24 rounded px-2 py-1 text-sm outline-none border
                  ${isEditable ? 'bg-white border-slate-300 focus:ring-2 focus:ring-indigo-500' : 'bg-slate-100 border-slate-200 text-slate-500'}
                `}
                value={material.actualPrice}
                onChange={(e) => handleChange(material.id, 'actualPrice', Number(e.target.value))}
              />
            </td>
            <td className="px-3 py-2">
              <input
                type="number"
                disabled={!isEditable}
                className={`w-24 rounded px-2 py-1 text-sm outline-none border
                  ${isEditable ? 'bg-white border-slate-300 focus:ring-2 focus:ring-indigo-500' : 'bg-slate-100 border-slate-200 text-slate-500'}
                `}
                value={material.actualQty}
                onChange={(e) => handleChange(material.id, 'actualQty', Number(e.target.value))}
              />
            </td>
            <td className={`px-3 py-2 text-right text-sm font-semibold ${(material.actualQty * material.actualPrice) > (material.lack * material.unitPrice) * 1.1 ? 'text-red-500' : 'text-slate-800'}`}>
              ${((material.actualQty || 0) * (material.actualPrice || 0)).toLocaleString()}
            </td>
            <td className="px-3 py-2 text-center">
              <button
                onClick={handlePhotoUpload}
                disabled={!isEditable}
                className={`p-2 rounded-full transition-colors ${isEditable ? 'text-slate-500 hover:bg-slate-200' : 'text-slate-300 cursor-not-allowed'}`}
                title="上傳收據"
              >
                <Camera size={18} />
              </button>
            </td>
          </tr>
        );
      case ViewMode.CHECKLIST:
        return (
          <tr key={material.id} className="border-b border-slate-100">
            <td className="px-3 py-2 text-sm text-slate-700">{material.group}</td>
            <td className="px-3 py-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded border ${getStatusColor(material.status)}`}>
                {material.status || '未定'}
              </span>
            </td>
            <td className="px-3 py-2 text-sm font-medium text-slate-800">{material.name}</td>
            <td className="px-3 py-2 text-sm text-slate-500">{material.description || '無用途說明'}</td>
            <td className="px-3 py-2">
              <label className={`inline-flex items-center gap-2 ${isEditable ? 'cursor-pointer' : 'cursor-default'}`}>
                <input
                  type="checkbox"
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 disabled:text-slate-400"
                  checked={material.packed}
                  disabled={!isEditable}
                  onChange={(e) => handleChange(material.id, 'packed', e.target.checked)}
                />
                <span className={`text-sm ${material.packed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>裝箱</span>
              </label>
            </td>
            <td className="px-3 py-2">
              <label className={`inline-flex items-center gap-2 ${isEditable ? 'cursor-pointer' : 'cursor-default'}`}>
                <input
                  type="checkbox"
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 disabled:text-slate-400"
                  checked={material.counted}
                  disabled={!isEditable}
                  onChange={(e) => handleChange(material.id, 'counted', e.target.checked)}
                />
                <span className={`text-sm ${material.counted ? 'text-slate-400 line-through' : 'text-slate-700'}`}>清點</span>
              </label>
            </td>
            <td className="px-3 py-2 text-sm text-slate-600">{material.loc}</td>
            <td className="px-3 py-2">
              <input
                type="text"
                placeholder={isEditable ? '備註...' : '無備註'}
                className={`w-full text-sm border-b py-1 bg-transparent outline-none
                  ${isEditable ? 'border-slate-300 focus:border-indigo-500' : 'border-transparent text-slate-500'}
                `}
                disabled={!isEditable}
                value={material.note}
                onChange={(e) => handleChange(material.id, 'note', e.target.value)}
              />
            </td>
          </tr>
        );
      case ViewMode.SETTLEMENT:
        return (
          <tr key={material.id} className="border-b border-slate-100">
            <td className="px-3 py-2 text-sm text-slate-700">{material.group}</td>
            <td className="px-3 py-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded border ${getStatusColor(material.status)}`}>
                {material.status || '未定'}
              </span>
            </td>
            <td className="px-3 py-2 text-sm font-medium text-slate-800">{material.name}</td>
            <td className="px-3 py-2 text-sm text-slate-500">{material.description || '無用途說明'}</td>
            <td className="px-3 py-2 text-sm text-slate-600">{material.actualQty}</td>
            <td className="px-3 py-2">
              <input
                type="number"
                disabled={!isEditable}
                className={`w-24 rounded px-2 py-1 text-sm border
                  ${isEditable ? 'bg-white border-slate-300' : 'bg-slate-100 border-slate-200 text-slate-500'}
                `}
                value={material.remaining}
                onChange={(e) => handleChange(material.id, 'remaining', Number(e.target.value))}
              />
            </td>
            <td className="px-3 py-2">
              <select
                className={`w-full rounded px-2 py-1 text-sm border
                  ${isEditable ? 'bg-white border-slate-300' : 'bg-slate-100 border-slate-200 text-slate-500'}
                `}
                disabled={!isEditable}
                value={material.refill || ''}
                onChange={(e) => handleChange(material.id, 'refill', e.target.value)}
              >
                <option value="">請選擇...</option>
                <option value="是">是 (需補充)</option>
                <option value="否">否 (不需補充)</option>
              </select>
            </td>
            <td className="px-3 py-2">
              <textarea
                className={`w-full border rounded p-2 text-sm h-16
                  ${isEditable ? 'border-slate-300' : 'border-slate-200 bg-slate-100 text-slate-500'}
                `}
                placeholder={isEditable ? '給下一梯的話...' : ''}
                disabled={!isEditable}
                value={material.suggestion}
                onChange={(e) => handleChange(material.id, 'suggestion', e.target.value)}
              />
            </td>
          </tr>
        );
      case ViewMode.OVERVIEW:
      default:
        return (
          <tr key={material.id} className="border-b border-slate-100">
            <td className="px-3 py-2 text-sm text-slate-700">{material.group}</td>
            <td className="px-3 py-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded border ${getStatusColor(material.status)}`}>
                {material.status || '未定'}
              </span>
            </td>
            <td className="px-3 py-2 text-sm font-medium text-slate-800">{material.name}</td>
            <td className="px-3 py-2 text-sm text-slate-500">{material.description || '無用途說明'}</td>
            <td className="px-3 py-2 text-sm text-slate-600">{material.responsible}</td>
          </tr>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            {renderHeader()}
          </thead>
          <tbody>
            {materials.map(renderRow)}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MaterialTable;