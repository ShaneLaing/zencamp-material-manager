// 1. 定義欄位對應 (請確保這些中文名稱與 Sheet 第一列完全一致)
const COLUMN_MAP = {
  category: "用途分類",    // A
  group: "組別",          // B
  name: "品項",           // C
  source: "來源",         // D
  loc: "位置",            // E
  owned: "擁有數量",      // F
  need: "這屆需求數量",    // G
  lack: "缺多少",         // H
  unitPrice: "單價",      // I
  totalEst: "總額",       // J
  responsible: "採購負責人", // K
  actualPrice: "實際單價", // L
  actualQty: "實際數量",   // M
  actualTotal: "實際總額", // N
  actualItem: "實際物品",  // O
  receiptPhoto: "收據照片", // P
  status: "採買CHECK",    // Q
  description: "用途",    // R
  countPhoto: "清點照片",  // S
  packed: "裝箱CHECK",    // T
  counted: "清點CHECK(6/18)", // U
  note: "備註",               // V
  remaining: "剩餘物資數量",    // W
  refill: "是否需要補充",       // X
  suggestion: "給第下一梯的備註" // Y
};

// ----------------------------------------------------------------
// API 核心功能
// ----------------------------------------------------------------

function doGet(e) {
  return handleRequest(e, 'get');
}

function doPost(e) {
  return handleRequest(e, 'post');
}

function handleRequest(e, method) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    return createJSON({ status: "error", message: "Server busy" });
  }

  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    
    if (method === 'get') {
      const data = getSheetData(sheet);
      return createJSON(data); // 直接回傳陣列
    } 
    
    if (method === 'post') {
      let content = "{}";
      
      // 處理 POST 資料的不同來源
      if (e && e.postData) {
        content = e.postData.contents || "{}";
      } else if (e && e.parameter && e.parameter.data) {
        content = e.parameter.data;
      }
      
      console.log("POST content received:", content);
      
      const payload = JSON.parse(content);
      console.log("Parsed payload:", JSON.stringify(payload));

      // 支援批次更新 (Batch Update)
      if (payload.action === "batch_update") {
        console.log("Processing batch_update with", payload.updates ? payload.updates.length : 0, "items");
        const result = batchUpdateRows(sheet, payload.updates);
        return createJSON({ status: "success", message: "Batch updated", count: result });
      }

      // 保持向後相容：單筆更新
      if (payload.action === "update") {
        const result = updateRow(sheet, payload.data);
        return createJSON({ status: "success", message: "Updated", debug: result });
      }
      return createJSON({ status: "error", message: "Unknown action: " + payload.action });
    }

  } catch (error) {
    console.error("Request error:", error.toString(), error.stack);
    return createJSON({ status: "error", message: error.toString(), stack: error.stack });
  } finally {
    lock.releaseLock();
  }
}

// ----------------------------------------------------------------
// 資料讀取邏輯
// ----------------------------------------------------------------

function getSheetData(sheet) {
  // 1. 取得所有資料 (包含標題)
  const range = sheet.getDataRange();
  const values = range.getValues(); // 使用 getValues 獲取原始型別 (數字/布林值)
  
  if (values.length < 1) return [];

  // 2. 處理標題列：去除前後空白，避免 "備註 " 造成對應失敗
  const headers = values[0].map(h => String(h).trim());
  
  // 3. 建立 標題名稱 -> Column Index (0-based) 的索引表
  const headerMap = {};
  headers.forEach((h, i) => {
    if(h) headerMap[h] = i;
  });

  const data = [];

  // 4. 逐列讀取 (從第2列開始，Index=1)
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    
    // 如果該行沒有品項名稱，也沒有組別，視為空行跳過
    if (!row[headerMap[COLUMN_MAP.name]] && !row[headerMap[COLUMN_MAP.group]]) continue;

    const item = { 
      rowIndex: i + 1 // 重要：紀錄這是 Sheet 中的第幾列 (1-based)
    };

    // 5. 根據 MAP 填入資料
    for (const [key, headerName] of Object.entries(COLUMN_MAP)) {
      const colIndex = headerMap[headerName];
      if (colIndex !== undefined) {
        let val = row[colIndex];
        // 處理日期物件轉換，避免 JSON 錯誤
        if (val instanceof Date) {
          val = Utilities.formatDate(val, Session.getScriptTimeZone(), "yyyy-MM-dd");
        }
        item[key] = val;
      } else {
        item[key] = ""; // 找不到欄位給空字串
      }
    }
    data.push(item);
  }
  return data;
}

