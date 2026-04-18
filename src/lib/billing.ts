export function nextBillingAnniversary(startedAt: Date, now: Date = new Date()): Date {
  const anniversary = new Date(startedAt);
  while (anniversary.getTime() <= now.getTime()) {
    anniversary.setMonth(anniversary.getMonth() + 1);
  }
  return anniversary;
}

export function daysBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}
