const STORAGE_KEY = "malika-room-reminder-state-v1";
// Paste Google Apps Script Web App /exec URL here after deployment.
const GOOGLE_SHEET_API_URL = "https://script.google.com/macros/s/AKfycbxFY3KuxhQkNqiCjzi4boqJnpeftt-IjHhfStiie5fOtmi2mXc2AZnBfU0hHOaqsbg8dw/exec";
const isViewMode = new URLSearchParams(window.location.search).get("mode") === "view";
document.body.classList.toggle("view-mode", isViewMode);

const monthNames = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];
const now = new Date();
const currentYear = now.getFullYear();
const defaultMonthKey = `${currentYear}-${String(now.getMonth() + 1).padStart(2, "0")}`;
const firstTrackingYear = 2026;
const lastTrackingYear = 2051;
const paymentOptions = ["Lunas", "Belum Bayar", "Belum Lunas (Cicil)", "Telat", "Denda (> 1 Minggu)", "Dispensasi"];
const paymentFollowUpStatuses = ["Belum Bayar", "Belum Lunas (Cicil)", "Telat", "Denda (> 1 Minggu)", "Dispensasi"];
const roomStatusOptions = ["Terisi", "Kosong", "Renovasi/Upgrade", "Maintenance"];
const debtCategoryOptions = ["Biaya Internet", "Pembelian Barang", "Pembayaran Jasa", "Lainnya"];
const baseFacilityTasks = [
  { id: "clean-water-tank", title: "Cleaning Torn Air" },
  { id: "clean-fridge", title: "Cleaning Kulkas" },
  { id: "buy-water-gallons", title: "Pembelian Air Galon" },
  { id: "buy-kitchen-gas", title: "Pembelian Gas Dapur" }
];
const roomTypeGroups = [
  { type: "Standard", description: "Bulanan", tone: "standard" },
  { type: "Plus Room", description: "Semesteran, 6 bulan", tone: "standard-plus" },
  { type: "Eksklusif", description: "Tahunan, ber-AC", tone: "exclusive" },
  { type: "Deluxe", description: "Tahunan, ber-AC", tone: "deluxe" }
];
const defaultRoomRates = {
  Standard: 800000,
  "Plus Room": 6500000,
  Eksklusif: 15500000,
  Deluxe: 17500000
};

const baseRooms = [
  { id: "A4", type: "Deluxe", scheme: "Tahunan", rate: 17500000, hasAc: true, paymentStatus: "Lunas", roomStatus: "Terisi", residentName: "", checkInDate: "", checkOutDate: "" },
  { id: "B4", type: "Deluxe", scheme: "Tahunan", rate: 17500000, hasAc: true, paymentStatus: "Lunas", roomStatus: "Terisi", residentName: "", checkInDate: "", checkOutDate: "" },
  { id: "A1", type: "Eksklusif", scheme: "Tahunan", rate: 15500000, hasAc: true, paymentStatus: "Lunas", roomStatus: "Terisi", residentName: "", checkInDate: "", checkOutDate: "" },
  { id: "A5", type: "Eksklusif", scheme: "Tahunan", rate: 15500000, hasAc: true, paymentStatus: "Lunas", roomStatus: "Terisi", residentName: "", checkInDate: "", checkOutDate: "" },
  { id: "B1", type: "Eksklusif", scheme: "Tahunan", rate: 15500000, hasAc: true, paymentStatus: "Lunas", roomStatus: "Terisi", residentName: "", checkInDate: "", checkOutDate: "" },
  { id: "B2", type: "Eksklusif", scheme: "Tahunan", rate: 15500000, hasAc: true, paymentStatus: "Lunas", roomStatus: "Terisi", residentName: "", checkInDate: "", checkOutDate: "" },
  { id: "B3", type: "Eksklusif", scheme: "Tahunan", rate: 15500000, hasAc: true, paymentStatus: "Lunas", roomStatus: "Terisi", residentName: "", checkInDate: "", checkOutDate: "" },
  { id: "B5", type: "Eksklusif", scheme: "Tahunan", rate: 15500000, hasAc: true, paymentStatus: "Lunas", roomStatus: "Terisi", residentName: "", checkInDate: "", checkOutDate: "" },
  { id: "B6", type: "Eksklusif", scheme: "Tahunan", rate: 15500000, hasAc: true, paymentStatus: "Lunas", roomStatus: "Terisi", residentName: "", checkInDate: "", checkOutDate: "" },
  { id: "B7", type: "Eksklusif", scheme: "Tahunan", rate: 15500000, hasAc: true, paymentStatus: "Lunas", roomStatus: "Terisi", residentName: "", checkInDate: "", checkOutDate: "" },
  { id: "A6", type: "Plus Room", scheme: "Semesteran", rate: 6500000, hasAc: false, paymentStatus: "Lunas", roomStatus: "Terisi", residentName: "", checkInDate: "", checkOutDate: "" },
  { id: "A8", type: "Plus Room", scheme: "Semesteran", rate: 6500000, hasAc: false, paymentStatus: "Lunas", roomStatus: "Terisi", residentName: "", checkInDate: "", checkOutDate: "" },
  { id: "A2", type: "Standard", scheme: "Bulanan", rate: 800000, hasAc: false, paymentStatus: "Lunas", roomStatus: "Terisi", residentName: "", checkInDate: "", checkOutDate: "" },
  { id: "A3", type: "Standard", scheme: "Bulanan", rate: 800000, hasAc: false, paymentStatus: "Lunas", roomStatus: "Terisi", residentName: "", checkInDate: "", checkOutDate: "" },
  { id: "A7", type: "Standard", scheme: "Bulanan", rate: 800000, hasAc: false, paymentStatus: "Lunas", roomStatus: "Terisi", residentName: "", checkInDate: "", checkOutDate: "" },
  { id: "B8", type: "Standard", scheme: "Bulanan", rate: 800000, hasAc: false, paymentStatus: "Lunas", roomStatus: "Terisi", residentName: "", checkInDate: "", checkOutDate: "" },
  { id: "B9", type: "Standard", scheme: "Bulanan", rate: 800000, hasAc: false, paymentStatus: "Lunas", roomStatus: "Terisi", residentName: "", checkInDate: "", checkOutDate: "" }
];
const acRoomIds = baseRooms.filter((room) => room.hasAc).map((room) => room.id).sort();

let state = loadState();
let selectedRoomId = state.selectedRoomId || "A4";
let remoteReady = !GOOGLE_SHEET_API_URL;
let isApplyingRemoteState = false;
let syncTimer;
let editingBookingId = null;
let editingDebtId = null;

const summaryGrid = document.querySelector("#summaryGrid");
const tabButtons = document.querySelectorAll("[data-tab-target]");
const tabPanels = document.querySelectorAll("[data-tab-panel]");
const roomBoard = document.querySelector("#roomBoard");
const detailPanel = document.querySelector("#detailPanel");
const paymentPriorityList = document.querySelector("#paymentPriorityList");
const acPriorityList = document.querySelector("#acPriorityList");
const roomProjectPriorityList = document.querySelector("#roomProjectPriorityList");
const facilityPriorityList = document.querySelector("#facilityPriorityList");
const facilityTaskList = document.querySelector("#facilityTaskList");
const acServiceTaskList = document.querySelector("#acServiceTaskList");
const acServiceRoomFilter = document.querySelector("#acServiceRoomFilter");
const bookingForm = document.querySelector("#bookingForm");
const bookingRoomId = document.querySelector("#bookingRoomId");
const bookingPlannedCheckIn = document.querySelector("#bookingPlannedCheckIn");
const bookingSubmitBtn = document.querySelector("#bookingSubmitBtn");
const bookingCancelEditBtn = document.querySelector("#bookingCancelEditBtn");
const bookingList = document.querySelector("#bookingList");
const debtForm = document.querySelector("#debtForm");
const debtDate = document.querySelector("#debtDate");
const debtSubmitBtn = document.querySelector("#debtSubmitBtn");
const debtCancelEditBtn = document.querySelector("#debtCancelEditBtn");
const debtSummary = document.querySelector("#debtSummary");
const debtList = document.querySelector("#debtList");
const resetDataBtn = document.querySelector("#resetDataBtn");
const yearSelect = document.querySelector("#yearSelect");
const monthSelect = document.querySelector("#monthSelect");
const syncStatus = document.querySelector("#syncStatus");
const rateSettingsForm = document.querySelector("#rateSettingsForm");
const rateSettingsStatus = document.querySelector("#rateSettingsStatus");
const accessModeBadge = document.querySelector("#accessModeBadge");

