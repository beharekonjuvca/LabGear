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
  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const limit = Math.min(
    Math.max(parseInt(req.query.limit || "10", 10), 1),
    100
  );
  const skip = (page - 1) * limit;

  const status = (req.query.status || "").trim() || undefined;
  const itemId = req.query.itemId ? Number(req.query.itemId) : undefined;
  const userIdQ = req.query.userId ? Number(req.query.userId) : undefined;
  const fromStr = req.query.from && String(req.query.from);
  const toStr = req.query.to && String(req.query.to);
  const q = (req.query.q || "").trim();

  const from = fromStr ? new Date(fromStr) : undefined;
  const to = toStr ? new Date(toStr) : undefined;

  const where = {
    ...(req.user.role === "MEMBER" ? { userId: req.user.id } : {}),
    ...(status ? { status } : {}),
    ...(itemId ? { itemId } : {}),
    ...(req.user.role !== "MEMBER" && userIdQ ? { userId: userIdQ } : {}),
  };

  // overlap on checkoutAt..dueAt
  if (from || to) {
    where.NOT = [
      ...(from ? [{ dueAt: { lt: from } }] : []),
      ...(to ? [{ checkoutAt: { gt: to } }] : []),
    ];
  }

  const search = q
    ? {
        OR: [
          { user: { fullName: { contains: q } } },
          { user: { email: { contains: q } } },
          { item: { name: { contains: q } } },
          { item: { code: { contains: q } } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.loan.findMany({
      where: { ...where, ...search },
      include: {
        user: { select: { fullName: true, email: true } },
        item: { select: { name: true, code: true } },
      },
      orderBy: { id: "desc" },
      skip,
      take: limit,
    }),
    prisma.loan.count({ where: { ...where, ...search } }),
  ]);

  res.json({ data, page, limit, total });
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
