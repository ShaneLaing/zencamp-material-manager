import React from 'react';
import { Material, ViewMode, UserRole, User, OverviewGroupBy } from '../types';
import { Camera, ChevronDown } from 'lucide-react';

interface MaterialTableProps {
  materials: Material[];
  viewMode: ViewMode;
  onUpdate: (id: string, updates: Partial<Material>) => void;
  currentUser: User;
  groupBy?: OverviewGroupBy;
  collapsedGroups?: Record<string, boolean>;
  onToggleGroup?: (groupKey: string) => void;
}

const MaterialTable: React.FC<MaterialTableProps> = ({
  materials,
  viewMode,
  onUpdate,
  currentUser,
  groupBy = 'none',
  collapsedGroups = {},
  onToggleGroup
}) => {
  const tagPalettes: Record<'category' | 'group' | 'source' | 'responsible', string[]> = {
    category: [
      'bg-indigo-50 text-indigo-700 border-indigo-200',
      'bg-emerald-50 text-emerald-700 border-emerald-200',
      'bg-amber-50 text-amber-700 border-amber-200',
      'bg-sky-50 text-sky-700 border-sky-200',
      'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
      'bg-rose-50 text-rose-700 border-rose-200',
      'bg-lime-50 text-lime-700 border-lime-200',
      'bg-teal-50 text-teal-700 border-teal-200'
    ],
    group: [
      'bg-violet-50 text-violet-700 border-violet-200',
      'bg-cyan-50 text-cyan-700 border-cyan-200',
      'bg-orange-50 text-orange-700 border-orange-200',
      'bg-blue-50 text-blue-700 border-blue-200',
      'bg-pink-50 text-pink-700 border-pink-200',
      'bg-emerald-50 text-emerald-700 border-emerald-200'
    ],
    source: [
      'bg-slate-50 text-slate-700 border-slate-200',
      'bg-green-50 text-green-700 border-green-200',
      'bg-yellow-50 text-yellow-700 border-yellow-200',
      'bg-indigo-50 text-indigo-700 border-indigo-200',
      'bg-red-50 text-red-700 border-red-200'
    ],
    responsible: [
      'bg-blue-50 text-blue-700 border-blue-200',
      'bg-amber-50 text-amber-700 border-amber-200',
      'bg-emerald-50 text-emerald-700 border-emerald-200',
      'bg-violet-50 text-violet-700 border-violet-200',
      'bg-rose-50 text-rose-700 border-rose-200',
      'bg-teal-50 text-teal-700 border-teal-200',
      'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
      'bg-sky-50 text-sky-700 border-sky-200'
    ]
  };

  const getTagClass = (value: string, type: keyof typeof tagPalettes) => {
    const safeValue = value || '未指定';
    let hash = 0;
    for (let i = 0; i < safeValue.length; i++) {
      hash = (hash * 31 + safeValue.charCodeAt(i)) >>> 0;
    }
    const palette = tagPalettes[type];
    return palette[hash % palette.length];
  };

  const renderTag = (value: string, type: keyof typeof tagPalettes) => {
    const label = value || (type === 'category' ? '未分類' : '未指定');
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${getTagClass(label, type)}`}>
        {label}
      </span>
    );
  };

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

  const getColumnCount = () => {
    switch (viewMode) {
      case ViewMode.STOCK:
        return 4;
      case ViewMode.PROCUREMENT:
        return 6;
      case ViewMode.BORROWING:
        return 6;
      case ViewMode.ESTIMATION:
        return 7;
      case ViewMode.ACTUAL_PURCHASE:
        return 9;
      case ViewMode.CHECKLIST:
        return 8;
      case ViewMode.SETTLEMENT:
        return 8;
      case ViewMode.OVERVIEW:
      default:
        return 6;
    }
  };

  const renderHeader = () => {
    switch (viewMode) {
      case ViewMode.STOCK:
        return (
          <tr>
            <th className="px-3 py-2 text-left">用途分類</th>
            <th className="px-3 py-2 text-left">組別</th>
            <th className="px-3 py-2 text-left">品項</th>
            <th className="px-3 py-2 text-left">用途</th>
          </tr>
        );
      case ViewMode.PROCUREMENT:
        return (
          <tr>
            <th className="px-3 py-2 text-left">用途分類</th>
            <th className="px-3 py-2 text-left">組別</th>
            <th className="px-3 py-2 text-left">品項</th>
            <th className="px-3 py-2 text-left">用途</th>
            <th className="px-3 py-2 text-left">負責人</th>
            <th className="px-3 py-2 text-right">缺額 / 需求</th>
          </tr>
        );
      case ViewMode.BORROWING:
        return (
          <tr>
            <th className="px-3 py-2 text-left">用途分類</th>
            <th className="px-3 py-2 text-left">組別</th>
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
            <th className="px-3 py-2 text-left">用途分類</th>
            <th className="px-3 py-2 text-left">組別</th>
            <th className="px-3 py-2 text-left">品項</th>
            <th className="px-3 py-2 text-left">來源</th>
            <th className="px-3 py-2 text-left">負責人</th>
            <th className="px-3 py-2 text-left">用途</th>
          </tr>
        );
    }
  };

  const renderRow = (material: Material) => {
    switch (viewMode) {
      case ViewMode.STOCK:
        return (
          <tr key={material.id} className="border-b border-slate-100">
            <td className="px-3 py-2 text-sm text-slate-600">{renderTag(material.category, 'category')}</td>
            <td className="px-3 py-2 text-sm text-slate-700">{renderTag(material.group, 'group')}</td>
            <td className="px-3 py-2 text-sm font-medium text-slate-800">{material.name}</td>
            <td className="px-3 py-2 text-sm text-slate-500">{material.description || '無用途說明'}</td>
          </tr>
        );
      case ViewMode.PROCUREMENT:
        return (
          <tr key={material.id} className="border-b border-slate-100">
            <td className="px-3 py-2 text-sm text-slate-600">{renderTag(material.category, 'category')}</td>
            <td className="px-3 py-2 text-sm text-slate-700">{renderTag(material.group, 'group')}</td>
            <td className="px-3 py-2 text-sm font-medium text-slate-800">{material.name}</td>
            <td className="px-3 py-2 text-sm text-slate-500">{material.description || '無用途說明'}</td>
            <td className="px-3 py-2 text-sm text-slate-600">{renderTag(material.responsible, 'responsible')}</td>
            <td className="px-3 py-2 text-right text-sm font-semibold text-orange-600">
              {material.lack} <span className="text-slate-400">/ {material.need}</span>
            </td>
          </tr>
        );
      case ViewMode.BORROWING:
        return (
          <tr key={material.id} className="border-b border-slate-100">
            <td className="px-3 py-2 text-sm text-slate-600">{renderTag(material.category, 'category')}</td>
            <td className="px-3 py-2 text-sm text-slate-700">{renderTag(material.group, 'group')}</td>
            <td className="px-3 py-2 text-sm font-medium text-slate-800">{material.name}</td>
            <td className="px-3 py-2 text-sm text-slate-500">{material.description || '無用途說明'}</td>
            <td className="px-3 py-2 text-sm text-slate-600">{renderTag(material.responsible, 'responsible')}</td>
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
            <td className="px-3 py-2 text-sm text-slate-600">{renderTag(material.category, 'category')}</td>
            <td className="px-3 py-2 text-sm text-slate-700">{renderTag(material.group, 'group')}</td>
            <td className="px-3 py-2 text-sm font-medium text-slate-800">{material.name}</td>
            <td className="px-3 py-2 text-sm text-slate-600">{renderTag(material.source, 'source')}</td>
            <td className="px-3 py-2 text-sm text-slate-600">{renderTag(material.responsible, 'responsible')}</td>
            <td className="px-3 py-2 text-sm text-slate-500">{material.description || '無用途說明'}</td>
          </tr>
        );
    }
  };

  const groupByLabelMap: Record<Exclude<OverviewGroupBy, 'none'>, string> = {
    category: '用途分類',
    group: '組別',
    source: '來源',
    responsible: '負責人'
  };

  const groupByFieldMap: Record<Exclude<OverviewGroupBy, 'none'>, keyof Material> = {
    category: 'category',
    group: 'group',
    source: 'source',
    responsible: 'responsible'
  };

  const shouldGroup = [ViewMode.OVERVIEW, ViewMode.STOCK, ViewMode.PROCUREMENT, ViewMode.BORROWING]
    .includes(viewMode) && groupBy !== 'none';
  const groupedMaterials = shouldGroup ? new Map<string, Material[]>() : null;

  if (shouldGroup && groupedMaterials) {
    const field = groupByFieldMap[groupBy as Exclude<OverviewGroupBy, 'none'>];
    materials.forEach((material) => {
      const rawValue = String(material[field] || '').trim();
      const key = rawValue || '未分類';
      if (!groupedMaterials.has(key)) groupedMaterials.set(key, []);
      groupedMaterials.get(key)?.push(material);
    });
  }

  const columnCount = getColumnCount();

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            {renderHeader()}
          </thead>
          <tbody>
            {shouldGroup && groupedMaterials ? (
              Array.from(groupedMaterials.entries()).map(([groupKey, items]) => {
                const isCollapsed = !!collapsedGroups[groupKey];
                const label = groupByLabelMap[groupBy as Exclude<OverviewGroupBy, 'none'>];
                return (
                  <React.Fragment key={groupKey}>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <td colSpan={columnCount} className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => onToggleGroup?.(groupKey)}
                          className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900"
                        >
                          <ChevronDown
                            size={16}
                            className={`transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                          />
                          <span>{label}：{groupKey}</span>
                          <span className="text-xs text-slate-400">({items.length})</span>
                        </button>
                      </td>
                    </tr>
                    {!isCollapsed && items.map(renderRow)}
                  </React.Fragment>
                );
              })
            ) : (
              materials.map(renderRow)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MaterialTable;