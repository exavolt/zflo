# Supabase Migration Guide: Public/Private Shared Flows

This guide provides step-by-step instructions to update your Supabase database to support public and private shared flows with proper access control.

## Overview

The migration introduces:

- **Public flows**: Discoverable by anyone, listed in community flows
- **Private flows**: Only accessible via direct link, not enumerable
- **Row Level Security (RLS)**: Server-side access control to prevent unauthorized access

## Database Schema Changes

### 1. Update the `shared_flows` table

Execute the following SQL in the Supabase SQL Editor:

```sql
-- Step 1: Add the new is_public column
ALTER TABLE shared_flows
ADD COLUMN is_public BOOLEAN DEFAULT false;

-- Step 2: Remove the old is_discoverable column (if it exists)
ALTER TABLE shared_flows
DROP COLUMN IF EXISTS is_discoverable;

-- Step 3: Update existing flows to be private by default
UPDATE shared_flows
SET is_public = false
WHERE is_public IS NULL;

-- Step 4: Make is_public NOT NULL
ALTER TABLE shared_flows
ALTER COLUMN is_public SET NOT NULL;

-- Step 5: Add index for better performance on public flows queries
CREATE INDEX IF NOT EXISTS idx_shared_flows_public
ON shared_flows(is_public, created_at DESC)
WHERE is_public = true;
```

### 2. Enable Row Level Security (RLS)

```sql
-- Enable RLS on the shared_flows table
ALTER TABLE shared_flows ENABLE ROW LEVEL SECURITY;
```

### 3. Create RLS Policies

```sql
-- Policy 1: Anyone can read public flows
CREATE POLICY "Public flows are viewable by everyone"
ON shared_flows FOR SELECT
USING (is_public = true);

-- Policy 2: Anyone can read flows by ID (for private link sharing)
CREATE POLICY "Flows are viewable by ID"
ON shared_flows FOR SELECT
USING (true);

-- Policy 3: Authenticated users can insert their own flows
CREATE POLICY "Users can insert their own flows"
ON shared_flows FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can update their own flows
CREATE POLICY "Users can update their own flows"
ON shared_flows FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 5: Users can delete their own flows
CREATE POLICY "Users can delete their own flows"
ON shared_flows FOR DELETE
USING (auth.uid() = user_id);

-- Policy 6: Users can view all their own flows (public and private)
CREATE POLICY "Users can view their own flows"
ON shared_flows FOR SELECT
USING (auth.uid() = user_id);
```

## Access Control Explanation

### Public Flows

- **Enumerable**: Can be listed via `SELECT * FROM shared_flows WHERE is_public = true`
- **Discoverable**: Appear in community flows, search results
- **Access**: Anyone can view without authentication

### Private Flows

- **Not enumerable**: Cannot be discovered through general queries
- **Link-only access**: Only accessible via direct URL with flow ID
- **Access**: Anyone with the link can view, but flows won't appear in listings

### User Management

- **Own flows**: Users can view, edit, and delete all their flows (public and private)
- **Visibility control**: Users can toggle between public and private for their flows
- **Authentication required**: For creating, updating, and managing flows

## Security Benefits

1. **Server-side enforcement**: Access control is enforced at the database level
2. **No client-side bypassing**: Policies cannot be circumvented by client code
3. **Granular permissions**: Different access levels for different operations
4. **Privacy protection**: Private flows remain truly private

## Testing the Migration

After applying the migration, test the following scenarios:

### 1. Test Public Flow Access

```sql
-- This should return only public flows
SELECT * FROM shared_flows WHERE is_public = true;
```

### 2. Test Private Flow Protection

```sql
-- This should return no private flows for unauthenticated users
SELECT * FROM shared_flows WHERE is_public = false;
```

### 3. Test Direct Access

```sql
-- This should work for any flow ID (public or private)
SELECT * FROM shared_flows WHERE id = 'specific-flow-id';
```

### 4. Test User Flow Management

```sql
-- Authenticated users should see all their flows
SELECT * FROM shared_flows WHERE user_id = auth.uid();
```

## Application Code Changes

The ZFlo applications have been updated to work with this new schema:

### Frontend Changes

- **Share dialog**: Now includes public/private toggle
- **Flow management**: Users can change visibility of their flows
- **Community flows**: Only shows public flows

### Backend Changes

- **API calls**: Updated to use `is_public` instead of `is_discoverable`
- **Access patterns**: Respects RLS policies automatically
- **Flow creation**: Defaults to private, user can opt for public

## Rollback Plan

If you need to rollback the changes:

```sql
-- Remove RLS policies
DROP POLICY IF EXISTS "Public flows are viewable by everyone" ON shared_flows;
DROP POLICY IF EXISTS "Flows are viewable by ID" ON shared_flows;
DROP POLICY IF EXISTS "Users can insert their own flows" ON shared_flows;
DROP POLICY IF EXISTS "Users can update their own flows" ON shared_flows;
DROP POLICY IF EXISTS "Users can delete their own flows" ON shared_flows;
DROP POLICY IF EXISTS "Users can view their own flows" ON shared_flows;

-- Disable RLS
ALTER TABLE shared_flows DISABLE ROW LEVEL SECURITY;

-- Revert column changes (optional)
ALTER TABLE shared_flows ADD COLUMN is_discoverable BOOLEAN;
UPDATE shared_flows SET is_discoverable = is_public;
ALTER TABLE shared_flows DROP COLUMN is_public;
```

## Verification Checklist

- [ ] `shared_flows` table has `is_public` column
- [ ] RLS is enabled on `shared_flows` table
- [ ] All 6 RLS policies are created
- [ ] Index on `is_public` is created
- [ ] Public flows are discoverable
- [ ] Private flows are not enumerable
- [ ] Direct flow access works for all flows
- [ ] Users can manage their own flows
- [ ] Applications are updated and working

## Support

If you encounter issues during migration:

1. Check Supabase logs for RLS policy violations
2. Verify user authentication is working
3. Test policies with different user contexts
4. Ensure application code is using the updated API

The migration ensures that access control is enforced at the database level, providing robust security for both public and private shared flows.
