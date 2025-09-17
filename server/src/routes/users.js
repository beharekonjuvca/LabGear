import { Router } from "express";
import { prisma } from "../prisma.js";
import { auth } from "../middleware/auth.js";
import { comparePassword, hashPassword } from "../utils/jwt.js";

const router = Router();

/** Get my profile */
router.get("/me", auth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      createdAt: true,
    },
  });
  res.json(user);
});

/** Update my profile (name/email) and/or change password */
router.patch("/me", auth, async (req, res) => {
  const { full_name, email, current_password, new_password } = req.body;

  const me = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!me) return res.status(404).json({ message: "User not found" });

  if (new_password) {
    if (!current_password)
      return res.status(400).json({ message: "Current password required" });
    const ok = await comparePassword(current_password, me.passwordHash);
    if (!ok)
      return res.status(400).json({ message: "Current password is incorrect" });
  }

  try {
    const data = {};
    if (typeof full_name === "string" && full_name.trim())
      data.fullName = full_name.trim();
    if (typeof email === "string" && email.trim()) data.email = email.trim();
    if (new_password) data.passwordHash = await hashPassword(new_password);

    const updated = await prisma.user.update({
      where: { id: me.id },
      data,
      select: { id: true, email: true, fullName: true, role: true },
    });

    res.json({ message: "Updated", user: updated });
  } catch (e) {
    if (e.code === "P2002")
      return res.status(409).json({ message: "Email already in use" });
    throw e;
  }
});

export default router;
