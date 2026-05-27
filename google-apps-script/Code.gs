const SPREADSHEET_ID = "1uSzllkqfdrj_aS8jQ9Yq9tT7oLJTfO6WmjCuV0IGMJ0";
const STATE_SHEET_NAME = "State";
const ROOMS_SHEET_NAME = "Rooms";
const EXPENSES_SHEET_NAME = "Expenses";

function doGet(e) {
  const action = (e.parameter.action || "load").toLowerCase();

  if (action === "health") {
    return jsonResponse({ ok: true, message: "Malika Sheet API aktif" });
  }

  if (action === "load") {
    return jsonResponse({ ok: true, state: loadState_() });
  }

  return jsonResponse({ ok: false, error: "Unknown action" });
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || "{}");

    if (payload.action !== "save") {
      return jsonResponse({ ok: false, error: "Unknown action" });
    }

    saveState_(payload.state);
    return jsonResponse({ ok: true, updatedAt: new Date().toISOString() });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message });
  }
}

function loadState_() {
  const sheet = getOrCreateSheet_(STATE_SHEET_NAME);
  const rawState = sheet.getRange("B2").getValue();
  if (!rawState) return null;
  return JSON.parse(rawState);
}

function saveState_(state) {
  if (!state) throw new Error("State kosong");

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const sheet = getOrCreateSheet_(STATE_SHEET_NAME);
    sheet.getRange("A1:B2").setValues([
      ["updatedAt", new Date().toISOString()],
      ["state", JSON.stringify(state)]
    ]);
    sheet.autoResizeColumns(1, 2);
    syncReadableTabs_(state);
  } finally {
    lock.releaseLock();
  }
}

function syncReadableTabs_(state) {
  const roomsRows = [["Bulan", "Kamar", "Tipe", "Skema Sewa", "Nama Penghuni", "Pembayaran", "Status Kamar", "Status AC", "Jumlah Catatan"]];
  const expenseRows = [["Bulan", "Tanggal", "Kategori", "Item", "Nominal", "ID"]];

  Object.keys(state.monthlyData || {}).sort().forEach((monthKey) => {
    const monthData = state.monthlyData[monthKey] || {};

    (monthData.rooms || []).forEach((room) => {
      roomsRows.push([
        monthKey,
        room.id || "",
        room.type || "",
        room.rentScheme || room.scheme || "",
        room.residentName || "",
        room.paymentStatus || "",
        room.roomStatus || "",
        room.acStatus || "Tidak berlaku",
        (room.notes || []).length
      ]);
    });

    (monthData.expenses || []).forEach((expense) => {
      expenseRows.push([
        monthKey,
        expense.date || "",
        expense.category || "",
        expense.item || "",
        Number(expense.amount || 0),
        expense.id || ""
      ]);
    });
  });

  writeRows_(ROOMS_SHEET_NAME, roomsRows);
  writeRows_(EXPENSES_SHEET_NAME, expenseRows);
}

function writeRows_(sheetName, rows) {
  const sheet = getOrCreateSheet_(sheetName);
  sheet.clearContents();
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, rows[0].length);
}

function getOrCreateSheet_(sheetName) {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  return spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
