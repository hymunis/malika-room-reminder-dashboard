const STORAGE_KEY = "malika-room-reminder-state-v1";
// Paste Google Apps Script Web App /exec URL here after deployment.
const GOOGLE_SHEET_API_URL = "https://script.google.com/macros/s/AKfycbxFY3KuxhQkNqiCjzi4boqJnpeftt-IjHhfStiie5fOtmi2mXc2AZnBfU0hHOaqsbg8dw/exec";

const monthNames = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];
const now = new Date();
const currentYear = now.getFullYear();
const defaultMonthKey = `${currentYear}-${String(now.getMonth() + 1).padStart(2, "0")}`;
const paymentOptions = ["Lunas", "Belum Bayar", "Telat", "Cicil", "Dispensasi"];
const roomStatusOptions = ["Normal", "Kosong", "Renovasi", "Upgrade", "Maintenance Ringan", "Blocked"];
const acStatusOptions = ["Aman", "Perlu Service", "Service Terjadwal", "Selesai Service"];
const debtCategoryOptions = ["Biaya Internet", "Pembelian Barang", "Pembayaran Jasa", "Lainnya"];
const roomTypeGroups = [
  { type: "Standard", description: "Bulanan", tone: "standard" },
  { type: "Plus Room", description: "Semesteran, 6 bulan", tone: "standard-plus" },
  { type: "Eksklusif", description: "Tahunan, ber-AC", tone: "exclusive" },
  { type: "Deluxe", description: "Tahunan, ber-AC", tone: "deluxe" }
];

const baseRooms = [
  { id: "A4", type: "Deluxe", scheme: "Tahunan", rate: 16500000, hasAc: true, paymentStatus: "Lunas", roomStatus: "Normal", acStatus: "Aman", residentName: "", checkInDate: "", checkOutDate: "" },
  { id: "B4", type: "Deluxe", scheme: "Tahunan", rate: 16500000, hasAc: true, paymentStatus: "Lunas", roomStatus: "Normal", acStatus: "Aman", residentName: "", checkInDate: "", checkOutDate: "" },
  { id: "A1", type: "Eksklusif", scheme: "Tahunan", rate: 14500000, hasAc: true, paymentStatus: "Lunas", roomStatus: "Normal", acStatus: "Aman", residentName: "", checkInDate: "", checkOutDate: "" },
  { id: "A5", type: "Eksklusif", scheme: "Tahunan", rate: 14500000, hasAc: true, paymentStatus: "Lunas", roomStatus: "Normal", acStatus: "Aman", residentName: "", checkInDate: "", checkOutDate: "" },
  { id: "B1", type: "Eksklusif", scheme: "Tahunan", rate: 14500000, hasAc: true, paymentStatus: "Lunas", roomStatus: "Normal", acStatus: "Aman", residentName: "", checkInDate: "", checkOutDate: "" },
  { id: "B2", type: "Eksklusif", scheme: "Tahunan", rate: 14500000, hasAc: true, paymentStatus: "Lunas", roomStatus: "Normal", acStatus: "Aman", residentName: "", checkInDate: "", checkOutDate: "" },
  { id: "B3", type: "Eksklusif", scheme: "Tahunan", rate: 14500000, hasAc: true, paymentStatus: "Lunas", roomStatus: "Normal", acStatus: "Aman", residentName: "", checkInDate: "", checkOutDate: "" },
  { id: "B5", type: "Eksklusif", scheme: "Tahunan", rate: 14500000, hasAc: true, paymentStatus: "Lunas", roomStatus: "Normal", acStatus: "Aman", residentName: "", checkInDate: "", checkOutDate: "" },
  { id: "B6", type: "Eksklusif", scheme: "Tahunan", rate: 14500000, hasAc: true, paymentStatus: "Lunas", roomStatus: "Normal", acStatus: "Aman", residentName: "", checkInDate: "", checkOutDate: "" },
  { id: "B7", type: "Eksklusif", scheme: "Tahunan", rate: 14500000, hasAc: true, paymentStatus: "Lunas", roomStatus: "Normal", acStatus: "Aman", residentName: "", checkInDate: "", checkOutDate: "" },
  { id: "A6", type: "Plus Room", scheme: "Semesteran", rate: 6250000, hasAc: false, paymentStatus: "Lunas", roomStatus: "Normal", residentName: "", checkInDate: "", checkOutDate: "" },
  { id: "A8", type: "Plus Room", scheme: "Semesteran", rate: 6250000, hasAc: false, paymentStatus: "Lunas", roomStatus: "Normal", residentName: "", checkInDate: "", checkOutDate: "" },
  { id: "A2", type: "Standard", scheme: "Bulanan", rate: 800000, hasAc: false, paymentStatus: "Lunas", roomStatus: "Normal", residentName: "", checkInDate: "", checkOutDate: "" },
  { id: "A3", type: "Standard", scheme: "Bulanan", rate: 800000, hasAc: false, paymentStatus: "Lunas", roomStatus: "Normal", residentName: "", checkInDate: "", checkOutDate: "" },
  { id: "A7", type: "Standard", scheme: "Bulanan", rate: 800000, hasAc: false, paymentStatus: "Lunas", roomStatus: "Normal", residentName: "", checkInDate: "", checkOutDate: "" },
  { id: "B8", type: "Standard", scheme: "Bulanan", rate: 800000, hasAc: false, paymentStatus: "Lunas", roomStatus: "Normal", residentName: "", checkInDate: "", checkOutDate: "" },
  { id: "B9", type: "Standard", scheme: "Bulanan", rate: 800000, hasAc: false, paymentStatus: "Lunas", roomStatus: "Normal", residentName: "", checkInDate: "", checkOutDate: "" }
];

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

