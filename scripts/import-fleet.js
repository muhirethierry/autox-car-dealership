import { readFile } from "node:fs/promises";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client.js";

const source = await readFile(new URL("../fleet-data.js", import.meta.url), "utf8");
const match = source.match(/window\.AUTOX_FLEET_DEFAULTS\s*=\s*(\[.*\])\s*;\s*$/s);
if (!match) throw new Error("Could not find the default fleet array in fleet-data.js.");
const defaults = JSON.parse(match[1]);
const url = new URL(process.env.DATABASE_URL || "");
if (!url.hostname || !url.pathname.slice(1)) throw new Error("Set DATABASE_URL in your local .env file.");
const apply = process.argv.includes("--apply");
const prisma = new PrismaClient({ adapter: new PrismaMariaDb({ host: url.hostname, port: Number(url.port || 3306), user: decodeURIComponent(url.username), password: decodeURIComponent(url.password), database: decodeURIComponent(url.pathname.slice(1)), connectionLimit: 3 }) });
try {
  const existing = await prisma.vehicle.findMany({ select: { id: true } });
  const existingIds = new Set(existing.map(vehicle => vehicle.id));
  const rows = defaults.filter(car => !existingIds.has(car.id)).map(car => {
    const daily = Number(car.dailyRate) || 0;
    return {
      id: car.id,
      brand: car.make,
      model: car.model,
      year: Number(car.year) || new Date().getFullYear(),
      category: car.category || car.type || "Other",
      transmission: car.transmission || "Automatic",
      fuelType: car.fuel || "Unknown",
      seats: Number(car.seats) || 5,
      dailyRate: daily,
      weeklyRate: Number(car.weeklyRate) || daily * 6,
      monthlyRate: Number(car.monthlyRate) || Math.round(daily * 25.5),
      currency: "RWF",
      description: car.description || `${car.make} ${car.model} rental vehicle.`,
      imageUrl: car.image || car.fallbackImage || null,
      status: car.available === false ? "UNAVAILABLE" : "AVAILABLE"
    };
  });
  console.log(`Default fleet: ${defaults.length}; existing database vehicles: ${existing.length}; new records: ${rows.length}.`);
  if (!apply) { console.log("Dry run only. Run npm run fleet:import -- --apply to insert missing default vehicles."); process.exitCode = 0; }
  else if (rows.length) { await prisma.vehicle.createMany({ data: rows, skipDuplicates: true }); console.log("Missing default vehicles imported. Existing records were left unchanged."); }
  else console.log("Nothing to import.");
} finally { await prisma.$disconnect(); }
