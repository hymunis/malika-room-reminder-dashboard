const STORAGE_KEY = "malika-room-reminder-state-v1";

const paymentOptions = ["Lunas", "Belum Bayar", "Telat", "Cicil", "Dispensasi"];
const roomStatusOptions = ["Normal", "Kosong", "Renovasi", "Upgrade", "Maintenance Ringan", "Blocked"];
const acStatusOptions = ["Aman", "Perlu Service", "Service Terjadwal", "Selesai Service"];

const baseRooms = [
  { id: "A4", type: "Deluxe", scheme: "Tahunan", rate: 16500000, hasAc: true, paymentStatus: "Lunas", roomStatus: "Normal", acStatus: "Aman" },
  { id: "B4", type: "Deluxe", scheme: "Tahunan", rate: 16500000, hasAc: true, paymentStatus: "Telat", roomStatus: "Normal", acStatus: "Perlu Service" },
  { id: "A1", type: "Eksklusif", scheme: "Tahunan", rate: 14500000, hasAc: true, paymentStatus: "Belum Bayar", roomStatus: "Normal", acStatus: "Aman" },
  { id: "A5", type: "Eksklusif", scheme: "Tahunan", rate: 14500000, hasAc: true, paymentStatus: "Cicil", roomStatus: "Normal", acStatus: "Service Terjadwal" },
  { id: "B1", type: "Eksklusif", scheme: "Tahunan", rate: 14500000, hasAc: true, paymentStatus: "Lunas", roomStatus: "Normal", acStatus: "Aman" },
  { id: "B2", type: "Eksklusif", scheme: "Tahunan", rate: 14500000, hasAc: true, paymentStatus: "Dispensasi", roomStatus: "Normal", acStatus: "Aman" },
  { id: "B3", type: "Eksklusif", scheme: "Tahunan", rate: 14500000, hasAc: true, paymentStatus: "Lunas", roomStatus: "Maintenance Ringan", acStatus: "Aman" },
  { id: "B5", type: "Eksklusif", scheme: "Tahunan", rate: 14500000, hasAc: true, paymentStatus: "Lunas", roomStatus: "Normal", acStatus: "Aman" },
  { id: "B6", type: "Eksklusif", scheme: "Tahunan", rate: 14500000, hasAc: true, paymentStatus: "Lunas", roomStatus: "Upgrade", acStatus: "Aman" },
  { id: "A6", type: "Standard+", scheme: "Semesteran", rate: 6000000, hasAc: false, paymentStatus: "Lunas", roomStatus: "Normal" },
  { id: "A8", type: "Standard+", scheme: "Semesteran", rate: 6000000, hasAc: false, paymentStatus: "Belum Bayar", roomStatus: "Normal" },
  { id: "A2", type: "Standard", scheme: "Bulanan / Semesteran", rate: 800000, semesterRate: 5150000, hasAc: false, paymentStatus: "Lunas", roomStatus: "Normal" },
  { id: "A3", type: "Standard", scheme: "Bulanan / Semesteran", rate: 800000, semesterRate: 5150000, hasAc: false, paymentStatus: "Cicil", roomStatus: "Normal" },
  { id: "A7", type: "Standard", scheme: "Bulanan / Semesteran", rate: 800000, semesterRate: 5150000, hasAc: false, paymentStatus: "Lunas", roomStatus: "Kosong" },
  { id: "B7", type: "Standard", scheme: "Bulanan / Semesteran", rate: 800000, semesterRate: 5150000, hasAc: false, paymentStatus: "Lunas", roomStatus: "Renovasi" },
  { id: "B8", type: "Standard", scheme: "Bulanan / Semesteran", rate: 800000, semesterRate: 5150000, hasAc: false, paymentStatus: "Telat", roomStatus: "Normal" },
  { id: "B9", type: "Standard", scheme: "Bulanan / Semesteran", rate: 800000, semesterRate: 5150000, hasAc: false, paymentStatus: "Dispensasi", roomStatus: "Normal" }
];

let state = loadState();
let selectedRoomId = state.selectedRoomId || "A4";

const summaryGrid = document.querySelector("#summaryGrid");
const roomBoard = document.querySelector("#roomBoard");
const detailPanel = document.querySelector("#detailPanel");
const reminderList = document.querySelector("#reminderList");
const shoppingForm = document.querySelector("#shoppingForm");
const expenseList = document.querySelector("#expenseList");
const resetDataBtn = document.querySelector("#resetDataBtn");
const expenseDate = document.querySelector("#expenseDate");

expenseDate.value = new Date().toISOString().slice(0, 10);

function loadState() {
  const fallback = {
    rooms: baseRooms.map((room) => ({ ...room, notes: [] })),
    expenses: seedExpenses(),
    selectedRoomId: "A4"
  };

  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!stored || !Array.isArray(stored.rooms)) return fallback;

    return {
      rooms: baseRooms.map((baseRoom) => {
        const savedRoom = stored.rooms.find((room) => room.id === baseRoom.id) || {};
        return { ...baseRoom, ...savedRoom, notes: savedRoom.notes || [] };
      }),
      expenses: Array.isArray(stored.expenses) ? stored.expenses : fallback.expenses,
      selectedRoomId: stored.selectedRoomId || fallback.selectedRoomId
    };
  } catch {
    return fallback;
  }
}

