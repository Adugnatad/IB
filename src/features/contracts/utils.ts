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
