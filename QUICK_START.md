# Quick Start Guide - Running and Testing the API

## Step 1: Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Get your credentials:**
1. Go to https://app.supabase.com
2. Select your project (or create one)
3. Go to Settings → API
4. Copy the "Project URL" and "anon public" key

## Step 2: Install Dependencies (if not already done)

```bash
npm install
```

## Step 3: Start the Expo Development Server

```bash
npm start
# or
npx expo start
```

This will:
- Start the Metro bundler
- Show a QR code for Expo Go
- Provide options to open on iOS/Android/Web

### Options to Run:

**For iOS Simulator:**
```bash
npm run ios
# or press 'i' in the terminal
```

**For Android Emulator:**
```bash
npm run android
# or press 'a' in the terminal
```

**For Web Browser:**
```bash
npm run web
# or press 'w' in the terminal
```

## Step 4: Test the API

1. **Navigate to the "Test API" tab** in the app (bottom navigation)

2. **Test "Get All Checkpoints":**
   - Tap the "Get All Checkpoints" button
   - This will fetch all checkpoints from your Supabase database
   - Results will appear below the button

3. **Test Filtered Checkpoints:**
   - Enter a state (e.g., "CA") or city (e.g., "Los Angeles")
   - Toggle "Upcoming only" if you want future checkpoints
   - Tap "Get Filtered Checkpoints"
   - Results will show filtered checkpoints

4. **Test Get By ID:**
   - Enter a checkpoint ID (e.g., "1")
   - Tap "Get Checkpoint"
   - Full checkpoint details will appear

## Step 5: Check Console for Errors

If you see errors:
- Check that your `.env` file has the correct credentials
- Verify your Supabase table is named `Checkpoints` (case-sensitive)
- Check that Row Level Security (RLS) allows read access
- Look at the terminal/console for detailed error messages

## Troubleshooting

### "Missing Supabase credentials" warning
- Make sure `.env` file exists in the root directory
- Restart the Expo server after creating/editing `.env`
- Variable names must start with `EXPO_PUBLIC_`

### "Failed to fetch checkpoints" error
- Verify Supabase URL and key are correct
- Check internet connection
- Verify the `Checkpoints` table exists in Supabase
- Check RLS policies allow public read access

### App won't start
- Make sure all dependencies are installed: `npm install`
- Clear cache: `npx expo start -c`
- Check for TypeScript errors: `npm run lint`

## Database Setup

If you haven't created the table yet, run this SQL in your Supabase SQL Editor:

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

-- Enable Row Level Security
ALTER TABLE "Checkpoints" ENABLE ROW LEVEL SECURITY;

-- Allow public read access (adjust as needed)
CREATE POLICY "Allow public read access" ON "Checkpoints"
  FOR SELECT USING (true);

-- Insert a test checkpoint
INSERT INTO "Checkpoints" ("Date", "State", "City", "County", "Location", "Time", "Notes")
VALUES 
  ('2024-12-25', 'CA', 'Los Angeles', 'Los Angeles County', 'Highway 101', '10:00 PM', 'Holiday checkpoint'),
  ('2024-12-31', 'CA', 'San Francisco', 'San Francisco County', 'Golden Gate Bridge', '11:00 PM', 'New Year checkpoint');
```

## Next Steps

- Review the API documentation in `lib/README.md`
- Check the setup guide in `SUPABASE_SETUP.md`
- Customize the test screen or create your own components using the hooks

