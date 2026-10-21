
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const pool = require("./db");
const authRouter = require("./auth");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API đăng nhập không yêu cầu token
app.use("/api/auth", authRouter);

// ========================================
// HÀM HỖ TRỢ
// ========================================

function validId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0;
}

function sendError(res, error, message) {
  console.error(message, error.message);

  if (error.code === "ER_NO_REFERENCED_ROW_2") {
    return res.status(400).json({
      status: "error",
      message: "Dữ liệu liên kết không tồn tại"
    });
  }

  if (error.code === "ER_ROW_IS_REFERENCED_2") {
    return res.status(409).json({
      status: "error",
      message: "Không thể xóa vì dữ liệu đang được sử dụng"
    });
  }

  if (error.code === "ER_DUP_ENTRY") {
    return res.status(409).json({
      status: "error",
      message: "Dữ liệu đã tồn tại"
    });
  }

  return res.status(500).json({
    status: "error",
    message
  });
}

// ========================================
// KIỂM TRA BACKEND
// ========================================

app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "Welcome to Gym Management API"
  });
});

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      status: "OK",
      message: "Gym Management Backend is running",
      database: "connected"
    });
  } catch (error) {
    sendError(res, error, "Không thể kết nối MySQL");
  }
});

// ========================================
// MIDDLEWARE KIỂM TRA JWT VÀ QUYỀN ADMIN
// ========================================

function requireAdmin(req, res, next) {
  const authorization = req.headers.authorization || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return res.status(401).json({
      status: "error",
      message: "Bạn chưa đăng nhập hoặc chưa cung cấp token"
    });
  }

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET chưa được cấu hình");

    return res.status(500).json({
      status: "error",
      message: "Máy chủ chưa cấu hình xác thực"
    });
  }

  try {
    const payload = jwt.verify(
      match[1],
      process.env.JWT_SECRET,
      { algorithms: ["HS256"] }
    );

    if (
      payload.role !== "admin" ||
      payload.email !== process.env.ADMIN_EMAIL
    ) {
      return res.status(403).json({
        status: "error",
        message: "Tài khoản không có quyền quản trị"
      });
    }

    req.admin = {
      email: payload.email,
      role: payload.role
    };

    next();
  } catch (error) {
    return res.status(401).json({
      status: "error",
      message: "Token không hợp lệ hoặc đã hết hạn"
    });
  }
}

// Bảo vệ tất cả API quản lý
app.use(
  [
    "/api/members",
    "/api/plans",
    "/api/trainers",
    "/api/schedules"
  ],
  requireAdmin
);

// ========================================
// QUẢN LÝ HỘI VIÊN
// ========================================

// Lấy danh sách hội viên
app.get("/api/members", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM members ORDER BY id ASC"
    );

    res.json({
      status: "success",
      total: rows.length,
      data: rows
    });
  } catch (error) {
    sendError(res, error, "Không thể lấy danh sách hội viên");
  }
});

// Thêm hội viên
app.post("/api/members", async (req, res) => {
  try {
    const {
      full_name,
      phone,
      email,
      gender,
      plan_id
    } = req.body;

    if (
      typeof full_name !== "string" ||
      !full_name.trim() ||
      typeof phone !== "string" ||
      !phone.trim()
    ) {
      return res.status(400).json({
        status: "error",
        message: "Vui lòng nhập họ tên và số điện thoại"
      });
    }

    const [result] = await pool.query(
      `INSERT INTO members
       (full_name, phone, email, gender, plan_id, join_date, status)
       VALUES (?, ?, ?, ?, ?, CURDATE(), 'active')`,
      [
        full_name.trim(),
        phone.trim(),
        email || null,
        gender || null,
        plan_id || null
      ]
    );

    res.status(201).json({
      status: "success",
      message: "Thêm hội viên thành công",
      member_id: result.insertId
    });
  } catch (error) {
    sendError(res, error, "Không thể thêm hội viên");
  }
});

// Sửa hội viên
app.put("/api/members/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!validId(id)) {
      return res.status(400).json({
        status: "error",
        message: "ID hội viên không hợp lệ"
      });
    }

    const {
      full_name,
      phone,
      email,
      gender,
      plan_id
    } = req.body;

    if (
      typeof full_name !== "string" ||
      !full_name.trim() ||
      typeof phone !== "string" ||
      !phone.trim()
    ) {
      return res.status(400).json({
        status: "error",
        message: "Vui lòng nhập họ tên và số điện thoại"
      });
    }

    const [result] = await pool.query(
      `UPDATE members
       SET full_name = ?,
           phone = ?,
           email = ?,
           gender = ?,
           plan_id = ?
       WHERE id = ?`,
      [
        full_name.trim(),
        phone.trim(),
        email || null,
        gender || null,
        plan_id || null,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: "error",
        message: "Không tìm thấy hội viên"
      });
    }

    res.json({
      status: "success",
      message: "Cập nhật hội viên thành công"
    });
  } catch (error) {
    sendError(res, error, "Không thể cập nhật hội viên");
  }
});

