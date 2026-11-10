export const blockingBookingStatuses = Object.freeze(["PENDING", "APPROVED", "ACTIVE"]);

export function bookingWhereForUser(user) {
  return user.role === "CUSTOMER" ? { customerId: user.id } : {};
}

export function hasDateOverlap(existing, pickupAt, returnAt, excludeId) {
  return existing.some(booking => booking.id !== excludeId && blockingBookingStatuses.includes(booking.status) && new Date(booking.pickupAt) < new Date(returnAt) && new Date(booking.returnAt) > new Date(pickupAt));
}

export function rentalDays(pickupAt, returnAt) {
  return Math.ceil((new Date(returnAt) - new Date(pickupAt)) / 86_400_000);
}

export function calculateRentalTotal(dailyRate, pickupAt, returnAt, weeklyRate = Number(dailyRate) * 6, monthlyRate = Number(dailyRate) * 25.5) {
  const days = rentalDays(pickupAt, returnAt);
  if (!Number.isFinite(days) || days < 1) throw new RangeError("A rental period must be at least one day.");
  const months = Math.floor(days / 30);
  const remainder = days % 30;
  const weeks = Math.floor(remainder / 7);
  const daysLeft = remainder % 7;
  return months * Number(monthlyRate) + weeks * Number(weeklyRate) + daysLeft * Number(dailyRate);
}
