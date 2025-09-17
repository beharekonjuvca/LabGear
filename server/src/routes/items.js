import { Router } from "express";
import { validationResult } from "express-validator";
import { prisma } from "../prisma.js";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { itemCreateSchema } from "../utils/validators.js";

const router = Router();

router.get("/", auth, async (req, res) => {
  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const limit = Math.min(
    Math.max(parseInt(req.query.limit || "10", 10), 1),
    100
  );
  const skip = (page - 1) * limit;
  const search = (req.query.search || "").trim();

  const where = search
    ? {
        OR: [
          { name: { contains: search } },
          { code: { contains: search } },
          { category: { contains: search } },
        ],
      }
    : {};

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
  itemCreateSchema,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { name, code, category, condition_note, available } = req.body;
    try {
      await prisma.item.create({
        data: {
          name,
          code,
          category,
          conditionNote: condition_note || null,
          available: available ?? true,
        },
      });
      res.status(201).json({ message: "Created" });
    } catch (e) {
      if (e.code === "P2002")
        return res.status(409).json({ message: "Code must be unique" });
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
  itemCreateSchema,
  async (req, res) => {
    const id = Number(req.params.id);
    const { name, code, category, condition_note, available } = req.body;
    await prisma.item.update({
      where: { id },
      data: {
        name,
        code,
        category,
        conditionNote: condition_note || null,
        available: available ?? true,
      },
    });
    res.json({ message: "Updated" });
  }
);

router.delete("/:id", auth, requireRole("ADMIN"), async (req, res) => {
  const id = Number(req.params.id);
  await prisma.item.delete({ where: { id } });
  res.json({ message: "Deleted" });
});

export default router;
