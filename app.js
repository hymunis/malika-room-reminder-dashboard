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
const flexibleRentTypes = ["Standard", "Standard+"];
const rentSchemeOptions = ["Bulanan", "Semesteran"];
const bookingPaymentOptions = ["Lunas", "Cicil"];
const roomTypeGroups = [
  { type: "Standard", description: "Bulanan atau semesteran", tone: "standard" },
  { type: "Standard+", description: "Semesteran", tone: "standard-plus" },
  { type: "Eksklusif", description: "Tahunan, ber-AC", tone: "exclusive" },
  { type: "Deluxe", description: "Tahunan, ber-AC", tone: "deluxe" }
];
const routineItems = ["Listrik", "Sampah", "Gas", "Gaji karyawan", "Air galon", "Kresek sampah", "Pembersih toilet", "Sabun cuci tangan", "Cairan pel"];
const expenseTrackingRules = [
  {
    item: "Gas",
    aliases: ["gas"],
    expectedDays: 45,
    normalText: "Normal: habis sekitar 1,5 bulan sekali",
    maxMonthlyPurchases: 1
  },
  {
    item: "Air galon",
    aliases: ["air galon", "air minum galon", "galon"],
    expectedDays: 21,
    normalText: "Normal: habis sekitar 3 minggu sekali",
    maxMonthlyPurchases: 2
  }
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
  { id: "A6", type: "Standard+", scheme: "Bulanan / Semesteran", rentScheme: "Semesteran", monthlyRate: 1000000, semesterRate: 6000000, hasAc: false, paymentStatus: "Lunas", roomStatus: "Normal", residentName: "", checkInDate: "", checkOutDate: "" },
  { id: "A8", type: "Standard+", scheme: "Bulanan / Semesteran", rentScheme: "Semesteran", monthlyRate: 1000000, semesterRate: 6000000, hasAc: false, paymentStatus: "Lunas", roomStatus: "Normal", residentName: "", checkInDate: "", checkOutDate: "" },
  { id: "A2", type: "Standard", scheme: "Bulanan / Semesteran", rentScheme: "Bulanan", monthlyRate: 800000, semesterRate: 5150000, hasAc: false, paymentStatus: "Lunas", roomStatus: "Normal", residentName: "", checkInDate: "", checkOutDate: "" },
  { id: "A3", type: "Standard", scheme: "Bulanan / Semesteran", rentScheme: "Bulanan", monthlyRate: 800000, semesterRate: 5150000, hasAc: false, paymentStatus: "Lunas", roomStatus: "Normal", residentName: "", checkInDate: "", checkOutDate: "" },
  { id: "A7", type: "Standard", scheme: "Bulanan / Semesteran", rentScheme: "Bulanan", monthlyRate: 800000, semesterRate: 5150000, hasAc: false, paymentStatus: "Lunas", roomStatus: "Normal", residentName: "", checkInDate: "", checkOutDate: "" },
  { id: "B7", type: "Standard", scheme: "Bulanan / Semesteran", rentScheme: "Bulanan", monthlyRate: 800000, semesterRate: 5150000, hasAc: false, paymentStatus: "Lunas", roomStatus: "Normal", residentName: "", checkInDate: "", checkOutDate: "" },
  { id: "B8", type: "Standard", scheme: "Bulanan / Semesteran", rentScheme: "Bulanan", monthlyRate: 800000, semesterRate: 5150000, hasAc: false, paymentStatus: "Lunas", roomStatus: "Normal", residentName: "", checkInDate: "", checkOutDate: "" },
  { id: "B9", type: "Standard", scheme: "Bulanan / Semesteran", rentScheme: "Bulanan", monthlyRate: 800000, semesterRate: 5150000, hasAc: false, paymentStatus: "Lunas", roomStatus: "Normal", residentName: "", checkInDate: "", checkOutDate: "" }
];

let state = loadState();
let selectedRoomId = state.selectedRoomId || "A4";
let remoteReady = !GOOGLE_SHEET_API_URL;
let isApplyingRemoteState = false;
let syncTimer;