accessModeBadge.textContent = isViewMode ? "Mode Viewing · Hanya lihat" : "Mode Editing";
accessModeBadge.classList.toggle("viewing", isViewMode);

const initialYear = getYearFromMonthKey(state.selectedMonth || defaultMonthKey);
renderYearOptions(initialYear);
yearSelect.value = String(initialYear);
renderMonthOptions(initialYear);
monthSelect.value = state.selectedMonth || defaultMonthKey;
updatePeriodFormDates();
bookingRoomId.innerHTML = baseRooms.map((room) => `<option value="${room.id}">${room.id}</option>`).join("");
acServiceRoomFilter.innerHTML = [
  `<option value="">Semua kamar AC</option>`,
  ...acRoomIds.map((roomId) => `<option value="${roomId}">${roomId}</option>`)
].join("");
bookingPlannedCheckIn.value = defaultExpenseDate();

function loadState() {
  try {
    return normalizeStoredState(JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"));
  } catch {
    return normalizeStoredState(null);
  }
}

function normalizeStoredState(stored) {
  const roomRates = normalizeRoomRates(stored?.roomRates);
  const fallback = {
    monthlyData: {
      [defaultMonthKey]: createMonthData(defaultMonthKey, true, roomRates)
    },
    roomRates,
    facilityTasks: normalizeFacilityTasks([]),
    acServiceTasks: normalizeAcServiceTasks([]),
    selectedMonth: defaultMonthKey,
    selectedYear: currentYear,
    selectedRoomId: "A4"
  };

  if (!stored) return fallback;

  if (stored.monthlyData) {
    const monthlyData = {};
    Object.keys(stored.monthlyData).forEach((monthKey) => {
      const savedMonth = stored.monthlyData[monthKey];
      monthlyData[monthKey] = normalizeMonthData(savedMonth, monthKey, roomRates);
    });
    if (!monthlyData[defaultMonthKey]) {
      monthlyData[defaultMonthKey] = createMonthData(defaultMonthKey, true, roomRates);
    }

    return {
      monthlyData,
      roomRates,
      facilityTasks: normalizeFacilityTasks(stored.facilityTasks),
      acServiceTasks: normalizeAcServiceTasks(stored.acServiceTasks),
      selectedMonth: stored.selectedMonth || defaultMonthKey,
      selectedYear: stored.selectedYear || getYearFromMonthKey(stored.selectedMonth || defaultMonthKey),
      selectedRoomId: stored.selectedRoomId || fallback.selectedRoomId
    };
  }

  if (Array.isArray(stored.rooms)) {
    return {
      monthlyData: {
        [defaultMonthKey]: normalizeMonthData({
          rooms: stored.rooms,
          expenses: Array.isArray(stored.expenses) ? stored.expenses : seedExpenses(defaultMonthKey)
        }, defaultMonthKey, roomRates)
      },
      roomRates,
      facilityTasks: normalizeFacilityTasks(stored.facilityTasks),
      acServiceTasks: normalizeAcServiceTasks(stored.acServiceTasks),
      selectedMonth: defaultMonthKey,
      selectedYear: currentYear,
      selectedRoomId: stored.selectedRoomId || fallback.selectedRoomId
    };
  }

  return fallback;
}

function normalizeRoomRates(roomRates = {}) {
  return Object.fromEntries(roomTypeGroups.map(({ type }) => {
    const savedRate = Number(roomRates[type]);
    return [type, savedRate > 0 ? savedRate : defaultRoomRates[type]];
  }));
}

function configuredRateForRoom(room, roomRates = defaultRoomRates) {
  return Number(roomRates[room.type]) || defaultRoomRates[room.type] || Number(room.rate || 0);
}

function normalizeFacilityTasks(tasks = []) {
  return baseFacilityTasks.map((baseTask) => {
    const savedTask = tasks.find((task) => task.id === baseTask.id) || {};
    return {
      ...baseTask,
      lastCompletedDate: savedTask.lastCompletedDate || "",
      nextDueDate: savedTask.nextDueDate || "",
      note: savedTask.note || "",
      history: Array.isArray(savedTask.history) ? savedTask.history : []
    };
  });
}

function normalizeAcServiceTasks(tasks = []) {
  return acRoomIds.map((roomId) => {
    const savedTask = tasks.find((task) => task.roomId === roomId) || {};
    return {
      id: savedTask.id || `ac-${roomId.toLowerCase()}`,
      roomId,
      lastCompletedDate: savedTask.lastCompletedDate || "",
      nextDueDate: savedTask.nextDueDate || "",
      note: savedTask.note || "",
      isCompleted: Boolean(savedTask.isCompleted),
      history: Array.isArray(savedTask.history) ? savedTask.history : []
    };
  });
}

function saveState() {
  if (isViewMode) return;

  state.selectedRoomId = selectedRoomId;
  state.selectedMonth = monthSelect.value;
  state.selectedYear = Number(yearSelect.value);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (GOOGLE_SHEET_API_URL && remoteReady && !isApplyingRemoteState) {
    scheduleRemoteSave();
  }
}

function createMonthData(monthKey, withSeedExpenses = false, roomRates = defaultRoomRates) {
  return {
    rooms: baseRooms.map((room) => ({ ...room, rate: configuredRateForRoom(room, roomRates), notes: [] })),
    bookings: [],
    expenses: withSeedExpenses ? seedExpenses(monthKey) : [],
    debts: [],
    carriedContextFrom: ""
  };
}

function normalizeMonthData(monthData, monthKey, roomRates = defaultRoomRates) {
  return {
    rooms: baseRooms.map((baseRoom) => {
      const savedRoom = (monthData.rooms || []).find((room) => room.id === baseRoom.id) || {};
      const {
        bookingStatus,
        bookingName,
        bookingDpAmount,
        bookingMoveInDate,
        bookingNote,
        ...roomData
      } = savedRoom;

      return {
        ...baseRoom,
        ...roomData,
        type: baseRoom.type,
        scheme: baseRoom.scheme,
        rate: configuredRateForRoom(baseRoom, roomRates),
        hasAc: baseRoom.hasAc,
        paymentStatus: normalizeRoomPaymentStatus(roomData.paymentStatus || baseRoom.paymentStatus),
        roomStatus: normalizeRoomStatus(roomData.roomStatus || baseRoom.roomStatus),
        residentName: roomData.residentName || "",
        checkInDate: roomData.checkInDate || "",
        paymentDueDate: roomData.paymentDueDate || "",
        checkOutDate: roomData.checkOutDate || "",
        notes: roomData.notes || []
      };
    }),
    bookings: Array.isArray(monthData.bookings) ? monthData.bookings.map(normalizeBooking) : migrateRoomBookings(monthData.rooms || []),
    expenses: Array.isArray(monthData.expenses) ? monthData.expenses : seedExpenses(monthKey),
    debts: Array.isArray(monthData.debts) ? monthData.debts.map(normalizeDebt) : [],
    carriedContextFrom: monthData.carriedContextFrom || ""
  };
}

function normalizeRoomPaymentStatus(status) {
  if (status === "Telat (Denda)") return "Denda (> 1 Minggu)";
  if (status === "Cicil") return "Belum Lunas (Cicil)";
  return paymentOptions.includes(status) ? status : "Lunas";
}

function normalizeRoomStatus(status) {
  if (status === "Normal") return "Terisi";
  if (status === "Renovasi" || status === "Upgrade") return "Renovasi/Upgrade";
  if (status === "Maintenance Ringan") return "Maintenance";
  if (status === "Blocked") return "Kosong";
  return roomStatusOptions.includes(status) ? status : "Terisi";
}

function normalizeBooking(booking) {
  return {
    id: booking.id || crypto.randomUUID(),
    roomId: booking.roomId || "A1",
    prospectName: booking.prospectName || booking.bookingName || "",
    paymentStatus: booking.paymentStatus || "Cicil",
    dpAmount: Number(booking.dpAmount || booking.bookingDpAmount || 0),
    dpPaid: typeof booking.dpPaid === "boolean" ? booking.dpPaid : Number(booking.dpAmount || booking.bookingDpAmount || 0) > 0,
    payment1Amount: Number(booking.payment1Amount ?? booking.payment2Amount ?? 0),
    payment1Paid: typeof booking.payment1Paid === "boolean" ? booking.payment1Paid : Number(booking.payment1Amount ?? booking.payment2Amount ?? 0) > 0,
    payment2Amount: Number(booking.payment1Amount !== undefined ? booking.payment2Amount || 0 : booking.payment3Amount || 0),
    payment2Paid: typeof booking.payment2Paid === "boolean" ? booking.payment2Paid : Number(booking.payment1Amount !== undefined ? booking.payment2Amount || 0 : booking.payment3Amount || 0) > 0,
    plannedCheckIn: booking.plannedCheckIn || booking.bookingMoveInDate || "",
    note: booking.note || booking.bookingNote || ""
  };
}

function normalizeDebt(debt) {
  return {
    id: debt.id || crypto.randomUUID(),
    category: debtCategoryOptions.includes(debt.category) ? debt.category : "Lainnya",
    description: debt.description || "",
    amount: Number(debt.amount || 0),
    date: debt.date || "",
    note: debt.note || "",
    isPaid: Boolean(debt.isPaid),
    paidAt: debt.paidAt || ""
  };
}

function migrateRoomBookings(rooms) {
  return rooms
    .filter((room) => room.bookingStatus && room.bookingStatus !== "Tidak ada")
    .map((room) => normalizeBooking({
      roomId: room.id,
      prospectName: room.bookingName || "",
      paymentStatus: room.bookingStatus === "DP Masuk" ? "Cicil" : "Cicil",
      dpAmount: room.bookingDpAmount || 0,
      plannedCheckIn: room.bookingMoveInDate || "",
      note: room.bookingNote || ""
    }));
}

function renderYearOptions(activeYear) {
  const years = [];

  for (let year = firstTrackingYear; year <= lastTrackingYear; year += 1) {
    years.push(year);
  }

  yearSelect.innerHTML = years.map((year) => `<option value="${year}">${year}</option>`).join("");
}

function renderMonthOptions(year) {
  monthSelect.innerHTML = monthNames.map((month, index) => {
    const monthKey = `${year}-${String(index + 1).padStart(2, "0")}`;
    return `<option value="${monthKey}">${month}</option>`;
  }).join("");
}

function getYearFromMonthKey(monthKey) {
  return Number(String(monthKey || defaultMonthKey).slice(0, 4)) || currentYear;
}

function getSelectedYear() {
  return Number(yearSelect.value || state.selectedYear || getYearFromMonthKey(state.selectedMonth) || currentYear);
}

function activeMonthData() {
  const monthKey = monthSelect.value || state.selectedMonth || defaultMonthKey;
  if (!state.monthlyData[monthKey]) {
    state.monthlyData[monthKey] = createCarriedMonthData(monthKey);
  } else {
    hydrateCarriedRoomContext(monthKey, state.monthlyData[monthKey]);
  }
  return state.monthlyData[monthKey];
}

function createCarriedMonthData(monthKey) {
  const previousKey = findPreviousCarryMonthKey(monthKey);
  if (!previousKey) return createMonthData(monthKey, false, state.roomRates);

  const previousData = state.monthlyData[previousKey];
  return {
    rooms: baseRooms.map((baseRoom) => {
      const previousRoom = (previousData.rooms || []).find((room) => room.id === baseRoom.id) || {};
      return createCarriedRoom(baseRoom, previousRoom, state.roomRates);
    }),
    bookings: (previousData.bookings || []).map((booking) => ({ ...booking })),
    expenses: [],
    debts: [],
    carriedContextFrom: previousKey
  };
}

function hydrateCarriedRoomContext(monthKey, monthData) {
  if (monthData.carriedContextFrom) return;

  const previousKey = findPreviousCarryMonthKey(monthKey);
  if (!previousKey || !monthData) return;

  const previousData = state.monthlyData[previousKey] || {};
  monthData.rooms = baseRooms.map((baseRoom) => {
    const currentRoom = (monthData.rooms || []).find((room) => room.id === baseRoom.id) || {};
    const previousRoom = (previousData.rooms || []).find((room) => room.id === baseRoom.id) || {};
    return mergeCarriedRoomContext(baseRoom, currentRoom, previousRoom, state.roomRates);
  });
  monthData.carriedContextFrom = previousKey;
}

function mergeCarriedRoomContext(baseRoom, currentRoom, previousRoom, roomRates = defaultRoomRates) {
  const baseRoomStatus = baseRoom.roomStatus || "Terisi";
  const room = {
    ...baseRoom,
    ...currentRoom,
    type: baseRoom.type,
    scheme: baseRoom.scheme,
    rate: configuredRateForRoom(baseRoom, roomRates),
    hasAc: baseRoom.hasAc,
    notes: [...(currentRoom.notes || [])]
  };
  const isGeneratedBlankRoom = !roomHasCarryContext(currentRoom, baseRoom) &&
    !currentRoom.checkInDate &&
    !currentRoom.paymentDueDate;

  if (!room.residentName && previousRoom.residentName) room.residentName = previousRoom.residentName;
  if (!room.checkOutDate && previousRoom.checkOutDate) room.checkOutDate = previousRoom.checkOutDate;
  if ((room.roomStatus || baseRoomStatus) === baseRoomStatus && previousRoom.roomStatus) {
    room.roomStatus = previousRoom.roomStatus;
  }
  if (!room.notes.length && previousRoom.notes?.length) {
    room.notes = [...previousRoom.notes];
  }
  if (isGeneratedBlankRoom && (!currentRoom.paymentStatus || currentRoom.paymentStatus === baseRoom.paymentStatus)) {
    room.paymentStatus = "Belum Bayar";
  }

  return room;
}

function createCarriedRoom(baseRoom, previousRoom, roomRates = defaultRoomRates) {
  return {
    ...baseRoom,
    rate: configuredRateForRoom(baseRoom, roomRates),
    residentName: previousRoom.residentName || "",
    checkInDate: "",
    paymentDueDate: "",
    checkOutDate: previousRoom.checkOutDate || "",
    paymentStatus: "Belum Bayar",
    roomStatus: previousRoom.roomStatus || baseRoom.roomStatus || "Terisi",
    notes: [...(previousRoom.notes || [])]
  };
}

function findPreviousCarryMonthKey(monthKey) {
  return Object.keys(state.monthlyData || {})
    .filter((key) => key < monthKey && monthHasCarryContext(state.monthlyData[key]))
    .sort()
    .pop() || findPreviousMonthKey(monthKey);
}

function findPreviousMonthKey(monthKey) {
  return Object.keys(state.monthlyData || {})
    .filter((key) => key < monthKey)
    .sort()
    .pop();
}

function monthHasCarryContext(monthData) {
  return (monthData?.rooms || []).some((room) => {
    const baseRoom = baseRooms.find((item) => item.id === room.id) || {};
    return roomHasCarryContext(room, baseRoom);
  });
}

function roomHasCarryContext(room, baseRoom) {
  const baseRoomStatus = baseRoom.roomStatus || "Terisi";
  return Boolean(
    room?.residentName ||
    room?.checkOutDate ||
    (room?.notes || []).length ||
    (room?.roomStatus && room.roomStatus !== baseRoomStatus)
  );
}

function selectedMonthName() {
  const monthIndex = Number((monthSelect.value || defaultMonthKey).slice(5, 7)) - 1;
  return `${monthNames[monthIndex]} ${getSelectedYear()}`;
}

function defaultExpenseDate() {
  const monthKey = monthSelect.value || state.selectedMonth || defaultMonthKey;
  if (monthKey === defaultMonthKey) return localDateString(new Date());
  return `${monthKey}-01`;
}

function updatePeriodFormDates() {
  debtDate.value = defaultExpenseDate();
}

function localDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function setSyncStatus(message, tone = "") {
  syncStatus.textContent = message;
  syncStatus.className = `sync-status ${tone}`.trim();
}

async function loadRemoteState() {
  if (!GOOGLE_SHEET_API_URL) {
    setSyncStatus(isViewMode ? "Viewing · data lokal" : "Local storage");
    return;
  }

  setSyncStatus("Mengambil data...", "saving");

  try {
    const response = await fetch(`${GOOGLE_SHEET_API_URL}?action=load&cache=${Date.now()}`);
    const result = await response.json();

    remoteReady = true;
    if (result.ok && result.state) {
      isApplyingRemoteState = true;
      state = normalizeStoredState(result.state);
      selectedRoomId = state.selectedRoomId;
      renderYearOptions(getYearFromMonthKey(state.selectedMonth || defaultMonthKey));
      yearSelect.value = String(state.selectedYear || getYearFromMonthKey(state.selectedMonth || defaultMonthKey));
      renderMonthOptions(getSelectedYear());
      monthSelect.value = state.selectedMonth || defaultMonthKey;
      updatePeriodFormDates();
      bookingPlannedCheckIn.value = defaultExpenseDate();
      render();
      isApplyingRemoteState = false;
      setSyncStatus(isViewMode ? "Viewing · Google Sheet tersambung" : "Google Sheet tersambung", "online");
      return;
    }

    if (isViewMode) {
      setSyncStatus("Viewing · Sheet belum berisi data", "online");
    } else {
      setSyncStatus("Sheet siap, menyimpan...", "saving");
      scheduleRemoteSave(0);
    }
  } catch {
    remoteReady = true;
    setSyncStatus("Offline, pakai lokal", "error");
  }
}

function scheduleRemoteSave(delay = 700) {
  if (isViewMode) return;

  clearTimeout(syncTimer);
  syncTimer = setTimeout(saveRemoteState, delay);
}

async function saveRemoteState() {
  if (!GOOGLE_SHEET_API_URL || isViewMode) return;

  setSyncStatus("Menyimpan...", "saving");

  try {
    const response = await fetch(GOOGLE_SHEET_API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "save",
        state,
        updatedAt: new Date().toISOString()
      })
    });
    const result = await response.json();
    if (!result.ok) throw new Error(result.error || "Save failed");
    setSyncStatus("Tersimpan di Google Sheet", "online");
  } catch {
    setSyncStatus("Gagal sync, lokal aman", "error");
  }
}

