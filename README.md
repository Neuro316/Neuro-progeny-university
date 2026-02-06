# Neuro Progeny Mastermind Platform

A multi-tenant cohort learning platform with VR biofeedback, real-time messaging, and comprehensive admin tools.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS with custom Neuro Progeny brand colors
- **Database**: Supabase (PostgreSQL with RLS)
- **Auth**: Supabase Auth (Email, Google OAuth)
- **Realtime**: Supabase Realtime for messaging
- **State**: Zustand
- **Hosting**: Netlify

## Features

### Participant Features
- Dashboard with progress tracking
- Video curriculum with YouTube embeds
- Journal with share-to-community
- Real-time messaging (channels + DMs)
- HRV session tracking
- VR session logging

### Facilitator Features
- Multi-cohort management
- Cohort selector in messages
- Participant progress monitoring
- Announcements posting
- Direct messaging with participants

### Admin Features
- User management
- Cohort creation/management
- Facilitator messaging
- Platform analytics

### Superadmin Features
- Course editor with curriculum builder
- Access tags management
- Integration configuration
- Platform-wide metrics

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase CLI (for local development)
- Supabase project

### 1. Clone and Install

```bash
git clone <repository-url>
cd mastermind-deploy
npm install
```

### 2. Set Up Supabase

#### Option A: Supabase Dashboard (Recommended for Production)

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Navigate to SQL Editor
3. Run the migrations in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_seed_data.sql`
4. Enable Realtime for the `messages` table:
   - Go to Database → Replication
   - Enable replication for `messages`, `message_reactions`
5. Configure Auth:
   - Go to Authentication → Providers
   - Enable Email and Google OAuth

#### Option B: Supabase CLI (Local Development)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Update with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploying to Netlify

### 1. Connect Repository

1. Go to [netlify.com](https://netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect your GitHub/GitLab repository
4. Select the repository

### 2. Configure Build Settings

Netlify should auto-detect Next.js, but verify:

- **Build command**: `npm run build`
- **Publish directory**: `.next`
- **Node version**: 18

### 3. Add Environment Variables

In Netlify dashboard → Site settings → Environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=https://your-site.netlify.app
```

### 4. Install Next.js Plugin

The `netlify.toml` already includes the Next.js plugin, but ensure it's installed:

```bash
npm install -D @netlify/plugin-nextjs
```

### 5. Deploy

Push to your main branch or click "Deploy" in Netlify dashboard.

## Database Schema Overview

### Core Tables

| Table | Description |
|-------|-------------|
| `organizations` | Multi-tenant orgs |
| `profiles` | User profiles (extends auth.users) |
| `courses` | Course templates |
| `course_weeks` | Weekly curriculum |
| `lessons` | Individual lessons |
| `cohorts` | Course instances with participants |
| `cohort_members` | User-cohort relationships |

### Messaging

| Table | Description |
|-------|-------------|
| `channels` | Chat channels (cohort, community, DM) |
| `channel_members` | Channel memberships |
| `messages` | Chat messages |
| `message_reactions` | Emoji reactions |

### Progress & Content

| Table | Description |
|-------|-------------|
| `lesson_progress` | User lesson completion |
| `journal_entries` | Reflections |
| `hrv_sessions` | HRV data from Polar/xRegulation |
| `vr_sessions` | VR biofeedback sessions |

### Access Control

| Table | Description |
|-------|-------------|
| `access_tags` | Tag definitions |
| `user_access_tags` | User-tag assignments |
| `resource_access_tags` | Resource-tag relationships |

## Row Level Security (RLS)

All tables have RLS enabled with policies for:

- Users can only see their own data
- Cohort members can see cohort content
- Facilitators can see their cohorts' data
- Admins can see org-wide data
- Superadmins have full access

## Realtime Subscriptions

Enabled for:
- `messages` (INSERT, UPDATE)
- `message_reactions` (INSERT, DELETE)
- `channel_members` (INSERT, DELETE)

## API Routes

The Next.js app uses server actions and API routes for:

- `/api/auth/callback` - OAuth callback handling
- Server actions for data mutations

## Customization

### Brand Colors

Edit `tailwind.config.ts`:

```ts
colors: {
  'np-blue': '#476B8E',
  'np-teal': '#2A9D8F', 
  'np-gold': '#E9C46A',
  'np-coral': '#F4A261',
}
```

### Fonts

The app uses:
- **Display**: Cormorant Garamond (headings)
- **Body**: Outfit (text)

Loaded via Google Fonts in `globals.css`.

## Support

For technical issues:
- Check Supabase dashboard for database errors
- Check Netlify logs for deployment issues
- Review browser console for frontend errors

## License

Proprietary - Neuro Progeny © 2024
