import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { prisma } from "../prisma.js";

const router = Router();

router.get("/summary", auth, async (req, res) => {
  const [totalItems, activeLoans, overdueLoans, available] = await Promise.all([
    prisma.item.count(),
    prisma.loan.count({ where: { status: "ACTIVE" } }),
    prisma.loan.count({ where: { status: "OVERDUE" } }),
    prisma.item.count({ where: { available: true } }),
  ]);
  const utilization = totalItems
    ? Math.round(((totalItems - available) / totalItems) * 100)
    : 0;
  res.json({
    total_items: totalItems,
    active_loans: activeLoans,
    overdue: overdueLoans,
    utilization,
  });
});

export default router;
