/**
 * sla.ts — SLA (Service Level Agreement) utilities for Suporte TI
 *
 * SLA limits per priority (time from ticket creation to resolution target):
 *   Baixa   → 72h
 *   Média   → 48h
 *   Alta    → 24h
 *   Urgente →  4h
 *
 * Only applies to tickets with status 'open' or 'in-progress'.
 * Resolved / closed tickets are considered completed — no SLA applies.
 */

export type SLAStatus = 'ok' | 'warning' | 'overdue';

/** SLA limit in hours per priority key */
export const SLA_LIMITS_H: Record<string, number> = {
  low:    72,
  medium: 48,
  high:   24,
  urgent:  4,
};

export interface SLAInfo {
  limitH: number;          // total SLA hours for this priority
  elapsedH: number;        // hours elapsed since ticket creation
  remainingH: number;      // hours remaining (negative = overdue)
  remainingMs: number;     // ms remaining (negative = overdue)
  percentUsed: number;     // 0–100+ (can exceed 100 when overdue)
  status: SLAStatus;       // ok | warning (>75%) | overdue (>100%)
  label: string;           // human-readable string e.g. "2h 30m restantes"
  isActive: boolean;       // false when ticket is resolved/closed
}

const ACTIVE_STATUSES = new Set(['open', 'in-progress']);

/**
 * Compute SLA info for a ticket.
 * @param priority   Ticket priority string (low | medium | high | urgent)
 * @param status     Ticket status string
 * @param createdAt  Date the ticket was created
 * @param now        Optional: current time (defaults to Date.now())
 */
export function computeSLA(
  priority: string,
  status: string,
  createdAt: Date,
  now: Date = new Date()
): SLAInfo {
  const limitH = SLA_LIMITS_H[priority] ?? 48;
  const limitMs = limitH * 3_600_000;
  const isActive = ACTIVE_STATUSES.has(status);

  const elapsedMs = now.getTime() - createdAt.getTime();
  const elapsedH  = elapsedMs / 3_600_000;
  const remainingMs = limitMs - elapsedMs;
  const remainingH  = remainingMs / 3_600_000;
  const percentUsed = Math.min((elapsedMs / limitMs) * 100, 999);

  let slaStatus: SLAStatus = 'ok';
  if (!isActive) {
    slaStatus = 'ok'; // resolved/closed — neutral
  } else if (remainingMs <= 0) {
    slaStatus = 'overdue';
  } else if (percentUsed >= 75) {
    slaStatus = 'warning';
  }

  const label = isActive ? formatRemaining(remainingMs) : '—';

  return {
    limitH,
    elapsedH,
    remainingH,
    remainingMs,
    percentUsed,
    status: slaStatus,
    label,
    isActive,
  };
}

/** Format a millisecond duration into a human-readable Portuguese string */
function formatRemaining(ms: number): string {
  if (ms <= 0) {
    const over = Math.abs(ms);
    const h = Math.floor(over / 3_600_000);
    const m = Math.floor((over % 3_600_000) / 60_000);
    if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h em atraso`;
    if (h > 0)   return `${h}h ${m}m em atraso`;
    return `${m}m em atraso`;
  }
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h restantes`;
  if (h > 0)   return `${h}h ${m}m restantes`;
  return `${m}m restantes`;
}

/** Colour tokens for each SLA status */
export const SLA_COLORS: Record<SLAStatus, { bg: string; text: string; bar: string; border: string }> = {
  ok:      { bg: '#f0fdf4', text: '#065f46', bar: '#10b981', border: '#bbf7d0' },
  warning: { bg: '#fffbeb', text: '#92400e', bar: '#f59e0b', border: '#fde68a' },
  overdue: { bg: '#fef2f2', text: '#991b1b', bar: '#ef4444', border: '#fecaca' },
};