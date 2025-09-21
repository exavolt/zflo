# @zflo/platform-core

Shared integrations package for ZFlo applications, providing unified access to external services like Supabase, analytics, and more.

## Features

- **Supabase Integration**: Complete flow management with CRUD operations
- **React Hooks**: Ready-to-use hooks for React applications
- **TypeScript Support**: Full type safety with comprehensive interfaces
- **Framework Agnostic**: Core services work in any JavaScript environment

## Installation

```bash
pnpm add @zflo/platform-core
```

## Quick Start

### Initialize Supabase

```typescript
import { initializeSupabase } from '@zflo/platform-core';

initializeSupabase({
  url: 'your-supabase-url',
  anonKey: 'your-supabase-anon-key',
});
```

### Using React Hooks

```tsx
import { usePublicFlows, useFlow } from '@zflo/platform-core';

function FlowsList() {
  const { flows, loading, error } = usePublicFlows({
    limit: 10,
    tags: ['tutorial'],
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {flows.map((flow) => (
        <div key={flow.id}>{flow.title}</div>
      ))}
    </div>
  );
}
```

### Using Services Directly

```typescript
import { FlowsService } from '@zflo/platform-core';

const flowsService = new FlowsService();

// Get public flows
const flows = await flowsService.getPublicFlows({
  search: 'tutorial',
  limit: 20,
});

// Get specific flow
const flow = await flowsService.getFlowById('flow-id');
```

## API Reference

### Types

- `FlowMetadata`: Complete flow information
- `FlowFilter`: Filtering options for flow queries
- `FlowCreateInput`: Input for creating new flows
- `FlowUpdateInput`: Input for updating existing flows

### Services

- `FlowsService`: Complete CRUD operations for flows
- `initializeSupabase()`: Initialize Supabase client
- `getSupabaseClient()`: Get initialized Supabase client

### React Hooks

- `usePublicFlows(filter?)`: Fetch and manage public flows
- `useSharedFlow(id)`: Fetch single flow with view tracking
- `usePopularTags(limit?)`: Fetch popular flow tags

## Database Schema

The package expects a Supabase database with the following table structure:

```sql
CREATE TABLE flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  author TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_public BOOLEAN DEFAULT FALSE,
  flow_data JSONB NOT NULL,
  thumbnail_url TEXT,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0
);
```

## License

MIT