// Xóa hội viên
app.delete("/api/members/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!validId(id)) {
      return res.status(400).json({
        status: "error",
        message: "ID hội viên không hợp lệ"
      });
    }

    const [result] = await pool.query(
      "DELETE FROM members WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: "error",
        message: "Không tìm thấy hội viên"
      });
    }

    res.json({
      status: "success",
      message: "Xóa hội viên thành công"
    });
  } catch (error) {
    sendError(res, error, "Không thể xóa hội viên");
  }
});

// ========================================
// QUẢN LÝ GÓI TẬP
// ========================================

app.get("/api/plans", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM membership_plans ORDER BY id ASC"
    );

    res.json({
      status: "success",
      total: rows.length,
      data: rows
    });
  } catch (error) {
    sendError(res, error, "Không thể lấy danh sách gói tập");
  }
});

// ========================================
// QUẢN LÝ HUẤN LUYỆN VIÊN
// ========================================

// Lấy danh sách PT
app.get("/api/trainers", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM trainers ORDER BY id ASC"
    );

    res.json({
      status: "success",
      total: rows.length,
      data: rows
    });
  } catch (error) {
    sendError(
      res,
      error,
      "Không thể lấy danh sách huấn luyện viên"
    );
  }
});

// Thêm PT
app.post("/api/trainers", async (req, res) => {
  try {
    const {
      full_name,
      phone,
      email,
      specialty,
      experience_years
    } = req.body;

    const years = Number(experience_years);

    if (
      typeof full_name !== "string" ||
      !full_name.trim() ||
      experience_years == null ||
      experience_years === "" ||
      !Number.isInteger(years) ||
      years < 0
    ) {
      return res.status(400).json({
        status: "error",
        message: "Họ tên hoặc số năm kinh nghiệm không hợp lệ"
      });
    }

    const [result] = await pool.query(
      `INSERT INTO trainers
       (full_name, phone, email, specialty,
        experience_years, status)
       VALUES (?, ?, ?, ?, ?, 'active')`,
      [
        full_name.trim(),
        phone || null,
        email || null,
        specialty || null,
        years
      ]
    );

    res.status(201).json({
      status: "success",
      message: "Thêm huấn luyện viên thành công",
      trainer_id: result.insertId
    });
  } catch (error) {
    sendError(res, error, "Không thể thêm huấn luyện viên");
  }
});

// Sửa PT
app.put("/api/trainers/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!validId(id)) {
      return res.status(400).json({
        status: "error",
        message: "ID huấn luyện viên không hợp lệ"
      });
    }

    const {
      full_name,
      phone,
      email,
      specialty,
      experience_years,
      status
    } = req.body;

    const years = Number(experience_years);

    if (
      typeof full_name !== "string" ||
      !full_name.trim() ||
      experience_years == null ||
      experience_years === "" ||
      !Number.isInteger(years) ||
      years < 0
    ) {
      return res.status(400).json({
        status: "error",
        message: "Thông tin huấn luyện viên không hợp lệ"
      });
    }

    const newStatus = status || "active";

    if (!["active", "inactive"].includes(newStatus)) {
      return res.status(400).json({
        status: "error",
        message: "Trạng thái không hợp lệ"
      });
    }

    const [result] = await pool.query(
      `UPDATE trainers
       SET full_name = ?,
           phone = ?,
           email = ?,
           specialty = ?,
           experience_years = ?,
           status = ?
       WHERE id = ?`,
      [
        full_name.trim(),
        phone || null,
        email || null,
        specialty || null,
        years,
        newStatus,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: "error",
        message: "Không tìm thấy huấn luyện viên"
      });
    }

    res.json({
      status: "success",
      message: "Cập nhật huấn luyện viên thành công"
    });
  } catch (error) {
    sendError(res, error, "Không thể cập nhật huấn luyện viên");
  }
});

// Xóa PT
app.delete("/api/trainers/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!validId(id)) {
      return res.status(400).json({
        status: "error",
        message: "ID huấn luyện viên không hợp lệ"
      });
    }

    const [result] = await pool.query(
      "DELETE FROM trainers WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: "error",
        message: "Không tìm thấy huấn luyện viên"
      });
    }

    res.json({
      status: "success",
      message: "Xóa huấn luyện viên thành công"
    });
  } catch (error) {
    sendError(res, error, "Không thể xóa huấn luyện viên");
  }
});

// ========================================
// QUẢN LÝ LỊCH TẬP
// ========================================