function seedExpenses(monthKey = defaultMonthKey) {
  return [];
}

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(value);
}

function rateLabel(room) {
  return `${formatCurrency(room.rate)}/${room.scheme.toLowerCase().replace("an", "")}`;
}

function schemeLabel(room) {
  return room.scheme;
}

function visibleDebts() {
  const selectedMonth = monthSelect.value || state.selectedMonth || defaultMonthKey;
  return Object.keys(state.monthlyData || {})
    .filter((monthKey) => monthKey <= selectedMonth)
    .flatMap((monthKey) => {
      return (state.monthlyData[monthKey].debts || []).map((debt) => ({ ...debt, monthKey }));
    });
}

function currentOutstandingDebts() {
  return visibleDebts().filter((debt) => !debt.isPaid);
}

function getRoomTone(room) {
  if (room.roomStatus === "Kosong") return "empty";
  if (room.roomStatus === "Renovasi/Upgrade") return "project";
  if (["Telat", "Denda (> 1 Minggu)"].includes(room.paymentStatus)) return "danger";
  if (
    room.paymentStatus === "Belum Bayar" ||
    room.paymentStatus === "Belum Lunas (Cicil)" ||
    room.paymentStatus === "Dispensasi" ||
    room.roomStatus === "Maintenance"
  ) return "warning";

  return "safe";
}

