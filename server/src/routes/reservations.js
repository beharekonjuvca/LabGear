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

  // Base where with role restriction
  const where = {
    ...(req.user.role === "MEMBER" ? { userId: req.user.id } : {}),
    ...(status ? { status } : {}),
    ...(itemId ? { itemId } : {}),
    ...(req.user.role !== "MEMBER" && userIdQ ? { userId: userIdQ } : {}),
  };

  // Date-window overlap filter if range provided:
  // overlap if NOT (end < from OR start > to)
  if (from || to) {
    where.NOT = [
      ...(from ? [{ endDate: { lt: from } }] : []),
      ...(to ? [{ startDate: { gt: to } }] : []),
    ];
  }

  // Optional "q" search across joined fields (simple contains)
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
    prisma.reservation.findMany({
      where: { ...where, ...search },
      include: {
        user: { select: { fullName: true, email: true } },
        item: { select: { name: true, code: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.reservation.count({ where: { ...where, ...search } }),
  ]);

  res.json({ data, page, limit, total });
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
