/**
 * warranty.ts — Asset warranty lifecycle utilities for Suporte TI
 *
 * Thresholds:
 *   expired   — warranty_expires_at is in the past
 *   expiring  — expires within 30 days
 *   ok        — more than 30 days remaining
 *   none      — no warranty date set
 */

export type WarrantyStatus = 'ok' | 'expiring' | 'expired' | 'none';

export interface WarrantyInfo {
  status: WarrantyStatus;
  daysRemaining: number;   // negative = days overdue
  label: string;           // human-readable Portuguese string
  expiresAt: Date | null;
}

const EXPIRING_THRESHOLD_DAYS = 30;

/**
 * Compute warranty info for an asset.
 * @param warrantyExpiresAt  ISO date string or null
 * @param now                Optional: current date (defaults to today)
 */
export function computeWarranty(
  warrantyExpiresAt: string | null | undefined,
  now: Date = new Date()
): WarrantyInfo {
  if (!warrantyExpiresAt) {
    return { status: 'none', daysRemaining: 0, label: 'Sem garantia', expiresAt: null };
  }

  const expiresAt = new Date(warrantyExpiresAt);
  // Compare at day granularity — strip time component
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const expDay = new Date(expiresAt.getFullYear(), expiresAt.getMonth(), expiresAt.getDate());

  const diffMs = expDay.getTime() - nowDay.getTime();
  const daysRemaining = Math.round(diffMs / 86_400_000);

  let status: WarrantyStatus;
  if (daysRemaining < 0) {
    status = 'expired';
  } else if (daysRemaining <= EXPIRING_THRESHOLD_DAYS) {
    status = 'expiring';
  } else {
    status = 'ok';
  }

  const label = formatWarrantyLabel(status, daysRemaining, expiresAt);

  return { status, daysRemaining, label, expiresAt };
}

function formatWarrantyLabel(status: WarrantyStatus, days: number, expiresAt: Date): string {
  const dateStr = expiresAt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  if (status === 'expired') {
    const over = Math.abs(days);
    return over === 0 ? `Venceu hoje` : `Vencida há ${over} dia${over !== 1 ? 's' : ''}`;
  }
  if (status === 'expiring') {
    if (days === 0) return `Vence hoje`;
    if (days === 1) return `Vence amanhã`;
    return `Vence em ${days} dias (${dateStr})`;
  }
  return `Garantia até ${dateStr}`;
}

/** Colour tokens per warranty status */
export const WARRANTY_COLORS: Record<WarrantyStatus, { bg: string; text: string; border: string; dot: string }> = {
  ok:       { bg: '#f0fdf4', text: '#065f46', border: '#bbf7d0', dot: '#10b981' },
  expiring: { bg: '#fffbeb', text: '#92400e', border: '#fde68a', dot: '#f59e0b' },
  expired:  { bg: '#fef2f2', text: '#991b1b', border: '#fecaca', dot: '#ef4444' },
  none:     { bg: '#f9fafb', text: '#9ca3af', border: '#e5e7eb', dot: '#d1d5db' },
};