function pillTone(value) {
  if (["Telat", "Denda (> 1 Minggu)"].includes(value)) return "danger";
  if (["Belum Bayar", "Belum Lunas (Cicil)", "Dispensasi", "Maintenance"].includes(value)) return "warning";
  if (value === "Renovasi/Upgrade") return "project";
  if (value === "Lunas" || value === "Terisi" || value === "Aman" || value === "Selesai Service") return "safe";
  return "";
}

function render() {
  renderRoomRateSettings();
  renderSummary();
  renderPriorityDashboard();
  renderRoomBoard();
  renderDetail();
  renderFacilityTasks();
  renderAcServiceTasks();
  renderBookings();
  renderDebts();
  saveState();
}

function renderRoomRateSettings() {
  rateSettingsForm.querySelectorAll("[data-room-rate]").forEach((input) => {
    input.value = state.roomRates[input.dataset.roomRate];
  });
}

function applyRoomRates() {
  Object.values(state.monthlyData || {}).forEach((monthData) => {
    monthData.rooms = (monthData.rooms || []).map((room) => ({
      ...room,
      rate: configuredRateForRoom(room, state.roomRates)
    }));
  });
}

function renderSummary() {
  const rooms = activeMonthData().rooms;
  const paymentFollowUp = rooms.filter((room) => paymentFollowUpStatuses.includes(room.paymentStatus)).length;
  const projects = rooms.filter((room) => ["Renovasi/Upgrade", "Maintenance"].includes(room.roomStatus)).length;
  const unpaidDebts = currentOutstandingDebts();
  const unpaidDebtTotal = unpaidDebts.reduce((total, debt) => total + Number(debt.amount), 0);

  const cards = [
    { label: "Total kamar", value: rooms.length, hint: `Periode ${selectedMonthName()}` },
    { label: "Pembayaran perlu follow-up", value: paymentFollowUp, hint: "Belum bayar, cicil, telat, dispensasi" },
    { label: "Kamar renovasi/upgrade", value: projects, hint: "Termasuk maintenance" },
    { label: "Hutang belum lunas", value: formatCurrency(unpaidDebtTotal), hint: `${unpaidDebts.length} transaksi perlu ditutup` }
  ];

  summaryGrid.innerHTML = cards.map((card) => `
    <article class="summary-card">
      <span>${card.label}</span>
      <strong>${card.value}</strong>
      <small>${card.hint}</small>
    </article>
  `).join("");
}

function renderRoomBoard() {
  roomBoard.innerHTML = roomTypeGroups.map((group) => {
    const rooms = activeMonthData().rooms.filter((room) => room.type === group.type);
    const attentionCount = rooms.filter((room) => getRoomTone(room) !== "safe").length;

    return `
      <section class="room-group ${group.tone}">
        <div class="room-group-header">
          <div>
            <h3>${group.type}</h3>
            <p>${group.description}</p>
          </div>
          <span>${rooms.length} kamar${attentionCount ? ` · ${attentionCount} perlu cek` : ""}</span>
        </div>
        <div class="room-group-grid">
          ${rooms.map(renderRoomCard).join("")}
        </div>
      </section>
    `;
  }).join("");
}

function renderRoomCard(room) {
  const tone = getRoomTone(room);
  const active = room.id === selectedRoomId ? "active" : "";
  return `
    <button class="room-card ${tone} ${active}" type="button" data-room-id="${room.id}">
      <div class="room-topline">
        <div>
          <div class="room-number">${room.id}</div>
          <div class="room-type">${room.type}</div>
        </div>
        <span class="status-pill"><i class="dot ${tone}"></i>${toneLabel(tone)}</span>
      </div>
      <div class="room-meta">
        <span>Penghuni: <strong>${room.residentName ? escapeHtml(room.residentName) : "Belum diisi"}</strong></span>
        <span>Skema: <strong>${schemeLabel(room)}</strong></span>
        <span>Tarif: <strong>${rateLabel(room)}</strong></span>
        <span>Bayar: <strong>${compactDate(getPaymentDueDate(room))}</strong></span>
        <span>Keluar: <strong>${compactDate(room.checkOutDate)}</strong></span>
      </div>
      <div class="pill-row">
        <span class="pill ${pillTone(room.paymentStatus)}">${room.paymentStatus}</span>
        <span class="pill ${pillTone(room.roomStatus)}">${room.roomStatus}</span>
      </div>
    </button>
  `;
}

function toneLabel(tone) {
  const labels = {
    safe: "Aman",
    warning: "Perhatian",
    danger: "Telat / Denda",
    project: "Proyek",
    empty: "Kosong"
  };
  return labels[tone] || "Status";
}

