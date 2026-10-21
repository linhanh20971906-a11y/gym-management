
const API_BASE = "/api";
const MEMBERS_API = `${API_BASE}/members`;
const PLANS_API = `${API_BASE}/plans`;
const TRAINERS_API = `${API_BASE}/trainers`;
const SCHEDULES_API = `${API_BASE}/schedules`;

const memberTableBody = document.getElementById("memberTableBody");
const addMemberBtn = document.getElementById("addMemberBtn");
const addTrainerBtn = document.getElementById("addTrainerBtn");
const trainerList = document.getElementById("trainerList");

const addScheduleBtn = document.getElementById("addScheduleBtn");
const scheduleTableBody = document.getElementById("scheduleTableBody");
const scheduleFormPanel = document.getElementById("scheduleFormPanel");
const scheduleForm = document.getElementById("scheduleForm");
const scheduleFormTitle = document.getElementById("scheduleFormTitle");
const scheduleMember = document.getElementById("scheduleMember");
const scheduleTrainer = document.getElementById("scheduleTrainer");
const scheduleDate = document.getElementById("scheduleDate");
const scheduleDuration = document.getElementById("scheduleDuration");
const scheduleStatus = document.getElementById("scheduleStatus");
const scheduleNotes = document.getElementById("scheduleNotes");
const scheduleMessage = document.getElementById("scheduleMessage");
const saveScheduleBtn = document.getElementById("saveScheduleBtn");
const cancelScheduleBtn = document.getElementById("cancelScheduleBtn");

let editingScheduleId = null;

// ========================================
// HÀM HỖ TRỢ
// ========================================


async function apiRequest(url, options = {}) {
  const token = sessionStorage.getItem("gym_access_token");

  if (!token) {
    window.location.replace("./login.html");
    throw new Error("Bạn chưa đăng nhập");
  }

  let response;

  try {
    response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
        Authorization: `Bearer ${token}`
      }
    });
  } catch (error) {
    throw new Error(
      "Không kết nối được Backend. Kiểm tra Node.js cổng 5000."
    );
  }

  if (response.status === 401 || response.status === 403) {
    sessionStorage.removeItem("gym_access_token");
    window.location.replace("./login.html");
    throw new Error("Phiên đăng nhập đã hết hạn hoặc không hợp lệ");
  }

  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    throw new Error(`Phản hồi không hợp lệ: HTTP ${response.status}`);
  }

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Có lỗi xảy ra");
  }

  return result;
}

function formatMoney(amount) {
  return Number(amount).toLocaleString("vi-VN") + " VNĐ";
}

function createButton(label, onClick, isDelete = false) {
  const button = document.createElement("button");

  button.type = "button";
  button.textContent = label;

  if (isDelete) {
    button.classList.add("btn-delete");
  }

  button.addEventListener("click", onClick);

  return button;
}



function createCell(value) {
  const cell = document.createElement("td");
  cell.textContent = value ?? "";
  return cell;
}

function showTableMessage(tbody, message, columns) {
  if (!tbody) return;

  tbody.innerHTML = "";

  const row = document.createElement("tr");
  const cell = createCell(message);
  cell.colSpan = columns;

  row.appendChild(cell);
  tbody.appendChild(row);
}

function askText(message, defaultValue = "") {
  const result = prompt(message, defaultValue);
  return result === null ? null : result.trim();
}

