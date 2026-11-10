import test from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword, createCsrfToken, validCsrfToken } from "../src/server/security.js";
import { bookingWhereForUser, calculateRentalTotal, hasDateOverlap } from "../src/server/bookingRules.js";

test("password hashes verify without retaining the cleartext password", async () => {
  const password = "DriveSafe2026!Strong";
  const hash = await hashPassword(password);
  assert.match(hash, /^scrypt\$/);
  assert.notEqual(hash, password);
  assert.equal(await verifyPassword(password, hash), true);
  assert.equal(await verifyPassword("wrong-password", hash), false);
});

test("CSRF tokens are bound to the current session secret", () => {
  const session = {};
  const token = createCsrfToken(session);
  assert.equal(validCsrfToken(session, token), true);
  assert.equal(validCsrfToken(session, `${token}x`), false);
  assert.equal(validCsrfToken({}, token), false);
});

test("booking dates count complete billable days and reject overlapping active holds", () => {
  const start = new Date("2027-01-05T10:00:00Z");
  const end = new Date("2027-01-08T09:00:00Z");
  assert.equal(calculateRentalTotal(80_000, start, end), 240_000);
  const bookings = [{ id: "1", status: "PENDING", pickupAt: "2027-01-06T00:00:00Z", returnAt: "2027-01-07T00:00:00Z" }];
  assert.equal(hasDateOverlap(bookings, start, end), true);
  assert.equal(hasDateOverlap(bookings, start, end, "1"), false);
  assert.equal(hasDateOverlap([{ ...bookings[0], status: "REJECTED" }], start, end), false);
});

test("booking history is restricted to the signed-in customer", () => {
  assert.deepEqual(bookingWhereForUser({ id: "customer-1", role: "CUSTOMER" }), { customerId: "customer-1" });
  assert.deepEqual(bookingWhereForUser({ id: "manager-1", role: "MANAGER" }), {});
  assert.deepEqual(bookingWhereForUser({ id: "admin-1", role: "SUPER_ADMIN" }), {});
});