function renderDetail() {
  const room = activeMonthData().rooms.find((item) => item.id === selectedRoomId);
  if (!room) return;

  detailPanel.innerHTML = `
    <div class="detail-header">
      <div>
        <div class="detail-room">${room.id}</div>
        <p>${room.type} · ${schemeLabel(room)}</p>
      </div>
      <span class="pill ${pillTone(room.paymentStatus)}">${room.paymentStatus}</span>
    </div>

    <div class="detail-grid">
      <div class="info-tile">
        <span>Penghuni</span>
        <strong>${room.residentName ? escapeHtml(room.residentName) : "Belum diisi"}</strong>
      </div>
      <div class="info-tile">
        <span>Tarif</span>
        <strong>${rateLabel(room)}</strong>
      </div>
      <div class="info-tile">
        <span>Skema Sewa</span>
        <strong>${schemeLabel(room)}</strong>
      </div>
      <div class="info-tile">
        <span>Tanggal Bayar</span>
        <strong>${compactDate(getPaymentDueDate(room))}</strong>
      </div>
      <div class="info-tile">
        <span>Check-in</span>
        <strong>${room.checkInDate ? formatDate(room.checkInDate) : "Belum diisi"}</strong>
      </div>
      <div class="info-tile">
        <span>Check-out</span>
        <strong>${room.checkOutDate ? formatDate(room.checkOutDate) : "Belum diisi"}</strong>
      </div>
      <div class="info-tile">
        <span>Status kamar</span>
        <strong>${room.roomStatus}</strong>
      </div>
    </div>

    ${isViewMode ? "" : `<div class="control-grid">
      <label>
        Nama penghuni
        <input data-action="resident-name" value="${escapeHtml(room.residentName || "")}" placeholder="Contoh: Ibu Sari / Pak Budi">
      </label>

      <label>
        Tanggal Bayar
        <input data-action="payment-due-date" type="date" value="${getPaymentDueDate(room) || ""}">
      </label>

      <label>
        Tanggal check-in
        <input data-action="check-in-date" type="date" value="${room.checkInDate || ""}">
      </label>

      <label>
        Tanggal check-out
        <input data-action="check-out-date" type="date" value="${room.checkOutDate || ""}">
      </label>

      <label>
        Update pembayaran
        <select data-action="payment">
          ${paymentOptions.map((option) => `<option value="${option}" ${room.paymentStatus === option ? "selected" : ""}>${option}</option>`).join("")}
        </select>
      </label>

      <label>
        Ubah status kamar
        <select data-action="room-status">
          ${roomStatusOptions.map((option) => `<option value="${option}" ${room.roomStatus === option ? "selected" : ""}>${option}</option>`).join("")}
        </select>
      </label>

      <label>
        Tambah catatan
        <textarea id="noteInput" placeholder="Contoh: penghuni janji bayar Jumat, cek lampu kamar mandi, jadwalkan teknisi."></textarea>
      </label>
      <div class="note-actions">
        <button class="small-button" type="button" id="addNoteBtn">Simpan Catatan</button>
      </div>
    </div>`}

    <div class="notes-list">
      ${(room.notes || []).length ? room.notes.map((note, index) => `
        <article class="note-item">
          <div>
            <p>${escapeHtml(note.text)}</p>
            <small>${note.date}</small>
          </div>
          ${isViewMode ? "" : `<div class="note-row-actions">
            <button class="small-button" type="button" data-edit-note="${index}">Edit</button>
            <button class="small-button" type="button" data-delete-note="${index}">Hapus</button>
          </div>`}
        </article>
      `).join("") : `<div class="empty-state">Belum ada catatan untuk kamar ini.</div>`}
    </div>
  `;
}

function renderPriorityDashboard() {
  const rooms = activeMonthData().rooms;
  const paymentRooms = rooms.filter((room) => paymentFollowUpStatuses.includes(room.paymentStatus));
  const projectRooms = rooms.filter((room) => ["Kosong", "Renovasi/Upgrade", "Maintenance"].includes(room.roomStatus));
  const facilityTasks = state.facilityTasks.filter((task) => getFacilityTaskStatus(task).tone !== "safe");
  const acTasks = state.acServiceTasks.filter((task) => getAcServiceTaskStatus(task).tone !== "safe");

  paymentPriorityList.innerHTML = renderRoomPriorityItems(
    paymentRooms,
    (room) => room.paymentStatus,
    (room) => room.paymentDueDate ? `Tanggal bayar ${formatDate(room.paymentDueDate)}` : "Tanggal bayar belum diisi"
  );
  acPriorityList.innerHTML = acTasks.length ? acTasks.map((task) => {
    const status = getAcServiceTaskStatus(task);
    return `
      <article class="priority-item">
        <div>
          <strong>AC kamar ${task.roomId}</strong>
          <small>${status.detail}</small>
        </div>
        <span class="pill ${status.tone}">${status.label}</span>
      </article>
    `;
  }).join("") : `<div class="empty-state">Tidak ada jadwal service AC yang perlu ditindaklanjuti.</div>`;
  roomProjectPriorityList.innerHTML = renderRoomPriorityItems(
    projectRooms,
    (room) => room.roomStatus,
    (room) => room.checkOutDate ? `Check-out ${formatDate(room.checkOutDate)}` : "Pantau progres dan target kesiapan kamar"
  );
  facilityPriorityList.innerHTML = facilityTasks.length ? facilityTasks.map((task) => {
    const status = getFacilityTaskStatus(task);
    return `
      <article class="priority-item">
        <div>
          <strong>${escapeHtml(task.title)}</strong>
          <small>${status.detail}</small>
        </div>
        <span class="pill ${status.tone}">${status.label}</span>
      </article>
    `;
  }).join("") : `<div class="empty-state">Tidak ada jadwal luar kamar yang perlu ditindaklanjuti.</div>`;
}

function renderRoomPriorityItems(rooms, statusText, detailText) {
  return rooms.length ? rooms.map((room) => `
    <article class="priority-item">
      <div>
        <strong>${room.id} · ${escapeHtml(room.residentName || "Belum ada penghuni")}</strong>
        <small>${detailText(room)}</small>
      </div>
      <span class="pill ${pillTone(statusText(room))}">${statusText(room)}</span>
    </article>
  `).join("") : `<div class="empty-state">Tidak ada item yang perlu ditindaklanjuti.</div>`;
}

function renderFacilityTasks() {
  facilityTaskList.innerHTML = state.facilityTasks.map((task) => {
    const status = getFacilityTaskStatus(task);
    return `
      <article class="facility-item ${facilityThemeClass(task.id)}">
        <div class="facility-item-header">
          <div>
            <h3>${escapeHtml(task.title)}</h3>
            <p>${status.detail}</p>
          </div>
          <span class="pill ${status.tone}">${status.label}</span>
        </div>
        ${isViewMode ? renderFacilityReadOnly(task, "Terakhir selesai", "Jadwal berikutnya") : `<div class="facility-controls">
          <label>
            Terakhir selesai
            <input type="date" data-facility-field="lastCompletedDate" data-facility-id="${task.id}" value="${task.lastCompletedDate}">
          </label>
          <label>
            Jadwal berikutnya
            <input type="date" data-facility-field="nextDueDate" data-facility-id="${task.id}" value="${task.nextDueDate}">
          </label>
          <label class="wide-field">
            Catatan
            <textarea data-facility-field="note" data-facility-id="${task.id}" placeholder="Tambahkan konteks atau kebutuhan berikutnya.">${escapeHtml(task.note)}</textarea>
          </label>
        </div>`}
        ${isViewMode ? "" : `<div class="facility-footer">
          <small>${task.history.length ? `${task.history.length} penyelesaian tercatat · Terakhir ${formatDate(task.history[0])}` : "Belum ada riwayat penyelesaian"}</small>
          <button class="small-button" type="button" data-complete-facility="${task.id}">Tandai Selesai Hari Ini</button>
        </div>`}
        ${renderHistoryList(task, "facility", "Riwayat selesai")}
      </article>
    `;
  }).join("");
}

function renderAcServiceTasks() {
  const tasks = state.acServiceTasks.filter((task) => !acServiceRoomFilter.value || task.roomId === acServiceRoomFilter.value);
  acServiceTaskList.innerHTML = tasks.map((task) => {
    const status = getAcServiceTaskStatus(task);
    return `
      <article class="facility-item ac-service-card facility-theme-ac">
        <div class="facility-item-header">
          <div>
            <h3>Service AC kamar ${task.roomId}</h3>
            <p>${status.detail}</p>
          </div>
          <span class="pill ${status.tone}">${status.label}</span>
        </div>
        ${isViewMode ? renderFacilityReadOnly(task, "Terakhir service", "Jadwal service berikutnya") : `<div class="ac-service-quick">
          <div class="ac-service-stat">
            <span>Terakhir service</span>
            <strong>${task.lastCompletedDate ? formatDate(task.lastCompletedDate) : "Belum ada"}</strong>
          </div>
          <label>
            Jadwal berikutnya
            <input type="date" data-ac-service-field="nextDueDate" data-ac-service-id="${task.id}" value="${task.nextDueDate}">
          </label>
          <label class="wide-field">
            Catatan
            <input data-ac-service-field="note" data-ac-service-id="${task.id}" value="${escapeHtml(task.note)}" placeholder="Teknisi, biaya, atau kondisi AC">
          </label>
        </div>`}
        ${isViewMode ? "" : `<div class="facility-footer">
          <small>${task.history.length ? `${task.history.length} service tercatat · Terakhir ${formatDate(task.history[0])}` : "Belum ada riwayat service"}</small>
          <button class="small-button" type="button" data-complete-ac-service="${task.id}">Tandai Selesai Hari Ini</button>
        </div>`}
        ${renderHistoryList(task, "ac-service", "Riwayat service")}
      </article>
    `;
  }).join("");
}

