import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";

import { config } from "./config.js";
import { testDb } from "./prisma.js";

import authRoutes from "./routes/auth.js";
import itemRoutes from "./routes/items.js";
import reservationRoutes from "./routes/reservations.js";
import loanRoutes from "./routes/loans.js";
import dashboardRoutes from "./routes/dashboard.js";

const app = express();
app.use(helmet());
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", async (_, res) => res.json({ ok: await testDb() }));

app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Server error" });
});

app.listen(config.port, async () => {
  const ok = await testDb();
  console.log(
    `API on http://localhost:${config.port}  DB=${ok ? "OK" : "FAILED"}`
  );
});
