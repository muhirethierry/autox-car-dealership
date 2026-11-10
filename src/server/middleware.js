import { env } from "./env.js";
import { validCsrfToken } from "./security.js";
import { prisma } from "./db.js";

export function csrfProtection(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  if (validCsrfToken(req.session, req.get("x-csrf-token"))) return next();
  return res.status(403).json({ error: "CSRF token is missing or expired." });
}

export async function requireUser(req, res, next) {
  try {
    if (!req.session.user?.id) return res.status(401).json({ error: "Sign in to continue." });
    const user = await prisma.user.findUnique({ where: { id: req.session.user.id }, select: { id: true, role: true, isActive: true } });
    if (!user?.isActive) return req.session.destroy(() => res.status(401).json({ error: "This account is inactive." }));
    req.user = user;
    next();
  } catch (error) { next(error); }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(req.session.user ? 403 : 401).json({ error: "You do not have permission to perform this action." });
    }
    next();
  };
}

export function sessionOptions(store) {
  return {
    name: env.SESSION_COOKIE_NAME,
    secret: env.SESSION_SECRET,
    store,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: env.SESSION_SECURE,
      sameSite: env.SESSION_SAME_SITE,
      maxAge: 1000 * 60 * 60 * 12,
      path: "/"
    }
  };
}
