import app, { closeApp, connectApp } from "./app.js";
import { env } from "./env.js";
import { prisma } from "./db.js";

await prisma.$connect();
await connectApp();
const server = app.listen(env.PORT, () => console.log(`AUTOX API listening on http://localhost:${env.PORT}`));
let closing = false;
async function shutdown(signal) {
  if (closing) return;
  closing = true;
  console.log(`${signal}: closing AUTOX API`);
  server.close(async () => {
    try { await closeApp(); process.exit(0); }
    catch (error) { console.error("Shutdown failed.", error); process.exit(1); }
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
