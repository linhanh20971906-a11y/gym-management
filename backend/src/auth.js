
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { rateLimit } = require("express-rate-limit");

const router = express.Router();

// Gioi han 5 lan thu dang nhap trong 15 phut
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    status: "error",
    message: "Dang nhap sai qua nhieu lan. Vui long thu lai sau 15 phut."
  }
});

router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password ||
      email.length > 254 ||
      password.length > 128
    ) {
      return res.status(400).json({
        status: "error",
        message: "Email hoac mat khau khong hop le"
      });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const passwordHash = process.env.ADMIN_PASSWORD_HASH;
    const jwtSecret = process.env.JWT_SECRET;

    if (!adminEmail || !passwordHash || !jwtSecret) {
      return res.status(500).json({
        status: "error",
        message: "Chua cau hinh tai khoan Admin"
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
        message: "Email hoac mat khau khong chinh xac"
      });
    }

    const accessToken = jwt.sign(
      { email: adminEmail, role: "admin" },
      jwtSecret,
      {
        algorithm: "HS256",
        expiresIn: "2h"
      }
    );

    return res.json({
      status: "success",
      message: "Dang nhap thanh cong",
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
      message: "Khong the dang nhap"
    });
  }
});

router.get("/me", (req, res) => {
  const authorization = req.headers.authorization || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return res.status(401).json({
      status: "error",
      message: "Chua cung cap token"
    });
  }

  if (!process.env.JWT_SECRET || !process.env.ADMIN_EMAIL) {
    return res.status(500).json({
      status: "error",
      message: "May chu chua cau hinh xac thuc"
    });
  }

  try {
    const decoded = jwt.verify(
      match[1],
      process.env.JWT_SECRET,
      { algorithms: ["HS256"] }
    );

    if (
      decoded.role !== "admin" ||
      decoded.email !== process.env.ADMIN_EMAIL
    ) {
      return res.status(403).json({
        status: "error",
        message: "Khong co quyen truy cap"
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
      message: "Token khong hop le hoac da het han"
    });
  }
});

module.exports = router;
