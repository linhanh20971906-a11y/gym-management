
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        status: "error",
        message: "Vui lòng nhập email và mật khẩu"
      });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const passwordHash = process.env.ADMIN_PASSWORD_HASH;
    const jwtSecret = process.env.JWT_SECRET;

    if (!adminEmail || !passwordHash || !jwtSecret) {
      return res.status(500).json({
        status: "error",
        message: "Chưa cấu hình tài khoản Admin"
      });
    }

    const emailMatches =
      email.trim().toLowerCase() === adminEmail.toLowerCase();

    const passwordMatches = await bcrypt.compare(
      password,
      passwordHash
    );

    if (!emailMatches || !passwordMatches) {
      return res.status(401).json({
        status: "error",
        message: "Email hoặc mật khẩu không chính xác"
      });
    }

    const accessToken = jwt.sign(
      { email: adminEmail, role: "admin" },
      jwtSecret,
      { expiresIn: "2h" }
    );

    return res.json({
      status: "success",
      message: "Đăng nhập thành công",
      accessToken,
      user: {
        email: adminEmail,
        role: "admin"
      }
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      status: "error",
      message: "Không thể đăng nhập"
    });
  }
});

router.get("/me", (req, res) => {
  const authorization = req.headers.authorization || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return res.status(401).json({
      status: "error",
      message: "Chưa cung cấp token"
    });
  }

  try {
    const decoded = jwt.verify(
      match[1],
      process.env.JWT_SECRET
    );

    if (decoded.role !== "admin") {
      return res.status(403).json({
        status: "error",
        message: "Không có quyền truy cập"
      });
    }

    return res.json({
      status: "success",
      user: {
        email: decoded.email,
        role: decoded.role
      }
    });
  } catch (error) {
    return res.status(401).json({
      status: "error",
      message: "Token không hợp lệ hoặc đã hết hạn"
    });
  }
});

module.exports = router;
