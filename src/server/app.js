import express from "express";
import cors from "cors";
import helmet from "helmet";
import session from "express-session";
import MySQLStoreFactory from "express-mysql-session";
import mysql from "mysql2/promise";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { env } from "./env.js";
import { prisma } from "./db.js";
import { createCsrfToken, hashPassword, verifyPassword } from "./security.js";
import { blockingBookingStatuses, bookingWhereForUser, calculateRentalTotal } from "./bookingRules.js";
import { csrfProtection, requireRole, requireUser, sessionOptions } from "./middleware.js";

const dbUrl = new URL(env.DATABASE_URL);
const connection = mysql.createPool({
  host: dbUrl.hostname,
  port: Number(dbUrl.port || 3306),
  user: decodeURIComponent(dbUrl.username),
  password: decodeURIComponent(dbUrl.password),
  database: decodeURIComponent(dbUrl.pathname.slice(1)),
  connectionLimit: 5,
  waitForConnections: true
});
const MySQLStore = MySQLStoreFactory(session);
const sessionStore = new MySQLStore({
  clearExpired: true,
  checkExpirationInterval: 15 * 60 * 1000,
  expiration: 12 * 60 * 60 * 1000,
  createDatabaseTable: true,
  schema: { tableName: "http_sessions", columnNames: { session_id: "session_id", expires: "expires", data: "data" } }
}, connection);

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", env.NODE_ENV === "production" ? 1 : false);
app.use(helmet({ crossOriginResourcePolicy: { policy: "same-site" } }));
app.use(cors({ origin: env.APP_ORIGIN, credentials: true, methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], allowedHeaders: ["Content-Type", "X-CSRF-Token"] }));
app.use(express.json({ limit: "1mb" }));
app.use(session(sessionOptions(sessionStore)));
app.use("/api", csrfProtection);

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-8", legacyHeaders: false, message: { error: "Too many attempts. Please try again later." } });
const emailSchema = z.string().trim().email().max(254).transform(value => value.toLowerCase());
const passwordSchema = z.string().min(12).max(128).regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/);
const publicUserSelect = { id: true, email: true, firstName: true, lastName: true, phone: true, role: true, createdAt: true };
const vehicleInput = z.object({
  id: z.string().trim().min(2).max(80).regex(/^[\w-]+$/),
  brand: z.string().trim().min(1).max(80), model: z.string().trim().min(1).max(100),
  year: z.coerce.number().int().min(1980).max(new Date().getFullYear() + 2),
  registration: z.string().trim().max(40).optional().nullable(),
  category: z.string().trim().min(2).max(40), transmission: z.string().trim().min(2).max(40),
  fuelType: z.string().trim().min(2).max(40), seats: z.coerce.number().int().min(1).max(60),
  dailyRate: z.coerce.number().positive().max(100_000_000), weeklyRate: z.coerce.number().positive().max(500_000_000),
  monthlyRate: z.coerce.number().positive().max(1_000_000_000), currency: z.literal("RWF").default("RWF"),
  description: z.string().trim().min(1).max(5000), imageUrl: z.string().url().max(2048).optional().nullable(),
  status: z.enum(["AVAILABLE", "UNAVAILABLE", "MAINTENANCE", "ARCHIVED"]).default("AVAILABLE")
});
const bookingInput = z.object({
  vehicleId: z.string().min(2).max(80), pickupLocation: z.string().trim().min(2).max(200),
  pickupAt: z.coerce.date(), returnAt: z.coerce.date(), notes: z.string().trim().max(1000).optional()
}).refine(value => value.returnAt > value.pickupAt, { message: "Return must be after pickup.", path: ["returnAt"] });

function validationError(res, error) {
  return res.status(400).json({ error: "Please check the submitted information.", details: error.issues.map(issue => ({ field: issue.path.join("."), message: issue.message })) });
}
const recordActivity = async (actorId,action,detail) => {
  try { await prisma.adminActivity.create({ data: { actorId,action,detail } }); }
  catch (error) { if (env.NODE_ENV !== "production") console.error("Could not record admin activity.", error); }
};

