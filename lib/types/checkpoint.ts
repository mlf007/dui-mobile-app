/**
 * Checkpoint type definition
 * Represents a DUI checkpoint entry from the database
 */
export interface Checkpoint {
  id: number;
  Date: string;
  State: string;
  City: string;
  County: string;
  Location?: string;
  Time?: string;
  Notes?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Response type for list of checkpoints
 */
export interface CheckpointResponse {
  success: boolean;
  count: number;
  checkpoints: Checkpoint[];
}

/**
 * Response type for single checkpoint
 */
export interface SingleCheckpointResponse {
  success: boolean;
  checkpoint: Checkpoint;
}

/**
 * Error response type
 */
export interface CheckpointError {
  error: string;
  details?: string;
}

/**
 * Query parameters for filtering checkpoints
 */
export interface CheckpointFilters {
  state?: string;
  city?: string;
  county?: string;
  upcoming?: boolean;
}

