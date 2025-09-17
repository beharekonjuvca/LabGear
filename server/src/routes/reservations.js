import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { prisma } from "../prisma.js";

const router = Router();

// create reservation (member)
router.post("/", auth, async (req, res) => {
  const { item_id, start_date, end_date } = req.body;
  if (!item_id || !start_date || !end_date)
    return res.status(400).json({ message: "Missing fields" });

  const s = new Date(start_date),
    e = new Date(end_date);
  // overlap: NOT (end < s OR start > e)
  const conflict = await prisma.reservation.findFirst({
    where: {
      itemId: Number(item_id),
      status: { in: ["PENDING", "APPROVED"] },
      NOT: [{ endDate: { lt: s } }, { startDate: { gt: e } }],
    },
  });
  if (conflict)
    return res.status(409).json({ message: "Item already reserved in range" });

  await prisma.reservation.create({
    data: {
      userId: req.user.id,
      itemId: Number(item_id),
      startDate: s,
      endDate: e,
    },
  });
  res.status(201).json({ message: "Reservation created" });
});

// list
router.get("/", auth, async (req, res) => {
  if (req.user.role === "MEMBER") {
    const rows = await prisma.reservation.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ data: rows });
  }
  const rows = await prisma.reservation.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.json({ data: rows });
});

// approve / cancel (staff/admin)
router.patch(
  "/:id/approve",
  auth,
  requireRole("STAFF", "ADMIN"),
  async (req, res) => {
    await prisma.reservation.update({
      where: { id: Number(req.params.id) },
      data: { status: "APPROVED" },
    });
    res.json({ message: "Approved" });
  }
);
router.patch(
  "/:id/cancel",
  auth,
  requireRole("STAFF", "ADMIN"),
  async (req, res) => {
    await prisma.reservation.update({
      where: { id: Number(req.params.id) },
      data: { status: "CANCELLED" },
    });
    res.json({ message: "Cancelled" });
  }
);

export default router;