const summaryGrid = document.querySelector("#summaryGrid");
const roomBoard = document.querySelector("#roomBoard");
const detailPanel = document.querySelector("#detailPanel");
const reminderList = document.querySelector("#reminderList");
const bookingForm = document.querySelector("#bookingForm");
const bookingRoomId = document.querySelector("#bookingRoomId");
const bookingPlannedCheckIn = document.querySelector("#bookingPlannedCheckIn");
const bookingList = document.querySelector("#bookingList");
const shoppingForm = document.querySelector("#shoppingForm");
const expenseTracker = document.querySelector("#expenseTracker");
const expenseList = document.querySelector("#expenseList");
const resetDataBtn = document.querySelector("#resetDataBtn");
const expenseDate = document.querySelector("#expenseDate");
const yearSelect = document.querySelector("#yearSelect");
const monthSelect = document.querySelector("#monthSelect");
const syncStatus = document.querySelector("#syncStatus");

const initialYear = getYearFromMonthKey(state.selectedMonth || defaultMonthKey);
renderYearOptions(initialYear);
yearSelect.value = String(initialYear);
renderMonthOptions(initialYear);
monthSelect.value = state.selectedMonth || defaultMonthKey;
updateExpenseDateForMonth();
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
    expenses: withSeedExpenses ? seedExpenses(monthKey) : []
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
        rentScheme: roomData.rentScheme || baseRoom.rentScheme || baseRoom.scheme,
        residentName: roomData.residentName || "",
        checkInDate: roomData.checkInDate || "",
        checkOutDate: roomData.checkOutDate || "",
        notes: roomData.notes || []
      };
    }),
    bookings: Array.isArray(monthData.bookings) ? monthData.bookings.map(normalizeBooking) : migrateRoomBookings(monthData.rooms || []),
    expenses: Array.isArray(monthData.expenses) ? monthData.expenses : seedExpenses(monthKey)
  };
}

