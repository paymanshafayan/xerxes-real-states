export const VALID_PAYMENT_TYPES = ["deposit", "booking_fee", "consultation"] as const;

export type PaymentType = (typeof VALID_PAYMENT_TYPES)[number];

export function isValidPaymentType(type: string): type is PaymentType {
  return (VALID_PAYMENT_TYPES as readonly string[]).includes(type);
}

export function isValidPaymentAmount(amount: unknown): amount is number {
  const n = Number(amount);
  return Number.isFinite(n) && n > 0;
}
