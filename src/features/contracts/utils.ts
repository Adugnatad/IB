import type { Contract } from '@/types/contracts';

/** Convert ISO date string to YYYY-MM-DD for input type="date". */
export function isoToDateInputValue(isoString: string | null | undefined): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

/**
 * Show the segment after the last `-` for dashed IDs (standard UUID shape), e.g.
 * `2534560e-b470-484b-b8b7-7e9a57280e32` → `7e9a57280e32`. If there is no dash, returns the value unchanged.
 */
export function shortDisplayId(value: string | null | undefined): string {
  const s = (value ?? '').trim();
  if (!s) return '';
  const i = s.lastIndexOf('-');
  if (i >= 0 && i < s.length - 1) return s.slice(i + 1);
  return s;
}

export function formatContractDate(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

export function getContractStatusBadgeClass(status: Contract['status']): string {
  switch (status) {
    case 'ACTIVE':
      return 'bg-success';
    case 'PENDING':
      return 'bg-warning';
    case 'SUSPENDED':
    case 'INACTIVE':
      return 'bg-secondary';
    case 'EXPIRED':
    case 'TERMINATED':
      return 'bg-danger';
    default:
      return 'bg-light text-dark';
  }
}