const initialYear = getYearFromMonthKey(state.selectedMonth || defaultMonthKey);
renderYearOptions(initialYear);
yearSelect.value = String(initialYear);
renderMonthOptions(initialYear);
monthSelect.value = state.selectedMonth || defaultMonthKey;
updatePeriodFormDates();
bookingRoomId.innerHTML = baseRooms.map((room) => `<option value="${room.id}">${room.id}</option>`).join("");
bookingPlannedCheckIn.value = defaultExpenseDate();

function loadState() {
  try {
    return normalizeStoredState(JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"));
  } catch {
    return normalizeStoredState(null);
  }
}

function normalizeStoredState(stored) {
  const fallback = {
    monthlyData: {
      [defaultMonthKey]: createMonthData(defaultMonthKey, true)
    },
    selectedMonth: defaultMonthKey,
    selectedYear: currentYear,
    selectedRoomId: "A4"
  };

  if (!stored) return fallback;

  if (stored.monthlyData) {
    const monthlyData = {};
    Object.keys(stored.monthlyData).forEach((monthKey) => {
      const savedMonth = stored.monthlyData[monthKey];
      monthlyData[monthKey] = normalizeMonthData(savedMonth, monthKey);
    });
    if (!monthlyData[defaultMonthKey]) {
      monthlyData[defaultMonthKey] = createMonthData(defaultMonthKey, true);
    }

    return {
      monthlyData,
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
        }, defaultMonthKey)
      },
      selectedMonth: defaultMonthKey,
      selectedYear: currentYear,
      selectedRoomId: stored.selectedRoomId || fallback.selectedRoomId
    };
  }

  return fallback;
}

function saveState() {
  state.selectedRoomId = selectedRoomId;
  state.selectedMonth = monthSelect.value;
  state.selectedYear = Number(yearSelect.value);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (GOOGLE_SHEET_API_URL && remoteReady && !isApplyingRemoteState) {
    scheduleRemoteSave();
  }
}

function createMonthData(monthKey, withSeedExpenses = false) {
  return {
    rooms: baseRooms.map((room) => ({ ...room, notes: [] })),
    bookings: [],
    expenses: withSeedExpenses ? seedExpenses(monthKey) : [],
    debts: [],
    carriedContextFrom: ""
  };
}