function normalizeBooking(booking) {
  return {
    id: booking.id || crypto.randomUUID(),
    roomId: booking.roomId || "A1",
    prospectName: booking.prospectName || booking.bookingName || "",
    paymentStatus: booking.paymentStatus || "Cicil",
    dpAmount: Number(booking.dpAmount || booking.bookingDpAmount || 0),
    payment2Amount: Number(booking.payment2Amount || 0),
    payment3Amount: Number(booking.payment3Amount || 0),
    plannedCheckIn: booking.plannedCheckIn || booking.bookingMoveInDate || "",
    note: booking.note || booking.bookingNote || ""
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

function monthKeys(year = getSelectedYear()) {
  return monthNames.map((_, index) => `${year}-${String(index + 1).padStart(2, "0")}`);
}

function getSelectedYear() {
  return Number(yearSelect.value || state.selectedYear || getYearFromMonthKey(state.selectedMonth) || currentYear);
}

function activeMonthData() {
  const monthKey = monthSelect.value || state.selectedMonth || defaultMonthKey;
  if (!state.monthlyData[monthKey]) {
    state.monthlyData[monthKey] = createMonthData(monthKey, false);
  }
  return state.monthlyData[monthKey];
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

function selectedMonthEndDate() {
  const monthKey = monthSelect.value || state.selectedMonth || defaultMonthKey;
  const [year, month] = monthKey.split("-").map(Number);
  return localDateString(new Date(year, month, 0));
}

function updateExpenseDateForMonth() {
  const monthKey = monthSelect.value || state.selectedMonth || defaultMonthKey;
  expenseDate.min = `${monthKey}-01`;
  expenseDate.max = selectedMonthEndDate();
  expenseDate.value = defaultExpenseDate();
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
      updateExpenseDateForMonth();
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
  if (isFlexibleRentRoom(room)) {
    if (room.rentScheme === "Semesteran") return `${formatCurrency(room.semesterRate)}/semester`;
    return `${formatCurrency(room.monthlyRate)}/bulan`;
  }

  return `${formatCurrency(room.rate)}/${room.scheme.toLowerCase().replace("an", "")}`;
}

function schemeLabel(room) {
  if (isFlexibleRentRoom(room)) return room.rentScheme;
  return room.scheme;
}

function isFlexibleRentRoom(room) {
  return flexibleRentTypes.includes(room.type);
}

function currentMonthExpenses() {
  return activeMonthData().expenses;
}

function allTrackedYearExpenses() {
  return monthKeys().flatMap((monthKey) => {
    const monthData = state.monthlyData[monthKey];
    return monthData ? monthData.expenses : [];
  });
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
  renderRoomBoard();
  renderDetail();
  renderReminders();
  renderBookings();
  renderExpenseTracker();
  renderExpenses();
  saveState();
}

function renderSummary() {
  const rooms = activeMonthData().rooms;
  const paymentFollowUp = rooms.filter((room) => ["Belum Bayar", "Telat", "Dispensasi"].includes(room.paymentStatus)).length;
  const installments = rooms.filter((room) => room.paymentStatus === "Cicil").length;
  const acService = rooms.filter((room) => room.hasAc && ["Perlu Service", "Service Terjadwal"].includes(room.acStatus)).length;
  const projects = rooms.filter((room) => ["Renovasi", "Upgrade", "Maintenance Ringan"].includes(room.roomStatus)).length;
  const expensesTotal = currentMonthExpenses().reduce((total, expense) => total + Number(expense.amount), 0);

  const cards = [
    { label: "Total kamar", value: rooms.length, hint: `Periode ${selectedMonthName()}` },
    { label: "Pembayaran perlu follow-up", value: paymentFollowUp, hint: "Belum bayar, telat, dispensasi" },
    { label: "Cicilan aktif", value: installments, hint: "Perlu pantau jadwal cicil" },
    { label: "AC perlu service", value: acService, hint: "Hanya kamar Deluxe & Eksklusif" },
    { label: "Kamar renovasi/upgrade", value: projects, hint: "Termasuk maintenance ringan" },
      { label: "Belanja periode ini", value: formatCurrency(expensesTotal), hint: `${currentMonthExpenses().length} transaksi ${selectedMonthName()}` }
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
        Tanggal check-in
        <input data-action="check-in-date" type="date" value="${room.checkInDate || ""}">
      </label>

      <label>
        Tanggal check-out
        <input data-action="check-out-date" type="date" value="${room.checkOutDate || ""}">
      </label>

      ${isFlexibleRentRoom(room) ? `
        <label>
          Pilihan sewa
          <select data-action="rent-scheme">
            ${rentSchemeOptions.map((option) => `<option value="${option}" ${room.rentScheme === option ? "selected" : ""}>${option}</option>`).join("")}
          </select>
        </label>
      ` : ""}

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

function renderReminders() {
  const reminders = buildReminders();

  reminderList.innerHTML = reminders.length ? reminders.map((reminder) => `
    <article class="reminder-item ${priorityClass(reminder.priority)}">
      <div class="reminder-title">
        <strong>${reminder.category}: ${reminder.title}</strong>
        <span class="priority">${reminder.priority}</span>
      </div>
      <small>${reminder.description}</small>
    </article>
  `).join("") : `<div class="empty-state">Tidak ada reminder prioritas saat ini.</div>`;
}

function buildReminders() {
  const reminders = [];

  activeMonthData().rooms.forEach((room) => {
    const dueDate = getPaymentDueDate(room);
    const dueIn = daysUntil(dueDate);
    const outIn = daysUntil(room.checkOutDate);

    if (dueDate && dueIn !== null && dueIn < 0 && room.paymentStatus !== "Lunas") {
      reminders.push({
        category: "Pembayaran",
        priority: "Tinggi",
        title: `Pembayaran ${room.id} lewat ${Math.abs(dueIn)} hari`,
        description: `Tanggal bayar periode ini: ${formatDate(dueDate)}.`
      });
    } else if (dueDate && dueIn !== null && dueIn >= 0 && dueIn <= 7) {
      reminders.push({
        category: "Pembayaran",
        priority: dueIn <= 2 ? "Tinggi" : "Sedang",
        title: `Pembayaran ${room.id} dalam ${dueIn} hari`,
        description: `Tanggal bayar periode ini: ${formatDate(dueDate)}.`
      });
    }

    if (room.checkOutDate && outIn !== null && outIn < 0) {
      reminders.push({
        category: "Proyek",
        priority: "Tinggi",
        title: `Check-out ${room.id} sudah lewat`,
        description: `Tanggal keluar: ${formatDate(room.checkOutDate)}. Cek status kamar dan serah terima.`
      });
    } else if (room.checkOutDate && outIn !== null && outIn >= 0 && outIn <= 14) {
      reminders.push({
        category: "Proyek",
        priority: outIn <= 3 ? "Tinggi" : "Sedang",
        title: `Check-out ${room.id} dalam ${outIn} hari`,
        description: `Tanggal keluar: ${formatDate(room.checkOutDate)}. Siapkan follow-up penghuni.`
      });
    }

    if (room.paymentStatus === "Telat") {
      reminders.push({
        category: "Pembayaran",
        priority: "Tinggi",
        title: `Kamar ${room.id} telat bayar`,
        description: "Hubungi penghuni dan catat janji bayar terbaru."
      });
    }

    if (room.paymentStatus === "Belum Bayar") {
      reminders.push({
        category: "Pembayaran",
        priority: "Sedang",
        title: `Kamar ${room.id} belum bayar`,
        description: "Follow-up pembayaran sebelum menjadi overdue."
      });
    }

    if (room.paymentStatus === "Cicil") {
      reminders.push({
        category: "Cicilan",
        priority: "Sedang",
        title: `Pantau cicilan ${room.id}`,
        description: "Cek nominal masuk dan update catatan cicilan."
      });
    }

    if (room.hasAc && room.acStatus === "Perlu Service") {
      reminders.push({
        category: "AC",
        priority: "Tinggi",
        title: `Service AC kamar ${room.id}`,
        description: "Jadwalkan teknisi AC untuk kamar ber-AC."
      });
    }

    if (room.hasAc && room.acStatus === "Service Terjadwal") {
      reminders.push({
        category: "AC",
        priority: "Rendah",
        title: `Konfirmasi service AC ${room.id}`,
        description: "Pastikan jadwal teknisi dan akses kamar aman."
      });
    }

    if (["Renovasi", "Upgrade", "Maintenance Ringan", "Blocked"].includes(room.roomStatus)) {
      reminders.push({
        category: "Proyek",
        priority: room.roomStatus === "Maintenance Ringan" ? "Rendah" : "Sedang",
        title: `${room.roomStatus} kamar ${room.id}`,
        description: "Pantau progres, kebutuhan bahan, dan target selesai."
      });
    }
  });

  activeMonthData().bookings.forEach((booking) => {
    const moveIn = daysUntil(booking.plannedCheckIn);
    const totalPaid = booking.dpAmount + booking.payment2Amount + booking.payment3Amount;

    if (booking.paymentStatus === "Cicil") {
      reminders.push({
        category: "Cicilan",
        priority: "Sedang",
        title: `Pantau cicilan booking ${booking.roomId}`,
        description: `${booking.prospectName} sudah bayar ${formatCurrency(totalPaid)}. Cek DP/Payment 2/Payment 3.`
      });
    }

    if (booking.plannedCheckIn && moveIn !== null && moveIn >= 0 && moveIn <= 14) {
      reminders.push({
        category: "Proyek",
        priority: moveIn <= 3 ? "Tinggi" : "Sedang",
        title: `Calon penghuni ${booking.roomId} masuk dalam ${moveIn} hari`,
        description: `${booking.prospectName} dijadwalkan check-in ${formatDate(booking.plannedCheckIn)}.`
      });
    }
  });

  const boughtItems = currentMonthExpenses().map((expense) => expense.item.toLowerCase());
  const missingRoutine = routineItems.filter((item) => !boughtItems.includes(item.toLowerCase()));

  if (missingRoutine.length) {
    reminders.push({
      category: "Belanja",
      priority: "Rendah",
      title: "Cek stok item rutin",
      description: `Belum tercatat bulan ini: ${missingRoutine.slice(0, 4).join(", ")}${missingRoutine.length > 4 ? ", ..." : ""}.`
    });
  }

  getExpenseTracking().forEach((tracking) => {
    if (tracking.tone === "danger") {
      reminders.push({
        category: "Belanja",
        priority: "Sedang",
        title: `${tracking.item} terlalu sering dibeli`,
        description: `${tracking.currentMonthCount} pembelian bulan ini. ${tracking.normalText}.`
      });
    }
  });

  const rank = { Tinggi: 1, Sedang: 2, Rendah: 3 };
  return reminders.sort((a, b) => rank[a.priority] - rank[b.priority]);
}

function priorityClass(priority) {
  return {
    Tinggi: "high",
    Sedang: "medium",
    Rendah: "low"
  }[priority];
}

function renderBookings() {
  const bookings = [...activeMonthData().bookings].sort((a, b) => {
    return (a.plannedCheckIn || "9999-12-31").localeCompare(b.plannedCheckIn || "9999-12-31");
  });

  bookingList.innerHTML = bookings.length ? bookings.map((booking) => {
    const totalPaid = booking.dpAmount + booking.payment2Amount + booking.payment3Amount;

    return `
      <article class="booking-item">
        <div>
          <strong>${booking.roomId} · ${escapeHtml(booking.prospectName)}</strong>
          <small>${booking.paymentStatus} · Check-in ${booking.plannedCheckIn ? formatDate(booking.plannedCheckIn) : "belum diisi"}</small>
          ${booking.note ? `<p>${escapeHtml(booking.note)}</p>` : ""}
        </div>
        <div class="booking-payment-stack">
          <span>DP ${formatCurrency(booking.dpAmount)}</span>
          <span>Payment 2 ${formatCurrency(booking.payment2Amount)}</span>
          <span>Payment 3 ${formatCurrency(booking.payment3Amount)}</span>
          <strong>Total ${formatCurrency(totalPaid)}</strong>
          <button class="small-button" type="button" data-delete-booking="${booking.id}">Hapus</button>
        </div>
      </article>
    `;
  }).join("") : `<div class="empty-state">Belum ada early booking untuk periode ini.</div>`;
}

function renderExpenses() {
  const expenses = [...activeMonthData().expenses].sort((a, b) => b.date.localeCompare(a.date));

  expenseList.innerHTML = expenses.length ? expenses.map((expense) => `
    <article class="expense-item">
      <div>
        <strong>${escapeHtml(expense.item)}</strong>
        <small>${expense.category} · ${formatDate(expense.date)}</small>
      </div>
      <div class="expense-amount">${formatCurrency(Number(expense.amount))}</div>
    </article>
  `).join("") : `<div class="empty-state">Belum ada belanja tercatat.</div>`;
}

function renderExpenseTracker() {
  const tracking = getExpenseTracking();

  expenseTracker.innerHTML = `
    <div class="tracker-heading">
      <div>
        <h3>Tracking Pembelian Rutin</h3>
        <p>Pakai ini untuk kontrol item yang kalau makin sering dibeli berarti makin boros.</p>
      </div>
    </div>
    <div class="tracker-grid">
      ${tracking.map((item) => `
        <article class="tracker-card ${item.tone}">
          <div class="tracker-card-top">
            <strong>${item.item}</strong>
            <span class="priority">${item.status}</span>
          </div>
          <div class="tracker-stat">
            <span>${item.currentMonthCount}</span>
            <small>pembelian bulan ini</small>
          </div>
          <p>${item.normalText}</p>
          <small>${item.lastPurchaseText} · ${item.averageText}</small>
        </article>
      `).join("")}
    </div>
  `;
}

function getExpenseTracking() {
  return expenseTrackingRules.map((rule) => {
    const purchases = allTrackedYearExpenses()
      .filter((expense) => matchesExpenseRule(expense.item, rule))
      .sort((a, b) => a.date.localeCompare(b.date));
    const monthPurchases = currentMonthExpenses().filter((expense) => matchesExpenseRule(expense.item, rule));
    const intervals = purchases.slice(1).map((purchase, index) => {
      return daysBetween(purchases[index].date, purchase.date);
    });
    const averageInterval = intervals.length
      ? Math.round(intervals.reduce((total, days) => total + days, 0) / intervals.length)
      : null;
    const lastPurchase = purchases[purchases.length - 1];
    const daysSinceLast = lastPurchase ? daysBetween(lastPurchase.date, selectedMonthEndDate()) : null;
    const tooFrequent = monthPurchases.length > rule.maxMonthlyPurchases || (averageInterval !== null && averageInterval < rule.expectedDays * 0.8);
    const overdue = daysSinceLast !== null && daysSinceLast > rule.expectedDays;
    const tone = tooFrequent ? "danger" : overdue ? "warning" : "safe";
    const status = tooFrequent ? "Boros" : overdue ? "Cek Stok" : "Normal";

    return {
      item: rule.item,
      normalText: rule.normalText,
      currentMonthCount: monthPurchases.length,
      averageText: averageInterval ? `Rata-rata ${averageInterval} hari sekali` : "Rata-rata belum cukup data",
      lastPurchaseText: lastPurchase ? `Terakhir ${daysSinceLast} hari lalu` : "Belum ada pembelian tercatat",
      status,
      tone
    };
  });
}

function matchesExpenseRule(item, rule) {
  const normalizedItem = item.toLowerCase().trim();
  return rule.aliases.some((alias) => normalizedItem.includes(alias));
}

function daysBetween(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  return Math.max(0, Math.round((end - start) / 86400000));
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

function selectedPeriodDate() {
  return new Date(`${monthSelect.value || defaultMonthKey}-01T00:00:00`);
}

function getPaymentDueDate(room) {
  if (!room.checkInDate) return "";
  const checkIn = new Date(`${room.checkInDate}T00:00:00`);
  const period = selectedPeriodDate();
  const lastDay = new Date(period.getFullYear(), period.getMonth() + 1, 0).getDate();
  const dueDay = Math.min(checkIn.getDate(), lastDay);
  return localDateString(new Date(period.getFullYear(), period.getMonth(), dueDay));
}

function daysUntil(dateValue) {
  if (!dateValue) return null;
  const target = new Date(`${dateValue}T00:00:00`);
  const today = new Date(`${localDateString(new Date())}T00:00:00`);
  return Math.round((target - today) / 86400000);
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
    if (action === "check-out-date") updated.checkOutDate = event.target.value;
    if (action === "rent-scheme") updated.rentScheme = event.target.value;
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
    id: crypto.randomUUID(),
    roomId: document.querySelector("#bookingRoomId").value,
    prospectName: document.querySelector("#bookingProspectName").value.trim(),
    paymentStatus: document.querySelector("#bookingPaymentStatus").value,
    dpAmount: Number(document.querySelector("#bookingDpAmount").value || 0),
    payment2Amount: Number(document.querySelector("#bookingPayment2Amount").value || 0),
    payment3Amount: Number(document.querySelector("#bookingPayment3Amount").value || 0),
    plannedCheckIn: document.querySelector("#bookingPlannedCheckIn").value,
    note: document.querySelector("#bookingNote").value.trim()
  };

  if (!booking.roomId || !booking.prospectName || !booking.plannedCheckIn) return;

  activeMonthData().bookings = [booking, ...activeMonthData().bookings];
  bookingForm.reset();
  bookingPlannedCheckIn.value = defaultExpenseDate();
  render();
});

bookingList.addEventListener("click", (event) => {
  const deleteButton = event.target.closest("[data-delete-booking]");
  if (!deleteButton) return;

  activeMonthData().bookings = activeMonthData().bookings.filter((booking) => booking.id !== deleteButton.dataset.deleteBooking);
  render();
});

shoppingForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = {
    id: crypto.randomUUID(),
    category: document.querySelector("#expenseCategory").value,
    item: document.querySelector("#expenseItem").value.trim(),
    amount: Number(document.querySelector("#expenseAmount").value),
    date: document.querySelector("#expenseDate").value
  };

  if (!formData.item || !formData.amount || !formData.date) return;

  activeMonthData().expenses = [formData, ...activeMonthData().expenses];
  shoppingForm.reset();
  updateExpenseDateForMonth();
  render();
});

monthSelect.addEventListener("change", () => {
  state.selectedMonth = monthSelect.value;
  state.selectedYear = getSelectedYear();
  activeMonthData();
  updateExpenseDateForMonth();
  bookingPlannedCheckIn.value = defaultExpenseDate();
  render();
});

yearSelect.addEventListener("change", () => {
  const selectedMonthNumber = (monthSelect.value || defaultMonthKey).slice(5, 7);
  renderMonthOptions(Number(yearSelect.value));
  monthSelect.value = `${yearSelect.value}-${selectedMonthNumber}`;
  state.selectedYear = Number(yearSelect.value);
  state.selectedMonth = monthSelect.value;
  activeMonthData();
  updateExpenseDateForMonth();
  bookingPlannedCheckIn.value = defaultExpenseDate();
  render();
});

resetDataBtn.addEventListener("click", () => {
  const confirmed = window.confirm("Reset semua perubahan status, catatan, dan belanja ke data awal?");
  if (!confirmed) return;

  localStorage.removeItem(STORAGE_KEY);
  state = loadState();
  selectedRoomId = state.selectedRoomId;
  renderYearOptions(getYearFromMonthKey(state.selectedMonth || defaultMonthKey));
  yearSelect.value = String(state.selectedYear || currentYear);
  renderMonthOptions(getSelectedYear());
  monthSelect.value = state.selectedMonth;
  updateExpenseDateForMonth();
  bookingPlannedCheckIn.value = defaultExpenseDate();
  render();
});

render();
loadRemoteState();
