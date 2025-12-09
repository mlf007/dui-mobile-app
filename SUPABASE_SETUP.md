# Supabase API Setup Guide

This guide will help you set up the Supabase API for your DUI Mobile App.

## Prerequisites

- A Supabase account and project (sign up at https://supabase.com)
- Your Supabase project URL and anon key

## Installation

1. Install the Supabase client library:
   ```bash
   npm install @supabase/supabase-js
   ```

2. Install expo-constants (if not already installed):
   ```bash
   npm install expo-constants
   ```

## Configuration

### Option 1: Environment Variables (Recommended)

Create a `.env` file in the root of your project:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Note:** Make sure `.env` is in your `.gitignore` file to keep your keys secure!

### Option 2: app.config.js

Alternatively, you can use `app.config.js` (instead of `app.json`) to configure environment variables:

```javascript
export default {
  expo: {
    // ... your existing config
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
  },
};
```

## Database Setup

In your Supabase project, create a table named `Checkpoints` with the following structure:

```sql
CREATE TABLE "Checkpoints" (
  id BIGSERIAL PRIMARY KEY,
  "Date" DATE NOT NULL,
  "State" TEXT NOT NULL,
  "City" TEXT NOT NULL,
  "County" TEXT NOT NULL,
  "Location" TEXT,
  "Time" TEXT,
  "Notes" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) if needed
ALTER TABLE "Checkpoints" ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow public read access (adjust as needed)
CREATE POLICY "Allow public read access" ON "Checkpoints"
  FOR SELECT USING (true);
```

## Usage Examples

### Using the API directly

```typescript
import { getCheckpoints, getCheckpointById } from '@/lib/api';

// Get all checkpoints
const result = await getCheckpoints();
if ('checkpoints' in result) {
  console.log(result.checkpoints);
}

// Get filtered checkpoints
const filtered = await getCheckpoints({ 
  state: 'CA', 
  upcoming: true 
});

// Get single checkpoint
const single = await getCheckpointById(1);
if ('checkpoint' in single) {
  console.log(single.checkpoint);
}
```

### Using React Hooks

```typescript
import { useCheckpoints, useCheckpoint } from '@/hooks/use-checkpoints';

function CheckpointsList() {
  const { checkpoints, loading, error, refetch } = useCheckpoints({ 
    state: 'CA',
    upcoming: true 
  });

  if (loading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error}</Text>;

  return (
    <FlatList
      data={checkpoints}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <View>
          <Text>{item.City}, {item.State}</Text>
          <Text>{item.Date}</Text>
        </View>
      )}
      refreshing={loading}
      onRefresh={refetch}
    />
  );
}
```

## File Structure

```
lib/
├── api/
│   ├── checkpoints.ts    # API functions for checkpoints
│   └── index.ts          # Central export point
├── supabase/
│   └── client.ts         # Supabase client configuration
├── types/
│   └── checkpoint.ts     # TypeScript type definitions
└── README.md             # Detailed API documentation

hooks/
└── use-checkpoints.ts    # React hooks for easy API usage
```

## Getting Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Click on "Settings" (gear icon)
3. Click on "API" in the left sidebar
4. You'll find:
   - **Project URL**: Under "Project URL"
   - **anon/public key**: Under "Project API keys" → "anon public"

## Troubleshooting

### "Missing Supabase credentials" warning

Make sure you've set the environment variables correctly:
- Check that `.env` file exists and has the correct variable names
- Restart your Expo development server after adding environment variables
- Verify the variable names start with `EXPO_PUBLIC_`

### "Failed to fetch checkpoints" error

- Verify your Supabase URL and anon key are correct
- Check that the `Checkpoints` table exists in your database
- Ensure Row Level Security policies allow read access (if RLS is enabled)
- Check your internet connection

### TypeScript errors

Make sure all dependencies are installed:
```bash
npm install @supabase/supabase-js expo-constants
```

## Next Steps

- Review the detailed API documentation in `lib/README.md`
- Customize the API functions to match your specific needs
- Add authentication if you need user-specific data
- Set up proper Row Level Security policies in Supabase

