# Supabase API Documentation

This directory contains the Supabase API integration for the DUI Mobile App.

## Setup

1. Install dependencies:
   ```bash
   npm install @supabase/supabase-js
   ```

2. Create a `.env` file in the root directory with your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   You can find these values in your Supabase project settings: https://app.supabase.com/project/_/settings/api

## Usage

### Import the API functions

```typescript
import { getCheckpoints, getCheckpointById } from '@/lib/api';
```

### Get all checkpoints

```typescript
const result = await getCheckpoints();

if ('checkpoints' in result) {
  console.log(`Found ${result.count} checkpoints`);
  result.checkpoints.forEach(checkpoint => {
    console.log(checkpoint);
  });
} else {
  console.error(result.error);
}
```

### Get checkpoints with filters

```typescript
// Get upcoming checkpoints in California
const result = await getCheckpoints({ 
  state: 'CA', 
  upcoming: true 
});

// Get checkpoints in a specific city
const result = await getCheckpoints({ 
  city: 'Los Angeles' 
});

// Get checkpoints in a specific county
const result = await getCheckpoints({ 
  county: 'Los Angeles County' 
});
```

### Get a single checkpoint

```typescript
const result = await getCheckpointById(1);

if ('checkpoint' in result) {
  console.log(result.checkpoint);
} else {
  console.error(result.error);
}
```

### Create a checkpoint

```typescript
const result = await createCheckpoint({
  Date: '2024-12-25',
  State: 'CA',
  City: 'Los Angeles',
  County: 'Los Angeles County',
  Location: 'Highway 101',
  Time: '10:00 PM',
  Notes: 'Holiday checkpoint'
});
```

### Update a checkpoint

```typescript
const result = await updateCheckpoint(1, {
  Notes: 'Updated notes'
});
```

### Delete a checkpoint

```typescript
const result = await deleteCheckpoint(1);

if ('success' in result) {
  console.log('Checkpoint deleted successfully');
}
```

## API Functions

### `getCheckpoints(filters?)`

Fetches DUI checkpoints with optional filtering.

**Parameters:**
- `filters` (optional): `CheckpointFilters`
  - `state?: string` - Filter by state (e.g., "CA")
  - `city?: string` - Filter by city (partial match)
  - `county?: string` - Filter by county (partial match)
  - `upcoming?: boolean` - Only show future checkpoints

**Returns:** `Promise<CheckpointResponse | CheckpointError>`

### `getCheckpointById(id)`

Fetches a single DUI checkpoint by ID.

**Parameters:**
- `id: number` - The checkpoint ID

**Returns:** `Promise<SingleCheckpointResponse | CheckpointError>`

### `createCheckpoint(checkpoint)`

Creates a new checkpoint.

**Parameters:**
- `checkpoint: Omit<Checkpoint, 'id' | 'created_at' | 'updated_at'>` - The checkpoint data

**Returns:** `Promise<SingleCheckpointResponse | CheckpointError>`

### `updateCheckpoint(id, updates)`

Updates an existing checkpoint.

**Parameters:**
- `id: number` - The checkpoint ID
- `updates: Partial<Omit<Checkpoint, 'id' | 'created_at' | 'updated_at'>>` - The fields to update

**Returns:** `Promise<SingleCheckpointResponse | CheckpointError>`

### `deleteCheckpoint(id)`

Deletes a checkpoint.

**Parameters:**
- `id: number` - The checkpoint ID

**Returns:** `Promise<{ success: boolean } | CheckpointError>`

## Database Schema

The API expects a Supabase table named `Checkpoints` with the following structure:

- `id` (number, primary key)
- `Date` (string, date)
- `State` (string)
- `City` (string)
- `County` (string)
- `Location` (string, optional)
- `Time` (string, optional)
- `Notes` (string, optional)
- `created_at` (timestamp, auto-generated)
- `updated_at` (timestamp, auto-generated)

## Error Handling

All API functions return either a success response or an error object. Always check the response type:

```typescript
const result = await getCheckpoints();

if ('error' in result) {
  // Handle error
  console.error(result.error);
  if (result.details) {
    console.error(result.details);
  }
} else {
  // Handle success
  console.log(result.checkpoints);
}
```

