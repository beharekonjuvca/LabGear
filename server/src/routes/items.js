import { Router } from "express";
import { validationResult } from "express-validator";
import { prisma } from "../prisma.js";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { itemCreateSchema } from "../utils/validators.js";
import { uploadItemImage } from "../middleware/upload.js";
import path from "path";
import fs from "fs";

const router = Router();
function toPublicUrl(filename) {
  return `/uploads/items/${filename}`;
}

function removeIfLocal(url) {
  if (!url || !url.startsWith("/uploads/items/")) return;
  const filePath = path.join(process.cwd(), url);
  fs.unlink(filePath, (err) => {
    /* ignore if not found */
  });
}

router.get("/", auth, async (req, res) => {
  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const limit = Math.min(
    Math.max(parseInt(req.query.limit || "10", 10), 1),
    100
  );
  const skip = (page - 1) * limit;
  const search = (req.query.search || "").trim();
  const category = (req.query.category || "").trim();
  const available =
    req.query.available === "true"
      ? true
      : req.query.available === "false"
      ? false
      : undefined;

  const where = {
    ...(search
      ? {
          OR: [
            { name: { contains: search } },
            { code: { contains: search } },
            { category: { contains: search } },
          ],
        }
      : {}),
    ...(category ? { category } : {}),
    ...(available === undefined ? {} : { available }),
  };

  const [data, total] = await Promise.all([
    prisma.item.findMany({ where, take: limit, skip, orderBy: { id: "desc" } }),
    prisma.item.count({ where }),
  ]);

  res.json({ data, page, limit, total });
});

router.post(
  "/",
  auth,
  requireRole("ADMIN", "STAFF"),
  uploadItemImage,
  itemCreateSchema,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { name, code, category, condition_note, available, image_url } =
      req.body;
    const availableBool =
      available === "true" ? true : available === "false" ? false : undefined;

    const imageUrl = req.file
      ? toPublicUrl(req.file.filename)
      : image_url?.trim() || null;

    try {
      const created = await prisma.item.create({
        data: {
          name,
          code,
          category,
          conditionNote: condition_note || null,
          available: availableBool ?? true,
          imageUrl,
        },
      });
      res.status(201).json(created);
    } catch (e) {
      if (e.code === "P2002")
        return res.status(409).json({ message: "Code must be unique" });
      if (req.file) removeIfLocal(toPublicUrl(req.file.filename));
      throw e;
    }
  }
);

router.get("/:id", auth, async (req, res) => {
  const id = Number(req.params.id);
  const item = await prisma.item.findUnique({ where: { id } });
  if (!item) return res.status(404).json({ message: "Not found" });
  res.json(item);
});

router.put(
  "/:id",
  auth,
  requireRole("ADMIN", "STAFF"),
  uploadItemImage,
  itemCreateSchema,
  async (req, res) => {
    const id = Number(req.params.id);
    const { name, code, category, condition_note, available, image_url } =
      req.body;

    const availableBool =
      available === "true" ? true : available === "false" ? false : undefined;

    const existing = await prisma.item.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "Not found" });

    let newImageUrl = existing.imageUrl || null;
    if (req.file) {
      newImageUrl = toPublicUrl(req.file.filename);
    } else if (typeof image_url === "string") {
      newImageUrl = image_url.trim() || null;
    }
    if (existing.imageUrl && existing.imageUrl !== newImageUrl && req.file) {
      removeIfLocal(existing.imageUrl);
    }

    const updated = await prisma.item.update({
      where: { id },
      data: {
        name,
        code,
        category,
        conditionNote: condition_note || null,
        available: availableBool ?? true,
        imageUrl: newImageUrl,
      },
    });

    res.json(updated);
  }
);
router.get("/:id/availability", auth, async (req, res) => {
  const id = Number(req.params.id);
  const from = req.query.from
    ? new Date(req.query.from)
    : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const to = req.query.to
    ? new Date(req.query.to)
    : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

  const reservations = await prisma.reservation.findMany({
    where: {
      itemId: id,
      status: { in: ["PENDING", "APPROVED"] },
      NOT: [{ endDate: { lt: from } }, { startDate: { gt: to } }],
    },
    select: { startDate: true, endDate: true, status: true },
  });

  const loans = await prisma.loan.findMany({
    where: {
      itemId: id,
      status: "ACTIVE",
      NOT: [{ dueAt: { lt: from } }, { checkoutAt: { gt: to } }],
    },
    select: { checkoutAt: true, dueAt: true },
  });

  const blocks = [
    ...reservations.map((r) => ({
      start: r.startDate,
      end: r.endDate,
      type: r.status,
    })),
    ...loans.map((l) => ({
      start: l.checkoutAt,
      end: l.dueAt,
      type: "ACTIVE_LOAN",
    })),
  ];

  res.json({ itemId: id, blocks });
});
router.delete("/:id", auth, requireRole("ADMIN"), async (req, res) => {
  const id = Number(req.params.id);
  const existing = await prisma.item.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ message: "Not found" });

  await prisma.item.delete({ where: { id } });

  removeIfLocal(existing.imageUrl);

  res.json({ message: "Deleted" });
});

export default router;
