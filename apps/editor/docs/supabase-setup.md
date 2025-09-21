# Supabase Setup Guide

This guide covers setting up Supabase for the ZFlo Editor with anonymous authentication and flow sharing.

## Prerequisites

1. A Supabase project
2. A Cloudflare Turnstile site key
3. Environment variables configured

## Database Schema

### Tables

#### `shared_flows`

```sql
CREATE TABLE shared_flows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  flow_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid() ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE shared_flows ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can read shared flows" ON shared_flows
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create shared flows" ON shared_flows
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX idx_shared_flows_created_at ON shared_flows(created_at DESC);
CREATE INDEX idx_shared_flows_user_id ON shared_flows(user_id);

-- Update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_shared_flows_updated_at
  BEFORE UPDATE ON shared_flows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Authentication Setup

### 1. Enable Anonymous Sign-ins

In your Supabase dashboard:

1. Go to Authentication → Settings
2. Enable "Enable anonymous sign-ins"
3. Configure CAPTCHA protection with Turnstile

### 2. Turnstile Configuration

1. Go to Authentication → Settings → Bot and Abuse Protection
2. Enable "Enable Captcha protection"
3. Select "Turnstile" as provider
4. Add your Turnstile site key and secret key

## Environment Variables

Create a `.env.local` file in the editor app directory:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Cloudflare Turnstile
VITE_TURNSTILE_SITE_KEY=your_turnstile_site_key_here
```

## Features Implemented

### Anonymous Authentication

- Users must complete Turnstile verification before accessing the editor
- Anonymous sessions are created automatically after verification
- No personal data collection required

### Flow Sharing

- Authenticated users can create shareable links for their flows
- Shared flows are publicly accessible via `/play/:id` routes
- Flow data is stored as JSONB for flexibility

### Security Features

- Row Level Security (RLS) enabled on all tables
- Anonymous users can only read shared flows
- Authenticated users can create new shared flows
- CAPTCHA protection prevents abuse

## Future Enhancements

### Editor Data Storage

When implementing editor data storage, consider adding:

```sql
-- User flows table for persistent editor storage
CREATE TABLE user_flows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  title TEXT NOT NULL,
  flow_data JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS policies
ALTER TABLE user_flows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own flows" ON user_flows
  USING (auth.uid() = user_id);
```

### Collaboration Features

- Real-time collaboration using Supabase Realtime
- Flow versioning and history
- Team workspaces and permissions

## Testing

1. Start the development server: `pnpm dev`
2. Navigate to the editor
3. Complete Turnstile verification
4. Create a flow and test the share functionality
5. Verify the shared link works in an incognito window
