import { supabase } from '@/lib/supabase/client';
import type {
    Checkpoint,
    CheckpointError,
    CheckpointFilters,
    CheckpointResponse,
    SingleCheckpointResponse,
} from '@/lib/types/checkpoint';

/**
 * Fetch DUI checkpoints with optional filtering
 *
 * @param filters - Optional filters for state, city, county, and upcoming checkpoints
 * @returns Promise with checkpoint response or error
 *
 * @example
 * ```ts
 * // Get all checkpoints
 * const result = await getCheckpoints();
 *
 * // Get upcoming checkpoints in California
 * const result = await getCheckpoints({ state: 'CA', upcoming: true });
 *
 * // Get checkpoints in a specific city
 * const result = await getCheckpoints({ city: 'Los Angeles' });
 * ```
 */
export async function getCheckpoints(
  filters?: CheckpointFilters
): Promise<CheckpointResponse | CheckpointError> {
  try {
    // Start building the query
    let query = supabase
      .from('Checkpoints')
      .select('*')
      .order('Date', { ascending: true });

    // Apply filters if provided
    if (filters?.state) {
      query = query.ilike('State', filters.state);
    }

    if (filters?.city) {
      query = query.ilike('City', `%${filters.city}%`);
    }

    if (filters?.county) {
      query = query.ilike('County', `%${filters.county}%`);
    }

    // Filter for upcoming checkpoints only (date >= today)
    if (filters?.upcoming) {
      const today = new Date().toISOString().split('T')[0];
      query = query.gte('Date', today);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return {
        error: 'Failed to fetch checkpoints',
        details: error.message,
      };
    }

    return {
      success: true,
      count: data?.length ?? 0,
      checkpoints: (data as Checkpoint[]) ?? [],
    };
  } catch (error) {
    console.error('API error:', error);
    return {
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch a single DUI checkpoint by ID
 *
 * @param id - The checkpoint ID
 * @returns Promise with single checkpoint response or error
 *
 * @example
 * ```ts
 * const result = await getCheckpointById(1);
 * if ('checkpoint' in result) {
 *   console.log(result.checkpoint);
 * }
 * ```
 */
export async function getCheckpointById(
  id: number
): Promise<SingleCheckpointResponse | CheckpointError> {
  try {
    const { data, error } = await supabase
      .from('Checkpoints')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          error: 'Checkpoint not found',
        };
      }
      console.error('Supabase error:', error);
      return {
        error: 'Failed to fetch checkpoint',
        details: error.message,
      };
    }

    return {
      success: true,
      checkpoint: data as Checkpoint,
    };
  } catch (error) {
    console.error('API error:', error);
    return {
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create a new checkpoint
 *
 * @param checkpoint - The checkpoint data to create
 * @returns Promise with created checkpoint or error
 */
export async function createCheckpoint(
  checkpoint: Omit<Checkpoint, 'id' | 'created_at' | 'updated_at'>
): Promise<SingleCheckpointResponse | CheckpointError> {
  try {
    const { data, error } = await supabase
      .from('Checkpoints')
      .insert([checkpoint])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return {
        error: 'Failed to create checkpoint',
        details: error.message,
      };
    }

    return {
      success: true,
      checkpoint: data as Checkpoint,
    };
  } catch (error) {
    console.error('API error:', error);
    return {
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update an existing checkpoint
 *
 * @param id - The checkpoint ID
 * @param updates - Partial checkpoint data to update
 * @returns Promise with updated checkpoint or error
 */
export async function updateCheckpoint(
  id: number,
  updates: Partial<Omit<Checkpoint, 'id' | 'created_at' | 'updated_at'>>
): Promise<SingleCheckpointResponse | CheckpointError> {
  try {
    const { data, error } = await supabase
      .from('Checkpoints')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          error: 'Checkpoint not found',
        };
      }
      console.error('Supabase error:', error);
      return {
        error: 'Failed to update checkpoint',
        details: error.message,
      };
    }

    return {
      success: true,
      checkpoint: data as Checkpoint,
    };
  } catch (error) {
    console.error('API error:', error);
    return {
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete a checkpoint
 *
 * @param id - The checkpoint ID
 * @returns Promise with success status or error
 */
export async function deleteCheckpoint(
  id: number
): Promise<{ success: boolean } | CheckpointError> {
  try {
    const { error } = await supabase
      .from('Checkpoints')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          error: 'Checkpoint not found',
        };
      }
      console.error('Supabase error:', error);
      return {
        error: 'Failed to delete checkpoint',
        details: error.message,
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('API error:', error);
    return {
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

