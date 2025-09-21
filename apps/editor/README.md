# ZFlo Editor

A visual flow editor for creating interactive flowcharts and expert systems.

## Features

- **Visual Flow Editor**: Drag-and-drop interface for creating flowcharts
- **Anonymous Authentication**: Secure access with Turnstile verification
- **Flow Sharing**: Create shareable links for flows
- **Real-time Preview**: Test flows directly in the editor
- **Export/Import**: Save and load flow definitions
- **Syntax Highlighting**: JSON code viewer with highlighting

## Setup

### Prerequisites

- Node.js 18+
- pnpm
- Supabase project
- Cloudflare Turnstile site key

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_TURNSTILE_SITE_KEY=your_turnstile_site_key_here
```

### Database Setup

See [Supabase Setup Guide](./docs/supabase-setup.md) for complete database schema and configuration.

### Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Type check
pnpm type-check
```

## Architecture

- **Authentication**: Anonymous auth with Turnstile protection
- **Database**: Supabase with Row Level Security
- **UI**: shadcn/ui components with Tailwind CSS
- **Routing**: React Router for navigation
- **State**: Local storage for editor persistence

## Rules

- Use shadcn for UI components
- Use tailwindcss for styling
- Use react-router (not react-router-dom) for routing if needed