app.get("/api/health/live", (_req, res) => res.json({ status: "ok" }));
app.get("/api/health/ready", async (_req, res) => {
  try { await prisma.$queryRaw`SELECT 1`; res.json({ status: "ready", database: "connected" }); }
  catch { res.status(503).json({ status: "not-ready", database: "unavailable" }); }
});
app.get("/api/auth/csrf", (req, res) => res.json({ csrfToken: createCsrfToken(req.session) }));

app.post("/api/auth/signup", authLimiter, async (req, res, next) => {
  try {
    const input = z.object({ email: emailSchema, password: passwordSchema, firstName: z.string().trim().min(1).max(80), lastName: z.string().trim().min(1).max(80), phone: z.string().trim().max(32).optional() }).parse(req.body);
    const exists = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
    if (exists) return res.status(409).json({ error: "An account with that email already exists." });
    const user = await prisma.user.create({ data: { ...input, passwordHash: await hashPassword(input.password) }, select: publicUserSelect });
    await new Promise((resolve, reject) => req.session.regenerate(error => error ? reject(error) : resolve()));
    req.session.user = { id: user.id };
    res.status(201).json({ user, csrfToken: createCsrfToken(req.session) });
  } catch (error) { if (error instanceof z.ZodError) return validationError(res, error); next(error); }
});

app.post("/api/auth/login", authLimiter, async (req, res, next) => {
  try {
    const input = z.object({ email: emailSchema, password: z.string().min(1).max(128), remember: z.boolean().default(false) }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user?.isActive || !(await verifyPassword(input.password, user.passwordHash))) return res.status(401).json({ error: "Email or password is incorrect." });
    await new Promise((resolve, reject) => req.session.regenerate(error => error ? reject(error) : resolve()));
    req.session.cookie.maxAge = input.remember ? 30 * 24 * 60 * 60 * 1000 : 12 * 60 * 60 * 1000;
    req.session.user = { id: user.id };
    res.json({ user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, phone: user.phone, role: user.role, createdAt: user.createdAt }, csrfToken: createCsrfToken(req.session) });
  } catch (error) { if (error instanceof z.ZodError) return validationError(res, error); next(error); }
});

app.get("/api/auth/me", requireUser, async (req, res, next) => {
  try { const user = await prisma.user.findUnique({ where: { id: req.session.user.id }, select: publicUserSelect }); if (!user) return res.status(401).json({ error: "Session has expired." }); res.json({ user }); }
  catch (error) { next(error); }
});
app.post("/api/auth/logout", requireUser, (req, res, next) => req.session.destroy(error => error ? next(error) : res.clearCookie(env.SESSION_COOKIE_NAME, { httpOnly: true, secure: env.SESSION_SECURE, sameSite: env.SESSION_SAME_SITE, path: "/" }).status(204).end()));

app.get("/api/vehicles", async (req, res, next) => {
  try {
    const where = { status: "AVAILABLE" };
    if (req.query.category) where.category = String(req.query.category).slice(0, 40);
    if (req.query.search) where.OR = [{ brand: { contains: String(req.query.search).slice(0, 80) } }, { model: { contains: String(req.query.search).slice(0, 100) } }];
    const vehicles = await prisma.vehicle.findMany({ where, orderBy: [{ brand: "asc" }, { model: "asc" }] });
    res.json({ vehicles });
  } catch (error) { next(error); }
});

