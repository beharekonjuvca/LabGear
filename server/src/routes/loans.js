import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { prisma } from "../prisma.js";

const router = Router();

// create loan from reservation
router.post("/", auth, requireRole("STAFF", "ADMIN"), async (req, res) => {
  const { reservation_id, due_at } = req.body;
  if (!reservation_id || !due_at)
    return res.status(400).json({ message: "Missing fields" });

  const r = await prisma.reservation.findUnique({
    where: { id: Number(reservation_id) },
  });
  if (!r) return res.status(404).json({ message: "Reservation not found" });

  await prisma.$transaction([
    prisma.loan.create({
      data: {
        reservationId: r.id,
        userId: r.userId,
        itemId: r.itemId,
        checkoutAt: new Date(),
        dueAt: new Date(due_at),
        status: "ACTIVE",
      },
    }),
    prisma.reservation.update({
      where: { id: r.id },
      data: { status: "CONVERTED" },
    }),
    prisma.item.update({ where: { id: r.itemId }, data: { available: false } }),
  ]);

  res.status(201).json({ message: "Loan created" });
});

// list loans
router.get("/", auth, async (req, res) => {
  const status = req.query.status;
  const where = status ? { status } : {};
  const rows = await prisma.loan.findMany({ where, orderBy: { id: "desc" } });
  res.json({ data: rows });
});

// return loan
router.patch(
  "/:id/return",
  auth,
  requireRole("STAFF", "ADMIN"),
  async (req, res) => {
    const id = Number(req.params.id);
    const loan = await prisma.loan.findUnique({ where: { id } });
    if (!loan) return res.status(404).json({ message: "Not found" });

    await prisma.$transaction([
      prisma.loan.update({
        where: { id },
        data: { status: "RETURNED", returnedAt: new Date() },
      }),
      prisma.item.update({
        where: { id: loan.itemId },
        data: { available: true },
      }),
    ]);

    res.json({ message: "Returned" });
  }
);

export default router;