// ----------------------------------------------------------------
// 資料更新邏輯
// ----------------------------------------------------------------

function updateRow(sheet, item) {
  // 1. 檢查 rowIndex 是否存在
  const rowIndex = parseInt(item.rowIndex);
  if (!rowIndex || isNaN(rowIndex)) {
    throw new Error("Missing or invalid rowIndex: " + item.rowIndex);
  }

  // 2. 重新讀取標題列以確保欄位正確 (避免快取問題)
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).trim());
  const headerMap = {};
  headers.forEach((h, i) => headerMap[h] = i);

  // 3. 逐一更新欄位
  for (const [key, value] of Object.entries(item)) {
    // 跳過 rowIndex 本身
    if (key === 'rowIndex') continue;

    const headerName = COLUMN_MAP[key];
    const colIndex = headerMap[headerName];

    // 只有當 Sheet 裡真的有這個欄位標題時才更新
    if (colIndex !== undefined) {
      // getRange(row, column) -> 这里的 column 是 1-based，所以要 +1
      // 使用 setValue 寫入單一儲存格
      sheet.getRange(rowIndex, colIndex + 1).setValue(value);
    }
  }
  return "Updated row " + rowIndex;
}

// ----------------------------------------------------------------
// 批次更新邏輯 (Batch Update) - 效能優化版
// ----------------------------------------------------------------

function batchUpdateRows(sheet, updates) {
  if (!updates || !Array.isArray(updates) || updates.length === 0) {
    return 0;
  }

  // 1. 讀取標題列建立索引
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).trim());
  const headerMap = {};
  headers.forEach((h, i) => headerMap[h] = i);

  // 2. 如果更新項目少於 5 筆，直接逐格更新（減少讀寫整張表的開銷）
  if (updates.length < 5) {
    let count = 0;
    for (const update of updates) {
      const rowIndex = parseInt(update.rowIndex);
      if (!rowIndex || isNaN(rowIndex)) continue;

      const headerName = COLUMN_MAP[update.field];
      const colIndex = headerMap[headerName];

      if (colIndex !== undefined) {
        sheet.getRange(rowIndex, colIndex + 1).setValue(update.value);
        count++;
      }
    }
    return count;
  }

  // 3. 大量更新：讀取整張表到記憶體，修改後一次寫回
  const dataRange = sheet.getDataRange();
  const data = dataRange.getValues();
  let count = 0;

  for (const update of updates) {
    const rowIndex = parseInt(update.rowIndex);
    if (!rowIndex || isNaN(rowIndex)) continue;
    if (rowIndex < 1 || rowIndex > data.length) continue;

    const headerName = COLUMN_MAP[update.field];
    const colIndex = headerMap[headerName];

    if (colIndex !== undefined) {
      // rowIndex 是 1-based，data 陣列是 0-based
      data[rowIndex - 1][colIndex] = update.value;
      count++;
    }
  }

  // 4. 一次性寫回整張表
  dataRange.setValues(data);

  return count;
}

// ----------------------------------------------------------------
// 輔助與測試
// ----------------------------------------------------------------

function createJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// 處理 CORS preflight 請求 (OPTIONS)
function doOptions(e) {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

// ★★★ 測試專用函數 ★★★
// 請在編輯器上方選擇 "testRun" 並點擊 "執行"
// 查看 "執行記錄" 視窗，如果出現 Error，代表欄位名稱對不上
function testRun() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  console.log("--- 開始測試 getSheetData ---");
  const data = getSheetData(sheet);
  
  if (data.length === 0) {
    console.error("錯誤：讀取不到資料，請檢查 Sheet 是否有資料或標題列是否在第一行");
    return;
  }
  
  console.log("成功讀取 " + data.length + " 筆資料");
  console.log("第一筆資料範例：", data[0]);
  
  // 檢查關鍵欄位是否為 undefined
  if (data[0].name === undefined) console.error("警示：讀取不到 '品項' (name)，請檢查 CSV 標題是否為 '品項'");
  if (data[0].lack === undefined) console.error("警示：讀取不到 '缺多少' (lack)，請檢查 CSV 標題是否為 '缺多少'");
  
  console.log("--- 開始測試 updateRow ---");
  // 測試更新第一筆資料的備註
  const testItem = data[0];
  testItem.note = "系統測試 " + new Date().toString();
  
  try {
    updateRow(sheet, testItem);
    console.log("成功更新 Row " + testItem.rowIndex);
  } catch (e) {
    console.error("更新失敗：", e);
  }
}