function isValidEmail(email) {
  return !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ========================================
// QUẢN LÝ HỘI VIÊN
// ========================================

async function loadMembers() {
  if (!memberTableBody) return;

  showTableMessage(memberTableBody, "Đang tải hội viên...", 6);

  try {
    const result = await apiRequest(MEMBERS_API);
const members = result.data || [];
const keyword = (
  document.getElementById("searchMember")?.value || ""
).trim().toLowerCase();

const filteredMembers = members.filter((member) => {
  return (
    String(member.full_name || "").toLowerCase().includes(keyword) ||
    String(member.phone || "").toLowerCase().includes(keyword) ||
    String(member.email || "").toLowerCase().includes(keyword)
  );
});

    memberTableBody.innerHTML = "";

    if (!filteredMembers.length) {
      showTableMessage(memberTableBody, "Chưa có hội viên nào.", 6);
      return;
    }

   filteredMembers.forEach((member) => {
      const row = document.createElement("tr");

      [
        member.id,
        member.full_name,
        member.phone,
        member.email || "Chưa có",
        member.status === "active"
          ? "Đang hoạt động"
          : "Không hoạt động"
      ].forEach((value) => {
        row.appendChild(createCell(value));
      });

      const actions = document.createElement("td");

      actions.append(
        createButton("Sửa", () => editMember(member)),
        createButton("Xóa", () => deleteMember(member.id), true)
      );

      row.appendChild(actions);
      memberTableBody.appendChild(row);
    });
  } catch (error) {
    showTableMessage(
      memberTableBody,
      "Lỗi tải hội viên: " + error.message,
      6
    );
  }
}

async function addMember() {
  const full_name = askText("Nhập họ tên hội viên:");
  if (full_name === null) return;

  const phone = askText("Nhập số điện thoại:");
  if (phone === null) return;

  const email = askText("Nhập email (có thể bỏ trống):");
  if (email === null) return;

  if (!full_name || !phone) {
    alert("Họ tên và số điện thoại không được để trống!");
    return;
  }

  if (!isValidEmail(email)) {
    alert("Email không hợp lệ!");
    return;
  }

  try {
    await apiRequest(MEMBERS_API, {
      method: "POST",
      body: JSON.stringify({
        full_name,
        phone,
        email: email || null,
        gender: null,
        plan_id: null
      })
    });

    alert("Thêm hội viên thành công!");
    await loadMembers();
  } catch (error) {
    alert("Lỗi thêm hội viên: " + error.message);
  }
}

async function editMember(member) {
  const full_name = askText("Sửa họ tên:", member.full_name);
  if (full_name === null) return;

  const phone = askText("Sửa số điện thoại:", member.phone);
  if (phone === null) return;

  const email = askText("Sửa email:", member.email || "");
  if (email === null) return;

  if (!full_name || !phone) {
    alert("Họ tên và số điện thoại không được để trống!");
    return;
  }

  if (!isValidEmail(email)) {
    alert("Email không hợp lệ!");
    return;
  }

  try {
    await apiRequest(`${MEMBERS_API}/${member.id}`, {
      method: "PUT",
      body: JSON.stringify({
        full_name,
        phone,
        email: email || null,
        gender: member.gender,
        plan_id: member.plan_id
      })
    });

    alert("Cập nhật hội viên thành công!");
    await loadMembers();
  } catch (error) {
    alert("Lỗi sửa hội viên: " + error.message);
  }
}

async function deleteMember(id) {
  if (!confirm(`Bạn có chắc muốn xóa hội viên ID ${id}?`)) {
    return;
  }

  try {
    await apiRequest(`${MEMBERS_API}/${id}`, {
      method: "DELETE"
    });

    alert("Xóa hội viên thành công!");
    await loadMembers();
  } catch (error) {
    alert("Lỗi xóa hội viên: " + error.message);
  }
}

// ========================================
// DANH SÁCH GÓI TẬP
// ========================================

async function loadPlans() {
  const container = document.getElementById("plansContainer");
  if (!container) return;

  container.textContent = "Đang tải gói tập...";

  try {
    const result = await apiRequest(PLANS_API);
    const plans = result.data || [];

    container.innerHTML = "";

    if (!plans.length) {
      container.textContent = "Chưa có gói tập nào.";
      return;
    }

    plans.forEach((plan) => {
      const card = document.createElement("div");
      card.className = "plan-card";

      const title = document.createElement("h3");
      title.textContent = plan.name;

      const duration = document.createElement("p");
      duration.textContent =
        `Thời hạn: ${plan.duration_months} tháng`;

      const price = document.createElement("p");
      price.className = "plan-price";
      price.textContent = formatMoney(plan.price);

      const description = document.createElement("p");
      description.textContent = plan.description || "";

      card.append(title, duration, price, description);
      container.appendChild(card);
    });
  } catch (error) {
    container.textContent = "Lỗi tải gói tập: " + error.message;
  }
}

// ========================================
// QUẢN LÝ HUẤN LUYỆN VIÊN
// ========================================

async function loadTrainers() {
  if (!trainerList) return;

  trainerList.textContent = "Đang tải huấn luyện viên...";

  try {
    const result = await apiRequest(TRAINERS_API);
    const trainers = result.data || [];

    trainerList.innerHTML = "";

    if (!trainers.length) {
      trainerList.textContent = "Chưa có huấn luyện viên nào.";
      return;
    }

    trainers.forEach((trainer) => {
      const card = document.createElement("div");
      card.className = "trainer-card";

      const title = document.createElement("h3");
      title.textContent = trainer.full_name;
      card.appendChild(title);

      const info = [
        `Chuyên môn: ${trainer.specialty || "Chưa cập nhật"}`,
        `Kinh nghiệm: ${trainer.experience_years ?? 0} năm`,
        `SĐT: ${trainer.phone || "Chưa cập nhật"}`,
        `Email: ${trainer.email || "Chưa cập nhật"}`,
        trainer.status === "active"
          ? "Trạng thái: Đang hoạt động"
          : "Trạng thái: Không hoạt động"
      ];

      info.forEach((value) => {
        const p = document.createElement("p");
        p.textContent = value;
        card.appendChild(p);
      });

      const actions = document.createElement("div");
      actions.className = "trainer-actions";

      actions.append(
        createButton("Sửa", () => editTrainer(trainer)),
        createButton("Xóa", () => deleteTrainer(trainer.id), true)
      );

      card.appendChild(actions);
      trainerList.appendChild(card);
    });
  } catch (error) {
    trainerList.textContent =
      "Lỗi tải huấn luyện viên: " + error.message;
  }
}

function validateTrainer(data) {
  if (!data.full_name) {
    alert("Tên huấn luyện viên không được để trống!");
    return false;
  }

  if (
    !Number.isInteger(data.experience_years) ||
    data.experience_years < 0
  ) {
    alert("Kinh nghiệm phải là số nguyên từ 0 trở lên!");
    return false;
  }

  if (!isValidEmail(data.email)) {
    alert("Email không hợp lệ!");
    return false;
  }

  return true;
}

async function addTrainer() {
  const full_name = askText("Nhập họ tên PT:");
  if (full_name === null) return;

  const phone = askText("Nhập số điện thoại:");
  if (phone === null) return;

  const email = askText("Nhập email:");
  if (email === null) return;

  const specialty = askText("Nhập chuyên môn:");
  if (specialty === null) return;

  const experience = askText("Số năm kinh nghiệm:", "0");
  if (experience === null) return;

  const data = {
    full_name,
    phone: phone || null,
    email: email || null,
    specialty: specialty || null,
    experience_years:
      experience === "" ? NaN : Number(experience),
    status: "active"
  };

  if (!validateTrainer(data)) return;

  try {
    await apiRequest(TRAINERS_API, {
      method: "POST",
      body: JSON.stringify(data)
    });

    alert("Thêm huấn luyện viên thành công!");
    await loadTrainers();
  } catch (error) {
    alert("Lỗi thêm PT: " + error.message);
  }
}

async function editTrainer(trainer) {
  const full_name = askText(
    "Sửa họ tên:",
    trainer.full_name
  );
  if (full_name === null) return;

  const phone = askText("Sửa SĐT:", trainer.phone || "");
  if (phone === null) return;

  const email = askText("Sửa email:", trainer.email || "");
  if (email === null) return;

  const specialty = askText(
    "Sửa chuyên môn:",
    trainer.specialty || ""
  );
  if (specialty === null) return;

  const experience = askText(
    "Sửa kinh nghiệm:",
    String(trainer.experience_years ?? 0)
  );
  if (experience === null) return;

  const status = askText(
    "Trạng thái (active/inactive):",
    trainer.status || "active"
  );
  if (status === null) return;

  if (!["active", "inactive"].includes(status)) {
    alert("Trạng thái không hợp lệ!");
    return;
  }

  const data = {
    full_name,
    phone: phone || null,
    email: email || null,
    specialty: specialty || null,
    experience_years:
      experience === "" ? NaN : Number(experience),
    status
  };

  if (!validateTrainer(data)) return;

  try {
    await apiRequest(`${TRAINERS_API}/${trainer.id}`, {
      method: "PUT",
      body: JSON.stringify(data)
    });

    alert("Cập nhật PT thành công!");
    await loadTrainers();
  } catch (error) {
    alert("Lỗi sửa PT: " + error.message);
  }
}

async function deleteTrainer(id) {
  if (!confirm(`Bạn có chắc muốn xóa PT ID ${id}?`)) {
    return;
  }

  try {
    await apiRequest(`${TRAINERS_API}/${id}`, {
      method: "DELETE"
    });

    alert("Xóa PT thành công!");
    await loadTrainers();
  } catch (error) {
    alert("Lỗi xóa PT: " + error.message);
  }
}

// ========================================
// QUẢN LÝ LỊCH TẬP
// ========================================

function statusLabel(status) {
  const labels = {
    scheduled: "Đã lên lịch",
    completed: "Đã hoàn thành",
    cancelled: "Đã hủy"
  };

  return labels[status] || status;
}

function formatWorkoutDate(value) {
  if (!value) return "";

  const text = String(value).replace("T", " ");
  const match = text.match(
    /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/
  );

  if (!match) return text;

  return `${match[3]}/${match[2]}/${match[1]} ${match[4]}:${match[5]}`;
}

function toDateTimeLocal(value) {
  if (!value) return "";

  const text = String(value).replace(" ", "T");
  return text.slice(0, 16);
}

function showScheduleMessage(message, type = "success") {
  if (!scheduleMessage) return;

  scheduleMessage.textContent = message;
  scheduleMessage.className = `message ${type}`;
  scheduleMessage.hidden = false;
}

function clearScheduleMessage() {
  if (!scheduleMessage) return;

  scheduleMessage.textContent = "";
  scheduleMessage.hidden = true;
}

async function loadSchedules() {
  if (!scheduleTableBody) return;

  showTableMessage(
    scheduleTableBody,
    "Đang tải danh sách lịch tập...",
    8
  );

  try {
    const result = await apiRequest(SCHEDULES_API);
    const schedules = result.data || [];

const selectedStatus =
  document.getElementById("filterScheduleStatus")?.value || "all";

const filteredSchedules = schedules.filter((schedule) => {
  return (
    selectedStatus === "all" ||
    schedule.status === selectedStatus
  );
});

    scheduleTableBody.innerHTML = "";

   if (!filteredSchedules.length) {
  showTableMessage(
    scheduleTableBody,
    "Chưa có lịch tập nào.",
    8
  );
  return;
}

    filteredSchedules.forEach((schedule) => {
      const row = document.createElement("tr");

      [
        schedule.id,
        schedule.member_name || `Hội viên #${schedule.member_id}`,
        schedule.trainer_name || `PT #${schedule.trainer_id}`,
        formatWorkoutDate(schedule.workout_date),
        `${schedule.duration_minutes} phút`
      ].forEach((value) => {
        row.appendChild(createCell(value));
      });

      const statusCell = document.createElement("td");
      const badge = document.createElement("span");

      badge.className =
        `status-badge status-${schedule.status}`;

      badge.textContent = statusLabel(schedule.status);
      statusCell.appendChild(badge);
      row.appendChild(statusCell);

      row.appendChild(
        createCell(schedule.notes || "Không có")
      );

      const actions = document.createElement("td");

      actions.append(
        createButton(
          "Sửa",
          () => openScheduleForm(schedule)
        ),
        createButton(
          "Xóa",
          () => deleteSchedule(schedule.id),
          true
        )
      );

      row.appendChild(actions);
      scheduleTableBody.appendChild(row);
    });
  } catch (error) {
    showTableMessage(
      scheduleTableBody,
      "Lỗi tải lịch tập: " + error.message,
      8
    );
  }
}

// Tải danh sách hội viên và PT vào ô chọn
async function loadScheduleSelects() {
  const [memberResult, trainerResult] = await Promise.all([
    apiRequest(MEMBERS_API),
    apiRequest(TRAINERS_API)
  ]);

  const members = memberResult.data || [];
  const trainers = trainerResult.data || [];

  scheduleMember.innerHTML =
    '<option value="">-- Chọn hội viên --</option>';

  scheduleTrainer.innerHTML =
    '<option value="">-- Chọn PT --</option>';

  members.forEach((member) => {
    const option = document.createElement("option");
    option.value = member.id;
    option.textContent =
      `${member.id} - ${member.full_name}`;

    scheduleMember.appendChild(option);
  });

  trainers.forEach((trainer) => {
    const option = document.createElement("option");
    option.value = trainer.id;
    option.textContent =
      `${trainer.id} - ${trainer.full_name}`;

    scheduleTrainer.appendChild(option);
  });

  if (!members.length || !trainers.length) {
    throw new Error(
      "Cần có ít nhất một hội viên và một PT để đặt lịch."
    );
  }
}

// Mở form thêm hoặc sửa
async function openScheduleForm(schedule = null) {
  clearScheduleMessage();

  editingScheduleId = null;
  scheduleForm.reset();
  scheduleDuration.value = 60;
  scheduleStatus.value = "scheduled";

  scheduleFormPanel.hidden = false;
  scheduleFormTitle.textContent = "Đang tải dữ liệu...";
  saveScheduleBtn.disabled = true;

  try {
    await loadScheduleSelects();

    if (schedule) {
      editingScheduleId = schedule.id;

      scheduleFormTitle.textContent =
        `Sửa lịch tập #${schedule.id}`;

      scheduleMember.value = String(schedule.member_id);
      scheduleTrainer.value = String(schedule.trainer_id);
      scheduleDate.value = toDateTimeLocal(
        schedule.workout_date
      );
      scheduleDuration.value = schedule.duration_minutes;
      scheduleStatus.value = schedule.status;
      scheduleNotes.value = schedule.notes || "";
    } else {
      scheduleFormTitle.textContent = "Thêm lịch tập mới";
    }

    saveScheduleBtn.disabled = false;
    scheduleFormPanel.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  } catch (error) {
    scheduleFormPanel.hidden = true;
    showScheduleMessage(
      "Không thể mở biểu mẫu: " + error.message,
      "error"
    );
  }
}

function closeScheduleForm() {
  scheduleFormPanel.hidden = true;
  scheduleForm.reset();
  editingScheduleId = null;
  saveScheduleBtn.disabled = false;
}

// Kiểm tra ngày giờ hợp lệ
function isValidWorkoutDate(value) {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/
  );

  if (!match) return false;

  const [, yy, mm, dd, hh, mi] = match;
  const year = Number(yy);
  const month = Number(mm);
  const day = Number(dd);
  const hour = Number(hh);
  const minute = Number(mi);

  const checked = new Date(
    Date.UTC(year, month - 1, day)
  );

  return (
    year >= 1000 &&
    checked.getUTCFullYear() === year &&
    checked.getUTCMonth() + 1 === month &&
    checked.getUTCDate() === day &&
    hour >= 0 &&
    hour <= 23 &&
    minute >= 0 &&
    minute <= 59
  );
}

