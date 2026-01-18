import React, { useState, useEffect } from 'react';
import { X, Link as LinkIcon, Check, AlertCircle, HelpCircle } from 'lucide-react';
import { getSheetConfig, saveSheetConfig, initGoogleApi } from '../services/api';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const ConnectionModal: React.FC<ConnectionModalProps> = ({ isOpen, onClose, onSave }) => {
  const [appsScriptUrl, setAppsScriptUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'connecting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      const config = getSheetConfig();
      if (config) {
        setAppsScriptUrl(config.appsScriptUrl || '');
      }
      setStatus('idle');
      setErrorMsg('');
    }
  }, [isOpen]);

  const handleConnect = async () => {
    if (!appsScriptUrl) {
      setErrorMsg("請填寫 Apps Script Web App URL");
      setStatus('error');
      return;
    }

    // Validate URL format
    if (!appsScriptUrl.startsWith('https://script.google.com/')) {
      setErrorMsg("URL 格式不正確，應以 https://script.google.com/ 開頭");
      setStatus('error');
      return;
    }

    setStatus('connecting');
    setErrorMsg('');

    // Save config first
    saveSheetConfig({ appsScriptUrl });

    try {
      // Test connection
      const connected = await initGoogleApi();
      if (!connected) {
        throw new Error("無法連接到 Apps Script，請檢查 URL 是否正確並確認已部署為 Web App");
      }

      setStatus('success');
      setTimeout(() => {
        onSave();
        onClose();
      }, 1500);

    } catch (e: any) {
      console.error(e);
      setStatus('error');
      setErrorMsg(e?.message || "連接失敗，請檢查 URL 設定");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <LinkIcon size={18} />
            連接 Google Apps Script
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="bg-blue-50 p-3 rounded text-sm text-blue-800 flex items-start gap-2">
            <HelpCircle size={16} className="mt-0.5 shrink-0" />
            <div>
              <p className="mb-2">
                本系統透過 Google Apps Script Web App 連接 Google Sheets。
              </p>
              <p className="text-xs text-blue-600">
                請將 <code className="bg-blue-100 px-1 rounded">backend/Code.gs</code> 部署為 Web App，
                並將網址貼到下方。
              </p>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">
              Apps Script Web App URL
            </label>
            <input 
              type="text" 
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={appsScriptUrl}
              onChange={(e) => setAppsScriptUrl(e.target.value)}
            />
            <p className="text-[10px] text-slate-400 mt-1">
              部署後的 Web App URL，格式如：https://script.google.com/macros/s/AKfyc.../exec
            </p>
          </div>

          <div className="bg-slate-50 p-3 rounded text-xs text-slate-600 space-y-2">
            <p className="font-bold">部署步驟：</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>在 Google Sheets 中開啟「擴充功能」→「Apps Script」</li>
              <li>將 <code className="bg-slate-200 px-1 rounded">backend/Code.gs</code> 的內容貼入</li>
              <li>點擊「部署」→「新增部署」</li>
              <li>選擇「網頁應用程式」類型</li>
              <li>設定「執行身份」為「我」</li>
              <li>設定「誰可以存取」為「任何人」</li>
              <li>點擊「部署」並複製網址</li>
            </ol>
          </div>

          {status === 'error' && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {status === 'success' && (
            <div className="flex items-center gap-2 text-emerald-600 text-sm bg-emerald-50 p-3 rounded-lg">
              <Check size={16} />
              <span>連接成功！</span>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            取消
          </button>
          <button 
            onClick={handleConnect}
            disabled={status === 'connecting' || status === 'success'}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {status === 'connecting' ? '連接中...' : '確認連接'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConnectionModal;