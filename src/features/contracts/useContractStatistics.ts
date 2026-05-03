'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchContractStatistics } from '@/services/api/contracts-api';
import type { ContractStatistics } from '@/types/contracts';

const EMPTY_STATS: ContractStatistics = {
  totalContracts: 0,
  activeContracts: 0,
  pendingContracts: 0,
  suspendedContracts: 0,
  expiredContracts: 0,
  terminatedContracts: 0,
  operationalContracts: 0,
};

export function useContractStatistics() {
  const [stats, setStats] = useState<ContractStatistics>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchContractStatistics();
      setStats({ ...EMPTY_STATS, ...(data ?? {}) });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { stats, loading, error, refresh };
}