// Lưu dữ liệu từ form vào MySQL
async function saveSchedule(event) {
  event.preventDefault();
  clearScheduleMessage();

  const member_id = Number(scheduleMember.value);
  const trainer_id = Number(scheduleTrainer.value);
  const workout_date = scheduleDate.value;
  const duration_minutes = Number(scheduleDuration.value);
  const status = scheduleStatus.value;
  const notes = scheduleNotes.value.trim();

  if (
    !Number.isInteger(member_id) ||
    member_id <= 0 ||
    !Number.isInteger(trainer_id) ||
    trainer_id <= 0
  ) {
    showScheduleMessage(
      "Vui lòng chọn hội viên và huấn luyện viên.",
      "error"
    );
    return;
  }

  if (!isValidWorkoutDate(workout_date)) {
    showScheduleMessage(
      "Ngày và giờ tập không hợp lệ.",
      "error"
    );
    return;
  }

  if (
    !scheduleDuration.value.trim() ||
    !Number.isInteger(duration_minutes) ||
    duration_minutes <= 0
  ) {
    showScheduleMessage(
      "Thời lượng phải là số nguyên lớn hơn 0.",
      "error"
    );
    return;
  }

  if (!["scheduled", "completed", "cancelled"].includes(status)) {
    showScheduleMessage(
      "Trạng thái lịch tập không hợp lệ.",
      "error"
    );
    return;
  }

  const data = {
    member_id,
    trainer_id,
    workout_date,
    duration_minutes,
    status,
    notes: notes || null
  };

  const isEditing = editingScheduleId !== null;

  const url = isEditing
    ? `${SCHEDULES_API}/${editingScheduleId}`
    : SCHEDULES_API;

  saveScheduleBtn.disabled = true;

  try {
    await apiRequest(url, {
      method: isEditing ? "PUT" : "POST",
      body: JSON.stringify(data)
    });

    closeScheduleForm();

    showScheduleMessage(
      isEditing
        ? "Cập nhật lịch tập thành công!"
        : "Thêm lịch tập thành công!",
      "success"
    );

    await loadSchedules();
  } catch (error) {
    showScheduleMessage(
      "Không thể lưu lịch tập: " + error.message,
      "error"
    );
  } finally {
    saveScheduleBtn.disabled = false;
  }
}