function saveState() {
  state.selectedRoomId = selectedRoomId;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function seedExpenses() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = today.getFullYear();

  return [
    { id: crypto.randomUUID(), category: "Utilitas", item: "Listrik", amount: 450000, date: `${year}-${month}-05` },
    { id: crypto.randomUUID(), category: "Kebersihan", item: "Kresek sampah", amount: 35000, date: `${year}-${month}-08` }
  ];
}

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(value);
}

function rateLabel(room) {
  if (room.semesterRate) {
    return `${formatCurrency(room.rate)}/bulan atau ${formatCurrency(room.semesterRate)}/semester`;
  }

  return `${formatCurrency(room.rate)}/${room.scheme.toLowerCase().replace("an", "")}`;
}

function currentMonthExpenses() {
  const now = new Date();
  return state.expenses.filter((expense) => {
    const date = new Date(`${expense.date}T00:00:00`);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
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
  renderExpenses();
  saveState();
}

function renderSummary() {
  const paymentFollowUp = state.rooms.filter((room) => ["Belum Bayar", "Telat", "Dispensasi"].includes(room.paymentStatus)).length;
  const installments = state.rooms.filter((room) => room.paymentStatus === "Cicil").length;
  const acService = state.rooms.filter((room) => room.hasAc && ["Perlu Service", "Service Terjadwal"].includes(room.acStatus)).length;
  const projects = state.rooms.filter((room) => ["Renovasi", "Upgrade", "Maintenance Ringan"].includes(room.roomStatus)).length;
  const expensesTotal = currentMonthExpenses().reduce((total, expense) => total + Number(expense.amount), 0);

  const cards = [
    { label: "Total kamar", value: state.rooms.length, hint: "Kamar terdaftar" },
    { label: "Pembayaran perlu follow-up", value: paymentFollowUp, hint: "Belum bayar, telat, dispensasi" },
    { label: "Cicilan aktif", value: installments, hint: "Perlu pantau jadwal cicil" },
    { label: "AC perlu service", value: acService, hint: "Hanya kamar Deluxe & Eksklusif" },
    { label: "Kamar renovasi/upgrade", value: projects, hint: "Termasuk maintenance ringan" },
    { label: "Belanja bulan ini", value: formatCurrency(expensesTotal), hint: `${currentMonthExpenses().length} transaksi` }
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
  roomBoard.innerHTML = state.rooms.map((room) => {
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
          <span>Skema: <strong>${room.scheme}</strong></span>
          <span>Tarif: <strong>${rateLabel(room)}</strong></span>
        </div>
        <div class="pill-row">
          <span class="pill ${pillTone(room.paymentStatus)}">${room.paymentStatus}</span>
          <span class="pill ${pillTone(room.roomStatus)}">${room.roomStatus}</span>
          <span class="pill ${pillTone(room.acStatus)}">${acText}</span>
        </div>
      </button>
    `;
  }).join("");
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
  const room = state.rooms.find((item) => item.id === selectedRoomId);
  if (!room) return;

  detailPanel.innerHTML = `
    <div class="detail-header">
      <div>
        <div class="detail-room">${room.id}</div>
        <p>${room.type} · ${room.scheme}</p>
      </div>
      <span class="pill ${pillTone(room.paymentStatus)}">${room.paymentStatus}</span>
    </div>

    <div class="detail-grid">
      <div class="info-tile">
        <span>Tarif</span>
        <strong>${rateLabel(room)}</strong>
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

  state.rooms.forEach((room) => {
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

  const routineItems = ["Listrik", "Sampah", "Gas", "Air galon", "Kresek sampah", "Pembersih toilet", "Sabun cuci tangan", "Cairan pel"];
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

function renderExpenses() {
  const expenses = [...state.expenses].sort((a, b) => b.date.localeCompare(a.date));

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

function formatDate(dateValue) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(`${dateValue}T00:00:00`));
}

function updateSelectedRoom(updater) {
  state.rooms = state.rooms.map((room) => {
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
      { text, date: formatDate(new Date().toISOString().slice(0, 10)) },
      ...(room.notes || [])
    ]
  }));
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

  state.expenses = [formData, ...state.expenses];
  shoppingForm.reset();
  expenseDate.value = new Date().toISOString().slice(0, 10);
  render();
});

resetDataBtn.addEventListener("click", () => {
  const confirmed = window.confirm("Reset semua perubahan status, catatan, dan belanja ke data awal?");
  if (!confirmed) return;

  localStorage.removeItem(STORAGE_KEY);
  state = loadState();
  selectedRoomId = state.selectedRoomId;
  render();
});

render();