function facilityThemeClass(taskId) {
  const themes = {
    "clean-water-tank": "facility-theme-water-tank",
    "clean-fridge": "facility-theme-fridge",
    "buy-water-gallons": "facility-theme-gallons",
    "buy-kitchen-gas": "facility-theme-gas"
  };
  return themes[taskId] || "";
}

function renderFacilityReadOnly(task, completedLabel, dueLabel) {
  return `
    <div class="facility-view-grid">
      <div>
        <span>${completedLabel}</span>
        <strong>${task.lastCompletedDate ? formatDate(task.lastCompletedDate) : "Belum diisi"}</strong>
      </div>
      <div>
        <span>${dueLabel}</span>
        <strong>${task.nextDueDate ? formatDate(task.nextDueDate) : "Belum diisi"}</strong>
      </div>
      <div class="wide-field">
        <span>Catatan</span>
        <strong>${task.note ? escapeHtml(task.note) : "Belum ada catatan"}</strong>
      </div>
    </div>
  `;
}

function renderHistoryList(task, ownerType, title) {
  return `
    <div class="history-list">
      <div class="history-heading">${title}</div>
      ${task.history.length ? task.history.map((dateValue, index) => `
        <div class="history-item">
          <span>${formatDate(dateValue)}</span>
          ${isViewMode ? "" : `<div class="history-actions">
            <button class="small-button" type="button" data-edit-history="${index}" data-history-owner="${ownerType}" data-history-task="${task.id}">Edit</button>
            <button class="small-button" type="button" data-delete-history="${index}" data-history-owner="${ownerType}" data-history-task="${task.id}">Hapus</button>
          </div>`}
        </div>
      `).join("") : `<div class="history-empty">Belum ada riwayat.</div>`}
    </div>
  `;
}

function getFacilityTaskStatus(task) {
  if (!task.nextDueDate) {
    return {
      label: "Belum dijadwalkan",
      detail: "Isi jadwal berikutnya agar reminder aktif.",
      tone: "warning"
    };
  }

  const dueIn = daysUntil(task.nextDueDate);
  if (dueIn < 0) {
    return {
      label: "Terlambat",
      detail: `Jadwal terlewat ${Math.abs(dueIn)} hari · ${formatDate(task.nextDueDate)}`,
      tone: "danger"
    };
  }
  if (dueIn <= 7) {
    return {
      label: "Segera",
      detail: `Jadwal dalam ${dueIn} hari · ${formatDate(task.nextDueDate)}`,
      tone: "warning"
    };
  }
  return {
    label: "Terjadwal",
    detail: `Jadwal berikutnya ${formatDate(task.nextDueDate)}`,
    tone: "safe"
  };
}

function getAcServiceTaskStatus(task) {
  if (task.isCompleted) {
    return {
      label: "Selesai",
      detail: task.lastCompletedDate ? `Service terakhir ${formatDate(task.lastCompletedDate)}` : "Service sudah ditandai selesai.",
      tone: "safe"
    };
  }
  return getFacilityTaskStatus(task);
}

function renderBookings() {
  const bookings = [...activeMonthData().bookings].sort((a, b) => {
    return (a.plannedCheckIn || "9999-12-31").localeCompare(b.plannedCheckIn || "9999-12-31");
  });

  bookingList.innerHTML = bookings.length ? bookings.map((booking) => {
    const totalAmount = getBookingTotalAmount(booking);
    const totalPaid = getBookingPaidTotal(booking);

    return `
      <article class="booking-item">
        <div>
          <strong>${booking.roomId} · ${escapeHtml(booking.prospectName)}</strong>
          <small>${booking.paymentStatus} · Check-in ${booking.plannedCheckIn ? formatDate(booking.plannedCheckIn) : "belum diisi"}</small>
          ${booking.note ? `<p>${escapeHtml(booking.note)}</p>` : ""}
        </div>
        <div class="booking-payment-stack">
          ${isViewMode ? `
          <span class="mini-status">${booking.dpPaid ? "Lunas" : "Belum lunas"} · DP ${formatCurrency(booking.dpAmount)}</span>
          <span class="mini-status">${booking.payment1Paid ? "Lunas" : "Belum lunas"} · Payment 1 ${formatCurrency(booking.payment1Amount)}</span>
          <span class="mini-status">${booking.payment2Paid ? "Lunas" : "Belum lunas"} · Payment 2 ${formatCurrency(booking.payment2Amount)}</span>
          ` : `<label class="mini-check">
            <input type="checkbox" data-toggle-booking="${booking.id}" data-payment-field="dpPaid" ${booking.dpPaid ? "checked" : ""}>
            DP ${formatCurrency(booking.dpAmount)}
          </label>
          <label class="mini-check">
            <input type="checkbox" data-toggle-booking="${booking.id}" data-payment-field="payment1Paid" ${booking.payment1Paid ? "checked" : ""}>
            Payment 1 ${formatCurrency(booking.payment1Amount)}
          </label>
          <label class="mini-check">
            <input type="checkbox" data-toggle-booking="${booking.id}" data-payment-field="payment2Paid" ${booking.payment2Paid ? "checked" : ""}>
            Payment 2 ${formatCurrency(booking.payment2Amount)}
          </label>`}
          <strong>Terbayar ${formatCurrency(totalPaid)}</strong>
          <small>Total tagihan ${formatCurrency(totalAmount)}</small>
          ${isViewMode ? "" : `<div class="booking-row-actions">
            <button class="small-button" type="button" data-edit-booking="${booking.id}">Edit</button>
            <button class="small-button" type="button" data-delete-booking="${booking.id}">Hapus</button>
          </div>`}
        </div>
      </article>
    `;
  }).join("") : `<div class="empty-state">Belum ada early booking untuk periode ini.</div>`;
}

function renderDebts() {
  const debts = [...visibleDebts()].sort((a, b) => b.date.localeCompare(a.date));
  const outstanding = debts.filter((debt) => !debt.isPaid);
  const outstandingTotal = outstanding.reduce((total, debt) => total + debt.amount, 0);

  debtSummary.innerHTML = `
    <span>Belum lunas</span>
    <strong>${formatCurrency(outstandingTotal)}</strong>
    <small>${outstanding.length} dari ${debts.length} transaksi</small>
  `;

  debtList.innerHTML = debts.length ? debts.map((debt) => `
    <article class="debt-item ${debt.isPaid ? "paid" : ""}">
      ${isViewMode ? `<span class="pill ${debt.isPaid ? "safe" : "warning"}">${debt.isPaid ? "Sudah lunas" : "Belum lunas"}</span>` : `<label class="debt-check">
        <input type="checkbox" data-toggle-debt="${debt.id}" ${debt.isPaid ? "checked" : ""}>
        <span>${debt.isPaid ? "Sudah lunas" : "Belum lunas"}</span>
      </label>`}
      <div class="debt-main">
        <strong>${escapeHtml(debt.description)}</strong>
        <small>${debt.category} · ${formatDate(debt.date)}</small>
        ${debt.note ? `<p>${escapeHtml(debt.note)}</p>` : ""}
      </div>
      <div class="debt-amount">
        <strong>${formatCurrency(debt.amount)}</strong>
        ${debt.paidAt ? `<small>Dilunasi ${formatDate(debt.paidAt)}</small>` : ""}
        ${isViewMode ? "" : `<div class="debt-row-actions">
          <button class="small-button" type="button" data-edit-debt="${debt.id}">Edit</button>
          <button class="small-button" type="button" data-delete-debt="${debt.id}">Hapus</button>
        </div>`}
      </div>
    </article>
  `).join("") : `<div class="empty-state">Belum ada hutang tercatat sampai periode ini.</div>`;
}

function formatDate(dateValue) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(`${dateValue}T00:00:00`));
}

function compactDate(dateValue) {
  if (!dateValue) return "Belum diisi";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short"
  }).format(new Date(`${dateValue}T00:00:00`));
}

function getPaymentDueDate(room) {
  return room.paymentDueDate || "";
}

function getBookingTotalAmount(booking) {
  return Number(booking.dpAmount || 0) + Number(booking.payment1Amount || 0) + Number(booking.payment2Amount || 0);
}