function normalizeMonthData(monthData, monthKey) {
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
        rate: baseRoom.rate,
        hasAc: baseRoom.hasAc,
        acStatus: baseRoom.hasAc ? roomData.acStatus || baseRoom.acStatus : undefined,
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
  const storedYears = Object.keys(state.monthlyData || {}).map(getYearFromMonthKey);
  const minYear = Math.min(currentYear - 1, activeYear, ...storedYears);
  const maxYear = Math.max(currentYear + 10, activeYear, ...storedYears);
  const years = [];

  for (let year = minYear; year <= maxYear; year += 1) {
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
  if (!previousKey) return createMonthData(monthKey, false);

  const previousData = state.monthlyData[previousKey];
  return {
    rooms: baseRooms.map((baseRoom) => {
      const previousRoom = (previousData.rooms || []).find((room) => room.id === baseRoom.id) || {};
      return createCarriedRoom(baseRoom, previousRoom);
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
    return mergeCarriedRoomContext(baseRoom, currentRoom, previousRoom);
  });
  monthData.carriedContextFrom = previousKey;
}

function mergeCarriedRoomContext(baseRoom, currentRoom, previousRoom) {
  const baseRoomStatus = baseRoom.roomStatus || "Normal";
  const room = {
    ...baseRoom,
    ...currentRoom,
    type: baseRoom.type,
    scheme: baseRoom.scheme,
    rate: baseRoom.rate,
    hasAc: baseRoom.hasAc,
    acStatus: baseRoom.hasAc ? currentRoom.acStatus || previousRoom.acStatus || baseRoom.acStatus : undefined,
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

function createCarriedRoom(baseRoom, previousRoom) {
  return {
    ...baseRoom,
    residentName: previousRoom.residentName || "",
    checkInDate: "",
    paymentDueDate: "",
    checkOutDate: previousRoom.checkOutDate || "",
    paymentStatus: "Belum Bayar",
    roomStatus: previousRoom.roomStatus || baseRoom.roomStatus || "Normal",
    acStatus: previousRoom.acStatus || baseRoom.acStatus,
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
  const baseRoomStatus = baseRoom.roomStatus || "Normal";
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
    setSyncStatus("Local storage");
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
      setSyncStatus("Google Sheet tersambung", "online");
      return;
    }

    setSyncStatus("Sheet siap, menyimpan...", "saving");
    scheduleRemoteSave(0);
  } catch {
    remoteReady = true;
    setSyncStatus("Offline, pakai lokal", "error");
  }
}

function scheduleRemoteSave(delay = 700) {
  clearTimeout(syncTimer);
  syncTimer = setTimeout(saveRemoteState, delay);
}

async function saveRemoteState() {
  if (!GOOGLE_SHEET_API_URL) return;

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
  if (room.roomStatus === "Kosong" || room.roomStatus === "Blocked") return "empty";
  if (room.roomStatus === "Renovasi" || room.roomStatus === "Upgrade") return "project";
  if (room.paymentStatus === "Telat") return "danger";
  if (
    room.paymentStatus === "Belum Bayar" ||
    room.paymentStatus === "Cicil" ||
    room.paymentStatus === "Dispensasi" ||
    room.roomStatus === "Maintenance Ringan" ||
    room.acStatus === "Perlu Service" ||
    room.acStatus === "Service Terjadwal"
  ) return "warning";

  return "safe";
}

function pillTone(value) {
  if (value === "Telat" || value === "Perlu Service") return "danger";
  if (["Belum Bayar", "Cicil", "Dispensasi", "Maintenance Ringan", "Service Terjadwal"].includes(value)) return "warning";
  if (["Renovasi", "Upgrade"].includes(value)) return "project";
  if (value === "Lunas" || value === "Normal" || value === "Aman" || value === "Selesai Service") return "safe";
  return "";
}

function render() {
  renderSummary();
  renderPriorityDashboard();
  renderRoomBoard();
  renderDetail();
  renderBookings();
  renderDebts();
  saveState();
}

function renderSummary() {
  const rooms = activeMonthData().rooms;
  const paymentFollowUp = rooms.filter((room) => ["Belum Bayar", "Telat", "Dispensasi"].includes(room.paymentStatus)).length;
  const installments = rooms.filter((room) => room.paymentStatus === "Cicil").length;
  const acService = rooms.filter((room) => room.hasAc && ["Perlu Service", "Service Terjadwal"].includes(room.acStatus)).length;
  const projects = rooms.filter((room) => ["Renovasi", "Upgrade", "Maintenance Ringan"].includes(room.roomStatus)).length;
  const unpaidDebts = currentOutstandingDebts();
  const unpaidDebtTotal = unpaidDebts.reduce((total, debt) => total + Number(debt.amount), 0);

  const cards = [
    { label: "Total kamar", value: rooms.length, hint: `Periode ${selectedMonthName()}` },
    { label: "Pembayaran perlu follow-up", value: paymentFollowUp, hint: "Belum bayar, telat, dispensasi" },
    { label: "Cicilan aktif", value: installments, hint: "Perlu pantau jadwal cicil" },
    { label: "AC perlu service", value: acService, hint: "Hanya kamar Deluxe & Eksklusif" },
    { label: "Kamar renovasi/upgrade", value: projects, hint: "Termasuk maintenance ringan" },
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
  const acText = room.hasAc ? `AC: ${room.acStatus}` : "Tanpa AC";

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
        <span class="pill ${pillTone(room.acStatus)}">${acText}</span>
      </div>
    </button>
  `;
}

function toneLabel(tone) {
  const labels = {
    safe: "Aman",
    warning: "Perhatian",
    danger: "Telat",
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
        <span>Fasilitas AC</span>
        <strong>${room.hasAc ? "Ada AC" : "Tidak ada AC"}</strong>
      </div>
      <div class="info-tile">
        <span>Status kamar</span>
        <strong>${room.roomStatus}</strong>
      </div>
      <div class="info-tile">
        <span>Status AC</span>
        <strong>${room.hasAc ? room.acStatus : "Tidak berlaku"}</strong>
      </div>
    </div>

    <div class="control-grid">
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

      ${room.hasAc ? `
        <label>
          Update service AC
          <select data-action="ac-status">
            ${acStatusOptions.map((option) => `<option value="${option}" ${room.acStatus === option ? "selected" : ""}>${option}</option>`).join("")}
          </select>
        </label>
      ` : ""}

      <label>
        Tambah catatan
        <textarea id="noteInput" placeholder="Contoh: penghuni janji bayar Jumat, cek lampu kamar mandi, jadwalkan teknisi."></textarea>
      </label>
      <div class="note-actions">
        <button class="small-button" type="button" id="addNoteBtn">Simpan Catatan</button>
      </div>
    </div>

    <div class="notes-list">
      ${(room.notes || []).length ? room.notes.map((note) => `
        <article class="note-item">
          <p>${escapeHtml(note.text)}</p>
          <small>${note.date}</small>
        </article>
      `).join("") : `<div class="empty-state">Belum ada catatan untuk kamar ini.</div>`}
    </div>
  `;
}

function renderPriorityDashboard() {
  const rooms = activeMonthData().rooms;
  const paymentRooms = rooms.filter((room) => ["Belum Bayar", "Telat", "Cicil", "Dispensasi"].includes(room.paymentStatus));
  const acRooms = rooms.filter((room) => room.hasAc && ["Perlu Service", "Service Terjadwal"].includes(room.acStatus));
  const projectRooms = rooms.filter((room) => ["Kosong", "Renovasi", "Upgrade", "Maintenance Ringan", "Blocked"].includes(room.roomStatus));

  paymentPriorityList.innerHTML = renderRoomPriorityItems(
    paymentRooms,
    (room) => room.paymentStatus,
    (room) => room.paymentDueDate ? `Tanggal bayar ${formatDate(room.paymentDueDate)}` : "Tanggal bayar belum diisi"
  );
  acPriorityList.innerHTML = renderRoomPriorityItems(
    acRooms,
    (room) => room.acStatus,
    () => "Pastikan jadwal teknisi dan akses kamar sudah dikonfirmasi"
  );
  roomProjectPriorityList.innerHTML = renderRoomPriorityItems(
    projectRooms,
    (room) => room.roomStatus,
    (room) => room.checkOutDate ? `Check-out ${formatDate(room.checkOutDate)}` : "Pantau progres dan target kesiapan kamar"
  );
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
          <label class="mini-check">
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
          </label>
          <strong>Terbayar ${formatCurrency(totalPaid)}</strong>
          <small>Total tagihan ${formatCurrency(totalAmount)}</small>
          <div class="booking-row-actions">
            <button class="small-button" type="button" data-edit-booking="${booking.id}">Edit</button>
            <button class="small-button" type="button" data-delete-booking="${booking.id}">Hapus</button>
          </div>
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
      <label class="debt-check">
        <input type="checkbox" data-toggle-debt="${debt.id}" ${debt.isPaid ? "checked" : ""}>
        <span>${debt.isPaid ? "Sudah lunas" : "Belum lunas"}</span>
      </label>
      <div class="debt-main">
        <strong>${escapeHtml(debt.description)}</strong>
        <small>${debt.category} · ${formatDate(debt.date)}</small>
        ${debt.note ? `<p>${escapeHtml(debt.note)}</p>` : ""}
      </div>
      <div class="debt-amount">
        <strong>${formatCurrency(debt.amount)}</strong>
        ${debt.paidAt ? `<small>Dilunasi ${formatDate(debt.paidAt)}</small>` : ""}
        <div class="debt-row-actions">
          <button class="small-button" type="button" data-edit-debt="${debt.id}">Edit</button>
          <button class="small-button" type="button" data-delete-debt="${debt.id}">Hapus</button>
        </div>
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

roomBoard.addEventListener("click", (event) => {
  const card = event.target.closest("[data-room-id]");
  if (!card) return;
  selectedRoomId = card.dataset.roomId;
  render();
  detailPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
});

detailPanel.addEventListener("change", (event) => {
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
    if (action === "ac-status") updated.acStatus = event.target.value;
    return updated;
  });
});

detailPanel.addEventListener("click", (event) => {
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

bookingForm.addEventListener("submit", (event) => {
  event.preventDefault();

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