function validateSchedule(body = {}) {
  const member_id = Number(body.member_id);
  const trainer_id = Number(body.trainer_id);
  const duration_minutes = Number(
    body.duration_minutes ?? 60
  );

  const status = body.status ?? "scheduled";

  const notes = body.notes == null
    ? null
    : String(body.notes).trim() || null;

  if (!validId(member_id) || !validId(trainer_id)) {
    return {
      error: "ID hội viên hoặc PT không hợp lệ"
    };
  }

  if (typeof body.workout_date !== "string") {
    return {
      error: "Vui lòng nhập ngày và giờ tập"
    };
  }

  const match = body.workout_date.trim().match(
    /^(\d{4})-(\d{2})-(\d{2})[T ]([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/
  );

  if (!match) {
    return {
      error: "Ngày giờ phải có dạng YYYY-MM-DD HH:mm"
    };
  }

  const [, yy, mm, dd, hh, mi, ss = "00"] = match;

  const year = Number(yy);
  const month = Number(mm);
  const day = Number(dd);

  const dateCheck = new Date(
    Date.UTC(year, month - 1, day)
  );

  if (
    year < 1000 ||
    dateCheck.getUTCFullYear() !== year ||
    dateCheck.getUTCMonth() + 1 !== month ||
    dateCheck.getUTCDate() !== day
  ) {
    return {
      error: "Ngày tập không hợp lệ"
    };
  }

  if (
    body.duration_minutes === "" ||
    !Number.isInteger(duration_minutes) ||
    duration_minutes <= 0
  ) {
    return {
      error: "Thời lượng phải là số nguyên lớn hơn 0"
    };
  }

  if (
    !["scheduled", "completed", "cancelled"].includes(status)
  ) {
    return {
      error: "Trạng thái lịch tập không hợp lệ"
    };
  }

  return {
    data: {
      member_id,
      trainer_id,
      workout_date: `${yy}-${mm}-${dd} ${hh}:${mi}:${ss}`,
      duration_minutes,
      status,
      notes
    }
  };
}

// Lấy danh sách lịch tập
app.get("/api/schedules", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         s.id,
         s.member_id,
         s.trainer_id,
         DATE_FORMAT(
           s.workout_date, '%Y-%m-%d %H:%i:%s'
         ) AS workout_date,
         s.duration_minutes,
         s.status,
         s.notes,
         s.created_at,
         m.full_name AS member_name,
         t.full_name AS trainer_name
       FROM workout_schedules s
       LEFT JOIN members m ON s.member_id = m.id
       LEFT JOIN trainers t ON s.trainer_id = t.id
       ORDER BY s.workout_date ASC, s.id ASC`
    );

    res.json({
      status: "success",
      total: rows.length,
      data: rows
    });
  } catch (error) {
    sendError(res, error, "Không thể lấy danh sách lịch tập");
  }
});

// Thêm lịch tập
app.post("/api/schedules", async (req, res) => {
  const validation = validateSchedule(req.body);

  if (validation.error) {
    return res.status(400).json({
      status: "error",
      message: validation.error
    });
  }

  const data = validation.data;

  try {
    const [result] = await pool.query(
      `INSERT INTO workout_schedules
       (member_id, trainer_id, workout_date,
        duration_minutes, status, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.member_id,
        data.trainer_id,
        data.workout_date,
        data.duration_minutes,
        data.status,
        data.notes
      ]
    );

    res.status(201).json({
      status: "success",
      message: "Thêm lịch tập thành công",
      schedule_id: result.insertId
    });
  } catch (error) {
    sendError(res, error, "Không thể thêm lịch tập");
  }
});

// Sửa lịch tập
app.put("/api/schedules/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!validId(id)) {
    return res.status(400).json({
      status: "error",
      message: "ID lịch tập không hợp lệ"
    });
  }

  const validation = validateSchedule(req.body);

  if (validation.error) {
    return res.status(400).json({
      status: "error",
      message: validation.error
    });
  }

  const data = validation.data;

  try {
    const [result] = await pool.query(
      `UPDATE workout_schedules
       SET member_id = ?,
           trainer_id = ?,
           workout_date = ?,
           duration_minutes = ?,
           status = ?,
           notes = ?
       WHERE id = ?`,
      [
        data.member_id,
        data.trainer_id,
        data.workout_date,
        data.duration_minutes,
        data.status,
        data.notes,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: "error",
        message: "Không tìm thấy lịch tập"
      });
    }

    res.json({
      status: "success",
      message: "Cập nhật lịch tập thành công"
    });
  } catch (error) {
    sendError(res, error, "Không thể cập nhật lịch tập");
  }
});

// Xóa lịch tập
app.delete("/api/schedules/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!validId(id)) {
    return res.status(400).json({
      status: "error",
      message: "ID lịch tập không hợp lệ"
    });
  }

  try {
    const [result] = await pool.query(
      "DELETE FROM workout_schedules WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: "error",
        message: "Không tìm thấy lịch tập"
      });
    }

    res.json({
      status: "success",
      message: "Xóa lịch tập thành công"
    });
  } catch (error) {
    sendError(res, error, "Không thể xóa lịch tập");
  }
});

// ========================================
// KHỞI ĐỘNG SERVER
// ========================================

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Gym Management API running on port ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
});