function getBookingPaidTotal(booking) {
  return (booking.dpPaid ? Number(booking.dpAmount || 0) : 0) +
    (booking.payment1Paid ? Number(booking.payment1Amount || 0) : 0) +
    (booking.payment2Paid ? Number(booking.payment2Amount || 0) : 0);
}

function daysUntil(dateValue) {
  if (!dateValue) return null;
  const target = new Date(`${dateValue}T00:00:00`);
  const today = new Date(`${localDateString(new Date())}T00:00:00`);
  return Math.round((target - today) / 86400000);
}

function fillBookingForm(booking) {
  editingBookingId = booking.id;
  document.querySelector("#bookingRoomId").value = booking.roomId;
  document.querySelector("#bookingProspectName").value = booking.prospectName;
  document.querySelector("#bookingPaymentStatus").value = booking.paymentStatus;
  document.querySelector("#bookingDpAmount").value = booking.dpAmount || "";
  document.querySelector("#bookingDpPaid").checked = Boolean(booking.dpPaid);
  document.querySelector("#bookingPayment1Amount").value = booking.payment1Amount || "";
  document.querySelector("#bookingPayment1Paid").checked = Boolean(booking.payment1Paid);
  document.querySelector("#bookingPayment2Amount").value = booking.payment2Amount || "";
  document.querySelector("#bookingPayment2Paid").checked = Boolean(booking.payment2Paid);
  document.querySelector("#bookingPlannedCheckIn").value = booking.plannedCheckIn || defaultExpenseDate();
  document.querySelector("#bookingNote").value = booking.note || "";
  bookingSubmitBtn.textContent = "Simpan Booking";
  bookingCancelEditBtn.hidden = false;
  bookingForm.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function resetBookingForm() {
  editingBookingId = null;
  bookingForm.reset();
  bookingPlannedCheckIn.value = defaultExpenseDate();
  bookingSubmitBtn.textContent = "Tambah Booking";
  bookingCancelEditBtn.hidden = true;
}

function fillDebtForm(debt) {
  editingDebtId = debt.id;
  document.querySelector("#debtCategory").value = debt.category;
  document.querySelector("#debtDescription").value = debt.description;
  document.querySelector("#debtAmount").value = debt.amount || "";
  document.querySelector("#debtDate").value = debt.date || defaultExpenseDate();
  document.querySelector("#debtNote").value = debt.note || "";
  debtSubmitBtn.textContent = "Simpan Hutang";
  debtCancelEditBtn.hidden = false;
  debtForm.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function resetDebtForm() {
  editingDebtId = null;
  debtForm.reset();
  debtDate.value = defaultExpenseDate();
  debtSubmitBtn.textContent = "Tambah Hutang";
  debtCancelEditBtn.hidden = true;
}

function findDebtById(debtId) {
  for (const monthData of Object.values(state.monthlyData || {})) {
    const debt = (monthData.debts || []).find((item) => item.id === debtId);
    if (debt) return debt;
  }
  return null;
}

function updateDebtById(debtId, updater) {
  Object.values(state.monthlyData || {}).forEach((monthData) => {
    monthData.debts = (monthData.debts || []).map((debt) => {
      return debt.id === debtId ? updater(debt) : debt;
    });
  });
}

function deleteDebtById(debtId) {
  Object.values(state.monthlyData || {}).forEach((monthData) => {
    monthData.debts = (monthData.debts || []).filter((debt) => debt.id !== debtId);
  });
}

function updateSelectedRoom(updater) {
  const monthData = activeMonthData();
  monthData.rooms = monthData.rooms.map((room) => {
    if (room.id !== selectedRoomId) return room;
    return updater(room);
  });
  render();
}

function promptForHistoryDate(currentDate) {
  const nextDate = window.prompt("Ubah tanggal riwayat (format YYYY-MM-DD)", currentDate);
  if (nextDate === null) return null;
  const trimmedDate = nextDate.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmedDate)) {
    window.alert("Format tanggal harus YYYY-MM-DD.");
    return null;
  }
  return trimmedDate;
}

function updateTaskHistory(collectionName, taskId, updater) {
  state[collectionName] = state[collectionName].map((task) => {
    if (task.id !== taskId) return task;
    const updatedTask = updater(task);
    const history = [...(updatedTask.history || [])].filter(Boolean).sort().reverse();
    return {
      ...updatedTask,
      history,
      lastCompletedDate: history[0] || ""
    };
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    tabButtons.forEach((item) => item.classList.toggle("active", item === button));
    tabPanels.forEach((panel) => panel.classList.toggle("active", panel.dataset.tabPanel === button.dataset.tabTarget));
  });
});

rateSettingsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (isViewMode) return;

  const requestedRates = {};
  rateSettingsForm.querySelectorAll("[data-room-rate]").forEach((input) => {
    requestedRates[input.dataset.roomRate] = Number(input.value);
  });
  state.roomRates = normalizeRoomRates(requestedRates);
  applyRoomRates();
  rateSettingsStatus.textContent = "Harga terbaru sudah disimpan dan berlaku untuk seluruh periode.";
  render();
});

roomBoard.addEventListener("click", (event) => {
  const card = event.target.closest("[data-room-id]");
  if (!card) return;
  selectedRoomId = card.dataset.roomId;
  render();
  detailPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
});

detailPanel.addEventListener("change", (event) => {
  if (isViewMode) return;

  const action = event.target.dataset.action;
  if (!action) return;

  updateSelectedRoom((room) => {
    const updated = { ...room };
    if (action === "resident-name") updated.residentName = event.target.value.trim();
    if (action === "check-in-date") updated.checkInDate = event.target.value;
    if (action === "payment-due-date") updated.paymentDueDate = event.target.value;
    if (action === "check-out-date") updated.checkOutDate = event.target.value;
    if (action === "payment") updated.paymentStatus = event.target.value;
    if (action === "room-status") updated.roomStatus = event.target.value;
    return updated;
  });
});

detailPanel.addEventListener("click", (event) => {
  if (isViewMode) return;

  const editNoteButton = event.target.closest("[data-edit-note]");
  if (editNoteButton) {
    const noteIndex = Number(editNoteButton.dataset.editNote);
    const currentNote = activeMonthData().rooms.find((room) => room.id === selectedRoomId)?.notes?.[noteIndex];
    if (!currentNote) return;
    const nextText = window.prompt("Edit catatan kamar", currentNote.text);
    if (nextText === null || !nextText.trim()) return;
    updateSelectedRoom((room) => ({
      ...room,
      notes: (room.notes || []).map((note, index) => {
        return index === noteIndex ? { ...note, text: nextText.trim() } : note;
      })
    }));
    return;
  }

  const deleteNoteButton = event.target.closest("[data-delete-note]");
  if (deleteNoteButton) {
    const noteIndex = Number(deleteNoteButton.dataset.deleteNote);
    const confirmed = window.confirm("Hapus catatan kamar ini?");
    if (!confirmed) return;
    updateSelectedRoom((room) => ({
      ...room,
      notes: (room.notes || []).filter((_, index) => index !== noteIndex)
    }));
    return;
  }

  if (event.target.id !== "addNoteBtn") return;

  const noteInput = document.querySelector("#noteInput");
  const text = noteInput.value.trim();
  if (!text) return;

  updateSelectedRoom((room) => ({
    ...room,
    notes: [
      { text, date: formatDate(defaultExpenseDate()) },
      ...(room.notes || [])
    ]
  }));
});

facilityTaskList.addEventListener("change", (event) => {
  if (isViewMode) return;

  const taskId = event.target.dataset.facilityId;
  const field = event.target.dataset.facilityField;
  if (!taskId || !field) return;

  state.facilityTasks = state.facilityTasks.map((task) => {
    return task.id === taskId ? { ...task, [field]: event.target.value.trim() } : task;
  });
  render();
});

facilityTaskList.addEventListener("click", (event) => {
  if (isViewMode) return;

  const historyButton = event.target.closest("[data-edit-history], [data-delete-history]");
  if (historyButton) {
    const historyIndex = Number(historyButton.dataset.editHistory ?? historyButton.dataset.deleteHistory);
    const taskId = historyButton.dataset.historyTask;
    if (historyButton.dataset.editHistory !== undefined) {
      const task = state.facilityTasks.find((item) => item.id === taskId);
      const nextDate = promptForHistoryDate(task?.history?.[historyIndex]);
      if (!nextDate) return;
      updateTaskHistory("facilityTasks", taskId, (item) => ({
        ...item,
        history: item.history.map((dateValue, index) => index === historyIndex ? nextDate : dateValue)
      }));
    } else {
      const confirmed = window.confirm("Hapus riwayat ini?");
      if (!confirmed) return;
      updateTaskHistory("facilityTasks", taskId, (item) => ({
        ...item,
        history: item.history.filter((_, index) => index !== historyIndex)
      }));
    }
    render();
    return;
  }

  const button = event.target.closest("[data-complete-facility]");
  if (!button) return;

  const completedDate = localDateString(new Date());
  state.facilityTasks = state.facilityTasks.map((task) => {
    if (task.id !== button.dataset.completeFacility) return task;
    const history = task.history[0] === completedDate ? task.history : [completedDate, ...task.history];
    return { ...task, lastCompletedDate: completedDate, history };
  });
  render();
});