const admin = requireRole("MANAGER", "SUPER_ADMIN");
app.get("/api/admin/vehicles", requireUser, admin, async (_req, res, next) => {
  try { res.json({ vehicles: await prisma.vehicle.findMany({ orderBy: [{ brand: "asc" }, { model: "asc" }] }) }); } catch (error) { next(error); }
});
app.post("/api/admin/vehicles", requireUser, admin, async (req, res, next) => {
  try { const vehicle = vehicleInput.parse(req.body); const saved = await prisma.vehicle.create({ data: vehicle }); await recordActivity(req.user.id,"Vehicle added",`${saved.brand} ${saved.model}`); res.status(201).json({ vehicle: saved }); }
  catch (error) { if (error instanceof z.ZodError) return validationError(res, error); next(error); }
});
app.put("/api/admin/vehicles/:id", requireUser, admin, async (req, res, next) => {
  try { const vehicle = vehicleInput.omit({ id: true }).partial().parse(req.body); const saved = await prisma.vehicle.update({ where: { id: req.params.id }, data: vehicle }); await recordActivity(req.user.id,"Vehicle updated",`${saved.brand} ${saved.model}`); res.json({ vehicle: saved }); }
  catch (error) { if (error instanceof z.ZodError) return validationError(res, error); next(error); }
});
app.patch("/api/admin/vehicles/:id/status", requireUser, admin, async (req, res, next) => {
  try { const { status } = z.object({ status: z.enum(["AVAILABLE", "UNAVAILABLE", "MAINTENANCE", "ARCHIVED"]) }).parse(req.body); const vehicle=await prisma.vehicle.update({ where: { id: req.params.id }, data: { status } }); await recordActivity(req.user.id,`Vehicle marked ${status.toLowerCase()}`,`${vehicle.brand} ${vehicle.model}`); res.json({ vehicle }); }
  catch (error) { if (error instanceof z.ZodError) return validationError(res, error); next(error); }
});

app.get("/api/bookings", requireUser, async (req, res, next) => {
  try {
    const where = bookingWhereForUser(req.user);
    res.json({ bookings: await prisma.booking.findMany({ where, include: { vehicle: true, customer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } }, payments: true }, orderBy: { createdAt: "desc" }, take: 100 }) });
  } catch (error) { next(error); }
});

app.get("/api/admin/bookings", requireUser, admin, async (_req, res, next) => {
  try { res.json({ bookings: await prisma.booking.findMany({ include: { vehicle: true, customer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } }, payments: true }, orderBy: { createdAt: "desc" }, take: 500 }) }); }
  catch (error) { next(error); }
});

async function assertNoConflict(tx, vehicleId, pickupAt, returnAt, excludeId) {
  const overlaps = await tx.booking.findFirst({ where: { vehicleId, status: { in: blockingBookingStatuses }, ...(excludeId ? { id: { not: excludeId } } : {}), pickupAt: { lt: returnAt }, returnAt: { gt: pickupAt } }, select: { id: true } });
  if (overlaps) { const error = new Error("This vehicle is already reserved for part of those dates."); error.status = 409; throw error; }
  const maintenance = await tx.maintenanceRecord.findFirst({ where: { vehicleId, OR: [{ status: "In progress" }, { status: "Scheduled", serviceDate: { gte: pickupAt, lt: returnAt } }] }, select: { id: true } });
  if (maintenance) { const error = new Error("This vehicle is scheduled for maintenance during those dates."); error.status = 409; throw error; }
}

app.post("/api/bookings", requireUser, async (req, res, next) => {
  try {
    const input = bookingInput.parse(req.body);
    if (input.pickupAt < new Date()) return res.status(400).json({ error: "Pickup date must be in the future." });
    const booking = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM Vehicle WHERE id = ${input.vehicleId} FOR UPDATE`;
      const vehicle = await tx.vehicle.findUnique({ where: { id: input.vehicleId } });
      if (!vehicle || vehicle.status !== "AVAILABLE") { const error = new Error("This vehicle is not available."); error.status = 409; throw error; }
      await assertNoConflict(tx, input.vehicleId, input.pickupAt, input.returnAt);
      const reference = `AX-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
      return tx.booking.create({ data: { reference, customerId: req.session.user.id, vehicleId: input.vehicleId, pickupLocation: input.pickupLocation, pickupAt: input.pickupAt, returnAt: input.returnAt, dailyRate: vehicle.dailyRate, totalAmount: calculateRentalTotal(vehicle.dailyRate, input.pickupAt, input.returnAt, vehicle.weeklyRate, vehicle.monthlyRate), notes: input.notes }, include: { vehicle: true } });
    }, { isolationLevel: "Serializable", maxWait: 5000, timeout: 10000 });
    res.status(201).json({ booking });
  } catch (error) { if (error instanceof z.ZodError) return validationError(res, error); next(error); }
});

