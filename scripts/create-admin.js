import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { hashPassword } from "../src/server/security.js";

const email = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const password = String(process.env.ADMIN_PASSWORD || "");
const name = String(process.env.ADMIN_NAME || "AUTOX Administrator").trim();
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Set a valid ADMIN_EMAIL in your local .env file.");
if (password.length < 12 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) throw new Error("Set an ADMIN_PASSWORD of at least 12 characters with uppercase, lowercase, and a number.");
const url = new URL(process.env.DATABASE_URL || "");
const prisma = new PrismaClient({ adapter: new PrismaMariaDb({ host: url.hostname, port: Number(url.port || 3306), user: decodeURIComponent(url.username), password: decodeURIComponent(url.password), database: decodeURIComponent(url.pathname.slice(1)), connectionLimit: 2 }) });
try {
  const [firstName,...rest]=name.split(/\s+/);
  const user=await prisma.user.upsert({where:{email},update:{},create:{email,passwordHash:await hashPassword(password),firstName,lastName:rest.join(" ")||"Admin",role:"SUPER_ADMIN"},select:{id:true,email:true,role:true}});
  console.log(`Administrator account ready: ${user.email} (${user.role}).`);
} finally { await prisma.$disconnect(); }
