import { useState, useEffect } from 'react';
import { SharedFlowsService, UserFlowsService } from '../supabase/flows';
import type { SharedFlow, UserFlow, FlowFilter } from '../types';

const sharedFlowsService = new SharedFlowsService();
const userFlowsService = new UserFlowsService();

export function usePublicFlows(filter: FlowFilter = {}) {
  const [flows, setFlows] = useState<SharedFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchFlows() {
      try {
        setLoading(true);
        setError(null);
        const data = await sharedFlowsService.getDiscoverableFlows(filter);
        if (!cancelled) {
          setFlows(data);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to fetch flows'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchFlows();

    return () => {
      cancelled = true;
    };
  }, [JSON.stringify(filter)]);

  const refetch = () => {
    setLoading(true);
    sharedFlowsService
      .getPublicFlows(filter)
      .then(setFlows)
      .catch((err: any) =>
        setError(err instanceof Error ? err.message : 'Failed to fetch flows')
      )
      .finally(() => setLoading(false));
  };

  return { flows, loading, error, refetch };
}

export function useSharedFlow(id: string | null) {
  const [flow, setFlow] = useState<SharedFlow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setFlow(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function fetchFlow() {
      try {
        setLoading(true);
        setError(null);
        const data = await sharedFlowsService.getSharedFlow(id!);
        if (!cancelled) {
          setFlow(data);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch flow');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchFlow();

    return () => {
      cancelled = true;
    };
  }, [id]);

  return { flow, loading, error };
}

export function useUserFlows() {
  const [flows, setFlows] = useState<UserFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchFlows() {
      try {
        setLoading(true);
        setError(null);
        const data = await userFlowsService.getUserFlows();
        if (!cancelled) {
          setFlows(data);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to fetch flows'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchFlows();

    return () => {
      cancelled = true;
    };
  }, []);

  const refetch = () => {
    setLoading(true);
    userFlowsService
      .getUserFlows()
      .then(setFlows)
      .catch((err: any) =>
        setError(err instanceof Error ? err.message : 'Failed to fetch flows')
      )
      .finally(() => setLoading(false));
  };

  return { flows, loading, error, refetch };
}

// New hook for managing user's shared flows
export function useUserSharedFlows() {
  const [flows, setFlows] = useState<SharedFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchFlows = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await sharedFlowsService.getUserSharedFlows();
        if (!cancelled) {
          setFlows(data);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to fetch shared flows'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchFlows();

    return () => {
      cancelled = true;
    };
  }, []);

  const updateVisibility = async (id: string, isPublic: boolean) => {
    try {
      await sharedFlowsService.updateSharedFlowVisibility(id, isPublic);
      setFlows((prev) =>
        prev.map((flow) =>
          flow.id === id ? { ...flow, is_public: isPublic } : flow
        )
      );
    } catch (err: any) {
      throw new Error(
        err instanceof Error ? err.message : 'Failed to update visibility'
      );
    }
  };

  const deleteFlow = async (id: string) => {
    try {
      await sharedFlowsService.deleteSharedFlow(id);
      setFlows((prev) => prev.filter((flow) => flow.id !== id));
    } catch (err: any) {
      throw new Error(
        err instanceof Error ? err.message : 'Failed to delete flow'
      );
    }
  };

  const refetch = () => {
    setLoading(true);
    sharedFlowsService
      .getUserSharedFlows()
      .then(setFlows)
      .catch((err: any) =>
        setError(
          err instanceof Error ? err.message : 'Failed to fetch shared flows'
        )
      )
      .finally(() => setLoading(false));
  };

  return { flows, loading, error, updateVisibility, deleteFlow, refetch };
}

// Legacy exports for backward compatibility
export function usePopularTags() {
  return { tags: [], loading: false, error: null };
}