app.patch("/api/admin/bookings/:id/status", requireUser, admin, async (req, res, next) => {
  try {
    const { status } = z.object({ status: z.enum(["APPROVED", "REJECTED", "ACTIVE", "COMPLETED", "CANCELLED"]) }).parse(req.body);
    const booking = await prisma.$transaction(async tx => {
      const current = await tx.booking.findUnique({ where: { id: req.params.id } });
      if (!current) { const error = new Error("Booking not found."); error.status = 404; throw error; }
      if (status === "APPROVED" || status === "ACTIVE") {
        await tx.$queryRaw`SELECT id FROM Vehicle WHERE id = ${current.vehicleId} FOR UPDATE`;
        await assertNoConflict(tx, current.vehicleId, current.pickupAt, current.returnAt, current.id);
      }
      return tx.booking.update({ where: { id: current.id }, data: { status } });
    }, { isolationLevel: "Serializable" });
    await recordActivity(req.user.id,`Booking ${status.toLowerCase()}`,booking.reference);
    res.json({ booking });
  } catch (error) { if (error instanceof z.ZodError) return validationError(res, error); next(error); }
});

app.get("/api/admin/summary", requireUser, admin, async (_req, res, next) => {
  try {
    const [vehicles, bookings, customers, verifiedPayments] = await Promise.all([
      prisma.vehicle.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.booking.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.payment.aggregate({ where: { status: "VERIFIED" }, _sum: { amount: true } })
    ]);
    res.json({ vehicles, bookings, customers, verifiedRevenue: Number(verifiedPayments._sum.amount || 0), currency: "RWF" });
  } catch (error) { next(error); }
});

