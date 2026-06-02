const SPREADSHEET_ID = "1uSzllkqfdrj_aS8jQ9Yq9tT7oLJTfO6WmjCuV0IGMJ0";
const STATE_SHEET_NAME = "State";
const ROOMS_SHEET_NAME = "Rooms";
const BOOKINGS_SHEET_NAME = "Bookings";
const DEBTS_SHEET_NAME = "Debts";

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
  const roomsRows = [["Bulan", "Kamar", "Tipe", "Skema Sewa", "Nama Penghuni", "Tanggal Bayar", "Check-in", "Check-out", "Pembayaran", "Status Kamar", "Status AC", "Jumlah Catatan"]];
  const bookingRows = [["Bulan", "Kamar", "Nama Calon Penghuni", "Status Pembayaran", "DP", "DP Paid", "Payment 1", "Payment 1 Paid", "Payment 2", "Payment 2 Paid", "Total Tagihan", "Total Terbayar", "Rencana Check-in", "Catatan Booking", "ID"]];
  const debtRows = [["Bulan", "Tanggal", "Kategori", "Keterangan", "Nominal", "Sudah Lunas", "Tanggal Pelunasan", "Catatan", "ID"]];

  Object.keys(state.monthlyData || {}).sort().forEach((monthKey) => {
    const monthData = state.monthlyData[monthKey] || {};

    (monthData.rooms || []).forEach((room) => {
      roomsRows.push([
        monthKey,
        room.id || "",
        room.type || "",
        room.rentScheme || room.scheme || "",
        room.residentName || "",
        getPaymentDueDate_(room),
        room.checkInDate || "",
        room.checkOutDate || "",
        room.paymentStatus || "",
        room.roomStatus || "",
        room.acStatus || "Tidak berlaku",
        (room.notes || []).length
      ]);
    });

    (monthData.bookings || []).forEach((booking) => {
      const dp = Number(booking.dpAmount || 0);
      const hasPayment1 = booking.payment1Amount !== undefined;
      const payment1 = Number(hasPayment1 ? booking.payment1Amount || 0 : booking.payment2Amount || 0);
      const payment2 = Number(hasPayment1 ? booking.payment2Amount || 0 : booking.payment3Amount || 0);
      const totalPaid = (booking.dpPaid ? dp : 0) +
        (booking.payment1Paid ? payment1 : 0) +
        (booking.payment2Paid ? payment2 : 0);
      bookingRows.push([
        monthKey,
        booking.roomId || "",
        booking.prospectName || "",
        booking.paymentStatus || "",
        dp,
        booking.dpPaid ? "TRUE" : "FALSE",
        payment1,
        booking.payment1Paid ? "TRUE" : "FALSE",
        payment2,
        booking.payment2Paid ? "TRUE" : "FALSE",
        dp + payment1 + payment2,
        totalPaid,
        booking.plannedCheckIn || "",
        booking.note || "",
        booking.id || ""
      ]);
    });

    (monthData.debts || []).forEach((debt) => {
      debtRows.push([
        monthKey,
        debt.date || "",
        debt.category || "",
        debt.description || "",
        Number(debt.amount || 0),
        debt.isPaid ? "TRUE" : "FALSE",
        debt.paidAt || "",
        debt.note || "",
        debt.id || ""
      ]);
    });
  });

  writeRows_(ROOMS_SHEET_NAME, roomsRows);
  writeRows_(BOOKINGS_SHEET_NAME, bookingRows);
  writeRows_(DEBTS_SHEET_NAME, debtRows);
}

function getPaymentDueDate_(room) {
  return room.paymentDueDate || "";
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