// Xóa lịch tập
async function deleteSchedule(id) {
  if (!confirm(`Bạn có chắc muốn xóa lịch tập ID ${id}?`)) {
    return;
  }

  clearScheduleMessage();

  try {
    await apiRequest(`${SCHEDULES_API}/${id}`, {
      method: "DELETE"
    });

    if (editingScheduleId === id) {
      closeScheduleForm();
    }

    showScheduleMessage(
      "Xóa lịch tập thành công!",
      "success"
    );

    await loadSchedules();
  } catch (error) {
    showScheduleMessage(
      "Lỗi xóa lịch tập: " + error.message,
      "error"
    );
  }
}

// ========================================
// KHỞI TẠO
// ========================================

if (addMemberBtn) {
  addMemberBtn.addEventListener("click", addMember);
}

if (addTrainerBtn) {
  addTrainerBtn.addEventListener("click", addTrainer);
}

if (addScheduleBtn) {
  addScheduleBtn.addEventListener("click", () => {
    openScheduleForm();
  });
}

if (cancelScheduleBtn) {
  cancelScheduleBtn.addEventListener(
    "click",
    closeScheduleForm
  );
}

if (scheduleForm) {
  scheduleForm.addEventListener("submit", saveSchedule);
}

loadMembers();
loadPlans();
loadTrainers();
loadSchedules();