app.get("/api/admin/customers", requireUser, admin, async (_req, res, next) => {
  try { res.json({ customers: await prisma.user.findMany({ where: { role: "CUSTOMER" }, select: { id: true, email: true, firstName: true, lastName: true, phone: true, isActive: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 500 }) }); }
  catch (error) { next(error); }
});
app.patch("/api/admin/customers/:id/status", requireUser, requireRole("SUPER_ADMIN"), async (req, res, next) => {
  try { const { isActive } = z.object({ isActive: z.boolean() }).parse(req.body); const customer = await prisma.user.update({ where: { id: req.params.id, role: "CUSTOMER" }, data: { isActive }, select: { id: true, email: true, firstName: true, lastName: true, isActive: true } }); res.json({ customer }); }
  catch (error) { if (error instanceof z.ZodError) return validationError(res, error); next(error); }
});

app.get("/api/admin/payments", requireUser, admin, async (_req, res, next) => {
  try { res.json({ payments: await prisma.payment.findMany({ include: { booking: { select: { reference: true, customer: { select: { firstName: true, lastName: true, email: true } }, vehicle: { select: { brand: true, model: true } } } } }, orderBy: { createdAt: "desc" }, take: 500 }) }); }
  catch (error) { next(error); }
});
app.post("/api/admin/payments/manual", requireUser, admin, async (req, res, next) => {
  try {
    const input = z.object({ bookingId: z.string().min(2), amount: z.coerce.number().positive().max(1_000_000_000), provider: z.enum(["CASH", "MTN_MOMO", "AIRTEL_MONEY", "BANK", "CARD"]) }).parse(req.body);
    const payment = await prisma.payment.create({ data: { bookingId: input.bookingId, amount: input.amount, provider: input.provider, recorderId: req.user.id, status: "PENDING" } });
    await recordActivity(req.user.id,"Manual payment note recorded",`${payment.id} · RWF ${input.amount} · unverified`);
    res.status(201).json({ payment, verification: "pending; manual entry does not verify payment" });
  } catch (error) { if (error instanceof z.ZodError) return validationError(res, error); next(error); }
});

app.get("/api/admin/maintenance", requireUser, admin, async (_req, res, next) => {
  try { res.json({ records: await prisma.maintenanceRecord.findMany({ include: { vehicle: { select: { id: true, brand: true, model: true, registration: true } } }, orderBy: { serviceDate: "desc" }, take: 500 }) }); }
  catch (error) { next(error); }
});
app.post("/api/admin/maintenance", requireUser, admin, async (req, res, next) => {
  try {
    const input = z.object({ vehicleId: z.string().min(2), description: z.string().trim().min(4).max(2000), serviceDate: z.coerce.date(), expense: z.coerce.number().nonnegative().max(100_000_000).optional(), status: z.enum(["Scheduled", "In progress", "Completed"]) }).parse(req.body);
    const record = await prisma.$transaction(async tx => {
      const created = await tx.maintenanceRecord.create({ data: { ...input, currency: "RWF", expense: input.expense ?? null, ...(input.status === "Completed" ? { completedAt: new Date() } : {}) } });
      if (input.status === "In progress") await tx.vehicle.update({ where: { id: input.vehicleId }, data: { status: "MAINTENANCE" } });
      return created;
    });
    await recordActivity(req.user.id,"Maintenance record added",`${input.vehicleId} · ${input.description}`);
    res.status(201).json({ record });
  } catch (error) { if (error instanceof z.ZodError) return validationError(res, error); next(error); }
});
app.patch("/api/admin/maintenance/:id/status", requireUser, admin, async (req, res, next) => {
  try {
    const { status } = z.object({ status: z.enum(["Scheduled", "In progress", "Completed"]) }).parse(req.body);
    const result = await prisma.$transaction(async tx => {
      const current = await tx.maintenanceRecord.findUnique({ where: { id: req.params.id } });
      if (!current) { const error = new Error("Maintenance record not found."); error.status = 404; throw error; }
      const record = await tx.maintenanceRecord.update({ where: { id: current.id }, data: { status, completedAt: status === "Completed" ? new Date() : null } });
      if (status === "In progress") await tx.vehicle.update({ where: { id: current.vehicleId }, data: { status: "MAINTENANCE" } });
      if (status === "Completed") {
        const other = await tx.maintenanceRecord.findFirst({ where: { id: { not: current.id }, vehicleId: current.vehicleId, status: "In progress" } });
        if (!other) await tx.vehicle.updateMany({ where: { id: current.vehicleId, status: "MAINTENANCE" }, data: { status: "AVAILABLE" } });
      }
      return record;
    });
    await recordActivity(req.user.id,`Maintenance marked ${status.toLowerCase()}`,result.id);
    res.json({ record: result });
  } catch (error) { if (error instanceof z.ZodError) return validationError(res, error); next(error); }
});

app.get("/api/admin/activity", requireUser, admin, async (_req, res, next) => {
  try { res.json({ activity: await prisma.adminActivity.findMany({ include: { actor: { select: { firstName: true, lastName: true } } }, orderBy: { createdAt: "desc" }, take: 100 }) }); }
  catch (error) { next(error); }
});

app.use((req, res) => res.status(404).json({ error: "API route not found." }));
app.use((error, _req, res, _next) => {
  if (env.NODE_ENV !== "production") console.error(error);
  const status = Number(error.status) || (error.code === "P2002" ? 409 : error.code === "P2025" ? 404 : 500);
  res.status(status).json({ error: status < 500 ? error.message : "The server could not complete this request." });
});

export async function closeApp() {
  await sessionStore.close();
  await prisma.$disconnect();
}
export const connectApp = () => sessionStore.onReady();
export default app;
