import { getCheckpointById, getCheckpoints } from '@/lib/api';
import type {
    Checkpoint,
    CheckpointFilters
} from '@/lib/types/checkpoint';
import { useEffect, useState } from 'react';

/**
 * Hook to fetch and manage checkpoints list
 *
 * @param filters - Optional filters for checkpoints
 * @param autoFetch - Whether to fetch automatically on mount (default: true)
 * @returns Object with checkpoints data, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * function CheckpointsList() {
 *   const { checkpoints, loading, error, refetch } = useCheckpoints({ 
 *     state: 'CA', 
 *     upcoming: true 
 *   });
 *
 *   if (loading) return <Text>Loading...</Text>;
 *   if (error) return <Text>Error: {error}</Text>;
 *
 *   return (
 *     <View>
 *       {checkpoints.map(checkpoint => (
 *         <Text key={checkpoint.id}>{checkpoint.City}</Text>
 *       ))}
 *     </View>
 *   );
 * }
 * ```
 */
export function useCheckpoints(
  filters?: CheckpointFilters,
  autoFetch: boolean = true
) {
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState<number>(0);

  const fetchCheckpoints = async () => {
    setLoading(true);
    setError(null);

    const result = await getCheckpoints(filters);

    if ('error' in result) {
      setError(result.error);
      setCheckpoints([]);
      setCount(0);
    } else {
      setCheckpoints(result.checkpoints);
      setCount(result.count);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (autoFetch) {
      fetchCheckpoints();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters?.state, filters?.city, filters?.county, filters?.upcoming]);

  return {
    checkpoints,
    count,
    loading,
    error,
    refetch: fetchCheckpoints,
  };
}

/**
 * Hook to fetch a single checkpoint by ID
 *
 * @param id - The checkpoint ID
 * @param autoFetch - Whether to fetch automatically on mount (default: true)
 * @returns Object with checkpoint data, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * function CheckpointDetail({ checkpointId }: { checkpointId: number }) {
 *   const { checkpoint, loading, error, refetch } = useCheckpoint(checkpointId);
 *
 *   if (loading) return <Text>Loading...</Text>;
 *   if (error) return <Text>Error: {error}</Text>;
 *   if (!checkpoint) return <Text>Not found</Text>;
 *
 *   return (
 *     <View>
 *       <Text>{checkpoint.City}, {checkpoint.State}</Text>
 *       <Text>{checkpoint.Date}</Text>
 *     </View>
 *   );
 * }
 * ```
 */
export function useCheckpoint(id: number | null, autoFetch: boolean = true) {
  const [checkpoint, setCheckpoint] = useState<Checkpoint | null>(null);
  const [loading, setLoading] = useState<boolean>(autoFetch && id !== null);
  const [error, setError] = useState<string | null>(null);

  const fetchCheckpoint = async () => {
    if (!id) {
      setCheckpoint(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const result = await getCheckpointById(id);

    if ('error' in result) {
      setError(result.error);
      setCheckpoint(null);
    } else {
      setCheckpoint(result.checkpoint);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (autoFetch && id !== null) {
      fetchCheckpoint();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return {
    checkpoint,
    loading,
    error,
    refetch: fetchCheckpoint,
  };
}