// ========================================
// DASHBOARD THỐNG KÊ
// ========================================

let scheduleChart = null;

async function loadDashboard() {
  const errorElement = document.getElementById("dashboardError");

  if (!document.getElementById("totalMembers")) {
    return;
  }

  try {
    const [
      membersResult,
      trainersResult,
      plansResult,
      schedulesResult
    ] = await Promise.all([
      apiRequest(MEMBERS_API),
      apiRequest(TRAINERS_API),
      apiRequest(PLANS_API),
      apiRequest(SCHEDULES_API)
    ]);

    const members = membersResult.data || [];
    const trainers = trainersResult.data || [];
    const plans = plansResult.data || [];
    const schedules = schedulesResult.data || [];

    document.getElementById("totalMembers").textContent =
      members.length;

    document.getElementById("totalTrainers").textContent =
      trainers.length;

    document.getElementById("totalPlans").textContent =
      plans.length;

    document.getElementById("totalSchedules").textContent =
      schedules.length;

    const scheduled = schedules.filter(
      (item) => item.status === "scheduled"
    ).length;

    const completed = schedules.filter(
      (item) => item.status === "completed"
    ).length;

    const cancelled = schedules.filter(
      (item) => item.status === "cancelled"
    ).length;

   
console.log("Dashboard chart:", { scheduled, completed, cancelled });

renderScheduleChart(scheduled, completed, cancelled);


    if (errorElement) {
      errorElement.hidden = true;
    }
  } catch (error) {
    console.error("Dashboard error:", error);

    if (errorElement) {
      errorElement.textContent =
        "Không tải được Dashboard: " + error.message;
      errorElement.hidden = false;
    }
  }
}

function renderScheduleChart(scheduled, completed, cancelled) {
  const canvas = document.getElementById("scheduleChart");

  if (!canvas) return;

  if (typeof Chart === "undefined") {
    throw new Error("Không tải được thư viện Chart.js");
  }

  if (scheduleChart) {
    scheduleChart.destroy();
  }

  scheduleChart = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: [
        "Đã lên lịch",
        "Đã hoàn thành",
        "Đã hủy"
      ],
      datasets: [{
        data: [scheduled, completed, cancelled],
        backgroundColor: [
          "#2563eb",
          "#16a34a",
          "#dc2626"
        ],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: "bottom"
        }
      }
    }
  });
}

loadDashboard();
const searchMemberInput = document.getElementById("searchMember");

if (searchMemberInput) {
  searchMemberInput.addEventListener("input", loadMembers);
}

const filterScheduleStatus = document.getElementById(
  "filterScheduleStatus"
);

if (filterScheduleStatus) {
  filterScheduleStatus.addEventListener("change", loadSchedules);
}