acServiceRoomFilter.addEventListener("change", () => {
  renderAcServiceTasks();
});

acServiceTaskList.addEventListener("change", (event) => {
  if (isViewMode) return;

  const taskId = event.target.dataset.acServiceId;
  if (!taskId) return;

  state.acServiceTasks = state.acServiceTasks.map((task) => {
    if (task.id !== taskId) return task;
    return { ...task, [event.target.dataset.acServiceField]: event.target.value.trim(), isCompleted: false };
  });
  render();
});

acServiceTaskList.addEventListener("click", (event) => {
  if (isViewMode) return;

  const historyButton = event.target.closest("[data-edit-history], [data-delete-history]");
  if (historyButton) {
    const historyIndex = Number(historyButton.dataset.editHistory ?? historyButton.dataset.deleteHistory);
    const taskId = historyButton.dataset.historyTask;
    if (historyButton.dataset.editHistory !== undefined) {
      const task = state.acServiceTasks.find((item) => item.id === taskId);
      const nextDate = promptForHistoryDate(task?.history?.[historyIndex]);
      if (!nextDate) return;
      updateTaskHistory("acServiceTasks", taskId, (item) => ({
        ...item,
        history: item.history.map((dateValue, index) => index === historyIndex ? nextDate : dateValue)
      }));
    } else {
      const confirmed = window.confirm("Hapus riwayat service ini?");
      if (!confirmed) return;
      updateTaskHistory("acServiceTasks", taskId, (item) => ({
        ...item,
        history: item.history.filter((_, index) => index !== historyIndex)
      }));
    }
    render();
    return;
  }

  const completeButton = event.target.closest("[data-complete-ac-service]");
  if (!completeButton) return;

  const completedDate = localDateString(new Date());
  state.acServiceTasks = state.acServiceTasks.map((task) => {
    if (task.id !== completeButton.dataset.completeAcService) return task;
    const history = task.history[0] === completedDate ? task.history : [completedDate, ...task.history];
    return {
      ...task,
      isCompleted: true,
      lastCompletedDate: completedDate,
      history
    };
  });
  render();
});

bookingForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (isViewMode) return;

  const booking = {
    id: editingBookingId || crypto.randomUUID(),
    roomId: document.querySelector("#bookingRoomId").value,
    prospectName: document.querySelector("#bookingProspectName").value.trim(),
    paymentStatus: document.querySelector("#bookingPaymentStatus").value,
    dpAmount: Number(document.querySelector("#bookingDpAmount").value || 0),
    dpPaid: document.querySelector("#bookingDpPaid").checked,
    payment1Amount: Number(document.querySelector("#bookingPayment1Amount").value || 0),
    payment1Paid: document.querySelector("#bookingPayment1Paid").checked,
    payment2Amount: Number(document.querySelector("#bookingPayment2Amount").value || 0),
    payment2Paid: document.querySelector("#bookingPayment2Paid").checked,
    plannedCheckIn: document.querySelector("#bookingPlannedCheckIn").value,
    note: document.querySelector("#bookingNote").value.trim()
  };

  if (!booking.roomId || !booking.prospectName || !booking.plannedCheckIn) return;

  if (editingBookingId) {
    activeMonthData().bookings = activeMonthData().bookings.map((item) => item.id === editingBookingId ? booking : item);
  } else {
    activeMonthData().bookings = [booking, ...activeMonthData().bookings];
  }

  resetBookingForm();
  render();
});

bookingList.addEventListener("click", (event) => {
  if (isViewMode) return;

  const editButton = event.target.closest("[data-edit-booking]");
  if (editButton) {
    const booking = activeMonthData().bookings.find((item) => item.id === editButton.dataset.editBooking);
    if (!booking) return;
    fillBookingForm(booking);
    return;
  }

  const deleteButton = event.target.closest("[data-delete-booking]");
  if (!deleteButton) return;

  activeMonthData().bookings = activeMonthData().bookings.filter((booking) => booking.id !== deleteButton.dataset.deleteBooking);
  render();
});

bookingList.addEventListener("change", (event) => {
  if (isViewMode) return;

  const checkbox = event.target.closest("[data-toggle-booking]");
  if (!checkbox) return;

  const field = checkbox.dataset.paymentField;
  activeMonthData().bookings = activeMonthData().bookings.map((booking) => {
    if (booking.id !== checkbox.dataset.toggleBooking) return booking;
    return { ...booking, [field]: checkbox.checked };
  });
  render();
});

bookingCancelEditBtn.addEventListener("click", () => {
  resetBookingForm();
});

debtForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (isViewMode) return;

  const existingDebt = editingDebtId ? findDebtById(editingDebtId) : null;
  const debt = {
    id: editingDebtId || crypto.randomUUID(),
    category: document.querySelector("#debtCategory").value,
    description: document.querySelector("#debtDescription").value.trim(),
    amount: Number(document.querySelector("#debtAmount").value),
    date: document.querySelector("#debtDate").value,
    note: document.querySelector("#debtNote").value.trim(),
    isPaid: existingDebt?.isPaid || false,
    paidAt: existingDebt?.paidAt || ""
  };

  if (!debt.description || !debt.amount || !debt.date) return;

  if (editingDebtId) {
    updateDebtById(editingDebtId, () => debt);
  } else {
    activeMonthData().debts = [debt, ...activeMonthData().debts];
  }

  resetDebtForm();
  render();
});

debtList.addEventListener("change", (event) => {
  if (isViewMode) return;

  const checkbox = event.target.closest("[data-toggle-debt]");
  if (!checkbox) return;

  updateDebtById(checkbox.dataset.toggleDebt, (debt) => ({
    ...debt,
    isPaid: checkbox.checked,
    paidAt: checkbox.checked ? localDateString(new Date()) : ""
  }));
  render();
});

debtList.addEventListener("click", (event) => {
  if (isViewMode) return;

  const editButton = event.target.closest("[data-edit-debt]");
  if (editButton) {
    const debt = findDebtById(editButton.dataset.editDebt);
    if (!debt) return;
    fillDebtForm(debt);
    return;
  }

  const deleteButton = event.target.closest("[data-delete-debt]");
  if (!deleteButton) return;

  deleteDebtById(deleteButton.dataset.deleteDebt);
  render();
});

debtCancelEditBtn.addEventListener("click", () => {
  resetDebtForm();
});

monthSelect.addEventListener("change", () => {
  state.selectedMonth = monthSelect.value;
  state.selectedYear = getSelectedYear();
  activeMonthData();
  updatePeriodFormDates();
  resetBookingForm();
  resetDebtForm();
  render();
});

yearSelect.addEventListener("change", () => {
  const selectedMonthNumber = (monthSelect.value || defaultMonthKey).slice(5, 7);
  renderMonthOptions(Number(yearSelect.value));
  monthSelect.value = `${yearSelect.value}-${selectedMonthNumber}`;
  state.selectedYear = Number(yearSelect.value);
  state.selectedMonth = monthSelect.value;
  activeMonthData();
  updatePeriodFormDates();
  resetBookingForm();
  resetDebtForm();
  render();
});

resetDataBtn.addEventListener("click", () => {
  if (isViewMode) return;

  const confirmed = window.confirm("Reset semua perubahan status, catatan, booking, dan hutang ke data awal?");
  if (!confirmed) return;

  localStorage.removeItem(STORAGE_KEY);
  state = loadState();
  selectedRoomId = state.selectedRoomId;
  renderYearOptions(getYearFromMonthKey(state.selectedMonth || defaultMonthKey));
  yearSelect.value = String(state.selectedYear || currentYear);
  renderMonthOptions(getSelectedYear());
  monthSelect.value = state.selectedMonth;
  updatePeriodFormDates();
  resetBookingForm();
  resetDebtForm();
  render();
});

render();
loadRemoteState();
