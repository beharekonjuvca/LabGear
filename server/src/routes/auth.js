import { Router } from "express";
import { validationResult } from "express-validator";
import crypto from "crypto";
import { prisma } from "../prisma.js";
import { registerSchema, loginSchema } from "../utils/validators.js";
import {
  hashPassword,
  comparePassword,
  signAccess,
  signRefresh,
  verifyRefresh,
} from "../utils/jwt.js";

const router = Router();

router.post("/register", registerSchema, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  const { email, password, full_name } = req.body;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing)
    return res.status(409).json({ message: "Email already in use" });

  const passwordHash = await hashPassword(password);
  await prisma.user.create({
    data: { email, passwordHash, fullName: full_name, role: "MEMBER" },
  });
  res.status(201).json({ message: "Registered" });
});

router.post("/login", loginSchema, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  const u = await prisma.user.findUnique({ where: { email } });
  if (!u) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await comparePassword(password, u.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const accessToken = signAccess({
    id: u.id,
    role: u.role,
    email: u.email,
    name: u.fullName,
  });
  const refreshToken = signRefresh({ id: u.id });

  const hash = crypto.createHash("sha256").update(refreshToken).digest("hex");
  await prisma.refreshToken.upsert({
    where: { userId_tokenHash: { userId: u.id, tokenHash: hash } },
    update: { tokenHash: hash },
    create: { userId: u.id, tokenHash: hash },
  });

  res.cookie("rt", refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.json({
    accessToken,
    user: { id: u.id, email: u.email, full_name: u.fullName, role: u.role },
  });
});

router.post("/refresh", async (req, res) => {
  const token = req.cookies?.rt;
  if (!token) return res.status(401).json({ message: "Missing refresh token" });
  try {
    const payload = verifyRefresh(token);
    const hash = crypto.createHash("sha256").update(token).digest("hex");
    const rt = await prisma.refreshToken.findUnique({
      where: { userId_tokenHash: { userId: payload.id, tokenHash: hash } },
    });
    if (!rt) return res.status(401).json({ message: "Invalid refresh token" });

    const u = await prisma.user.findUnique({ where: { id: payload.id } });
    const accessToken = signAccess({
      id: u.id,
      role: u.role,
      email: u.email,
      name: u.fullName,
    });
    const newRefresh = signRefresh({ id: u.id });
    const newHash = crypto
      .createHash("sha256")
      .update(newRefresh)
      .digest("hex");

    await prisma.refreshToken.update({
      where: { id: rt.id },
      data: { tokenHash: newHash },
    });
    res.cookie("rt", newRefresh, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ accessToken });
  } catch {
    res.status(401).json({ message: "Invalid refresh token" });
  }
});

router.post("/logout", async (req, res) => {
  const token = req.cookies?.rt;
  if (token) {
    try {
      const payload = verifyRefresh(token);
      await prisma.refreshToken.deleteMany({ where: { userId: payload.id } });
    } catch {}
  }
  res.clearCookie("rt");
  res.json({ message: "Logged out" });
});

export default router;
