# Neuro Progeny University (NPU) Platform
## Technical Documentation v1.0

**Last Updated:** February 2026  
**Platform:** Immersive Mastermind  
**Production URL:** https://neuroprogenyuniversity.netlify.app

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Tech Stack Overview](#2-tech-stack-overview)
3. [Architecture](#3-architecture)
4. [Feature Status](#4-feature-status)
5. [Database Schema](#5-database-schema)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [API Endpoints](#7-api-endpoints)
8. [xRegulation.net Integration Plan](#8-xregulationnet-integration-plan)
9. [Deployment & Infrastructure](#9-deployment--infrastructure)
10. [Development Roadmap](#10-development-roadmap)

---

## 1. Executive Summary

The Neuro Progeny University (NPU) platform is a comprehensive learning management system designed for the Immersive Mastermind program. It supports nervous system capacity training through VR biofeedback, with role-based access for participants, facilitators, admins, and superadmins.

### Core Philosophy
- **Capacity over pathology** - Focus on building capacity, not fixing problems
- **HRV as mirror** - Heart rate variability used as feedback tool, not a score to optimize
- **State fluidity** - Train the ability to move between states, not just achieve calm
- **VR as amplifier** - Virtual reality amplifies biofeedback for awareness

---

## 2. Tech Stack Overview

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.2.5 | React framework with App Router |
| React | 18.3.1 | UI library |
| TypeScript | 5.3.0 | Type safety |
| Tailwind CSS | 3.4.10 | Utility-first styling |
| Lucide React | 0.441.0 | Icon library |
| Zustand | 4.5.5 | Global state management |

### Backend & Services
| Service | Purpose |
|---------|---------|
| Supabase | PostgreSQL database, Auth, Real-time subscriptions, Row Level Security |
| Stripe | Payment processing, checkout sessions, scheduled charges |
| Anthropic Claude API | AI-powered curriculum generation, content writing, quiz creation |
| Netlify | Hosting, serverless functions, continuous deployment |
| Gmail API | Transactional emails (welcome, notifications) |

### Key Dependencies
```json
{
  "@stripe/stripe-js": "^8.7.0",
  "@supabase/ssr": "^0.5.1",
  "@supabase/supabase-js": "^2.45.0",
  "stripe": "^20.3.0",
  "zustand": "^4.5.5"
}
```

---

## 3. Architecture

### Directory Structure
```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes (serverless functions)
│   │   ├── ai-generate/          # Claude AI integration
│   │   ├── checkout/             # Stripe checkout session creation
│   │   ├── send-email/           # Gmail API email sending
│   │   └── webhook/              # Stripe webhook handler
│   ├── auth/callback/            # OAuth callback handler
│   ├── checkout/[slug]/          # Public paywall checkout pages
│   ├── dashboard/                # Protected dashboard routes
│   │   ├── curriculum/           # Participant course view (placeholder)
│   │   ├── journal/              # Participant journaling (placeholder)
│   │   ├── messages/             # Messaging system
│   │   ├── platform/             # Superadmin management
│   │   │   ├── cohorts/          # Cohort management
│   │   │   ├── courses/          # Course builder
│   │   │   ├── equipment/        # VR equipment tracking
│   │   │   ├── paywalls/         # Payment configuration
│   │   │   └── users/            # User management
│   │   ├── profile/              # User profile settings
│   │   └── progress/             # Analytics dashboard
│   └── login/                    # Authentication page
├── components/                   # Shared UI components
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts               # Authentication hook
│   ├── useCohort.ts             # Cohort data hook
│   └── useMessages.ts           # Messaging hook
└── lib/                         # Utilities
    ├── gmail.ts                 # Gmail API client
    ├── store.ts                 # Zustand global store
    ├── stripe/                  # Stripe client/server
    └── supabase/                # Supabase client/server
```

### State Management (Zustand)
```typescript
interface AppState {
  user: Profile | null
  viewAsRole: Role | null      // Role switching for admins
  sidebarCollapsed: boolean
  setUser: (user) => void
  setViewAsRole: (role) => void
  toggleSidebar: () => void
}
```

---

## 4. Feature Status

### ✅ Fully Implemented

#### Authentication System
- [x] Email/password authentication
- [x] Google OAuth integration
- [x] Session management with Supabase
- [x] Role-based access control (participant, facilitator, admin, superadmin)
- [x] Profile management
- [x] 8-second timeout safety for loading states

#### Course Builder (Superadmin)
- [x] Create/edit/delete courses
- [x] Week and lesson management
- [x] Lesson types: video, reading, practice, reflection, quiz, survey, assessment, live
- [x] Rich text content editor
- [x] HTML code editor with preview
- [x] AI Curriculum Generator (Claude API)
- [x] AI Writing Assistant (write, polish, expand)
- [x] AI Quiz Generator
- [x] Course tracks (parallel pathways)
- [x] Theme customization (colors, branding)
- [x] AI Settings (brand voice, tone, preferred/avoid terms)
- [x] Welcome email templates per course
- [x] Lesson notification settings

#### Cohort Management (Superadmin)
- [x] Create/edit/delete cohorts
- [x] Assign courses to cohorts
- [x] Week release scheduling (all_at_once, weekly, daily)
- [x] Facilitator assignment
- [x] Participant enrollment
- [x] Status management (draft, active, completed, archived)

#### Payment System
- [x] Paywall creation and configuration
- [x] Stripe Checkout integration
- [x] Course + equipment deposit pricing
- [x] Webhook handling for successful payments
- [x] Auto-enrollment on payment
- [x] Scheduled equipment charges
- [x] Confirmation email templates

#### Messaging System
- [x] Channel-based messaging (cohort, DM, broadcast)
- [x] Direct messages between users
- [x] @mentions with user search
- [x] Message reactions (emoji)
- [x] Reply threading
- [x] Edit/delete messages
- [x] Real-time updates (Supabase subscriptions)
- [x] Channel member management

#### Progress & Analytics
- [x] Weekly progress tracking structure
- [x] Metric cards (capacity, coherence, engagement)
- [x] Weekly chart visualization
- [x] Milestone tracking
- [x] Role-based views (participant, facilitator, admin, superadmin)
- [x] Participant summaries for facilitators
- [x] Cohort summaries for admins

#### Equipment Tracking
- [x] VR headset inventory management
- [x] HRV monitor tracking
- [x] Equipment assignment to participants
- [x] Shipment tracking (status, tracking numbers)
- [x] Equipment condition notes
- [x] Scheduled charge management

#### User Management
- [x] User listing with search
- [x] Role management
- [x] Cohort assignment
- [x] Tag system for users
- [x] Invite new users

### 🚧 In Development / Placeholder

#### Curriculum Page (Participant View)
- [ ] Display enrolled courses
- [ ] Week/lesson navigation
- [ ] Video player integration
- [ ] Lesson completion tracking
- [ ] Progress indicators

#### Journal Page
- [ ] Daily reflection entries
- [ ] Prompted journaling
- [ ] Entry history
- [ ] Search/filter entries

#### VR Biofeedback Integration
- [ ] xRegulation.net API integration
- [ ] Real-time HRV data display
- [ ] Session recording and playback
- [ ] Capacity index calculation
- [ ] Window of tolerance visualization

### ❌ Not Yet Started

- [ ] Mobile app (React Native)
- [ ] Push notifications
- [ ] Video hosting/streaming
- [ ] Advanced reporting/exports
- [ ] Multi-organization support
- [ ] SSO/SAML integration
- [ ] API rate limiting
- [ ] Comprehensive audit logging

---

## 5. Database Schema

### Core Tables

#### profiles
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'participant', -- participant, facilitator, admin, superadmin
  organization_id UUID,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### courses
```sql
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  duration_weeks INTEGER DEFAULT 5,
  status TEXT DEFAULT 'draft', -- draft, published, archived
  settings JSONB DEFAULT '{}', -- theme, tracks, ai settings
  welcome_email_subject TEXT,
  welcome_email_body TEXT,
  lesson_notification_subject TEXT,
  lesson_notification_body TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### weeks
```sql
CREATE TABLE weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  title TEXT,
  description TEXT,
  release_mode TEXT DEFAULT 'weekly', -- all_at_once, weekly, daily
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### lessons
```sql
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id UUID REFERENCES weeks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  lesson_type TEXT DEFAULT 'video', -- video, reading, practice, reflection, quiz, survey, assessment, live
  duration_minutes INTEGER DEFAULT 15,
  description TEXT,
  content TEXT, -- HTML content
  video_url TEXT,
  sort_order INTEGER DEFAULT 0,
  track_id TEXT, -- for parallel tracks
  send_notification BOOLEAN DEFAULT true,
  release_day INTEGER, -- for daily release mode
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### cohorts
```sql
CREATE TABLE cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  course_id UUID REFERENCES courses(id),
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'draft', -- draft, active, completed, archived
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### cohort_participants
```sql
CREATE TABLE cohort_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID REFERENCES cohorts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'participant', -- participant, facilitator
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cohort_id, user_id)
);
```

### Progress Tracking Tables

#### weekly_progress
```sql
CREATE TABLE weekly_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  cohort_id UUID REFERENCES cohorts(id),
  week_number INTEGER,
  week_start DATE,
  sessions_completed INTEGER DEFAULT 0,
  total_minutes INTEGER DEFAULT 0,
  avg_hrv NUMERIC,
  avg_coherence NUMERIC,
  avg_capacity_index NUMERIC,
  window_of_tolerance_delta NUMERIC,
  lessons_completed INTEGER DEFAULT 0,
  lessons_total INTEGER DEFAULT 0,
  journal_entries INTEGER DEFAULT 0,
  engagement_score NUMERIC,
  progress_score NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### milestones
```sql
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  cohort_id UUID REFERENCES cohorts(id),
  milestone_type TEXT, -- first_session, week_complete, capacity_threshold, etc.
  title TEXT,
  description TEXT,
  achieved_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Messaging Tables

#### channels
```sql
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'general', -- cohort, dm, general, broadcast
  cohort_id UUID REFERENCES cohorts(id),
  created_by UUID REFERENCES profiles(id),
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### messages
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  reply_to UUID REFERENCES messages(id),
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### channel_members
```sql
CREATE TABLE channel_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  last_read_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(channel_id, user_id)
);
```

### Payment Tables (See supabase-paywall-migration.sql)
- paywalls
- payments
- pending_enrollments
- scheduled_charges

---

## 6. Authentication & Authorization

### Role Hierarchy
```
superadmin
    └── Full platform access, all features
admin
    └── Organization-level access, manage facilitators/cohorts
facilitator
    └── Manage assigned cohorts, view participant progress
participant
    └── Access enrolled courses, messaging, personal progress
```

### Row Level Security (RLS)
All tables use Supabase RLS policies. Key patterns:

```sql
-- Users can read their own profile
CREATE POLICY "Users read own profile"
ON profiles FOR SELECT
USING (id = auth.uid());

-- Admins can read all profiles
CREATE POLICY "Admins read all profiles"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'superadmin')
  )
);

-- Facilitators can read their cohort participants
CREATE POLICY "Facilitators read cohort participants"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM cohort_participants cp1
    JOIN cohort_participants cp2 ON cp1.cohort_id = cp2.cohort_id
    WHERE cp1.user_id = auth.uid() 
    AND cp1.role = 'facilitator'
    AND cp2.user_id = profiles.id
  )
);
```

### View-As Feature
Admins/superadmins can switch their view to see the platform as a different role:
```typescript
const { viewAsRole, setViewAsRole } = useAppStore()
const effectiveRole = useEffectiveRole() // Returns viewAsRole or actual role
```

---

## 7. API Endpoints

### /api/ai-generate (POST)
AI-powered content generation using Claude API.

**Types:**
- `full_course` - Generate complete curriculum structure
- `lesson_content` - Write/polish/expand lesson content
- `quiz` - Generate quiz questions

**Request:**
```json
{
  "type": "lesson_content",
  "mode": "write|polish|expand",
  "prompt": "...",
  "currentContent": "...",
  "aiSettings": {
    "brandVoice": "...",
    "toneStyle": "warm|professional|casual|academic",
    "preferredTerms": "...",
    "avoidTerms": "..."
  }
}
```

### /api/checkout (POST)
Create Stripe checkout session.

### /api/webhook (POST)
Handle Stripe webhook events (checkout.session.completed).

### /api/send-email (POST)
Send transactional emails via Gmail API.

---

## 8. xRegulation.net Integration Plan

### Overview
xRegulation.net provides VR biofeedback session data including HRV metrics, coherence scores, and capacity indices. This integration will bring real-time and historical biofeedback data into the NPU platform.

### Data Flow Architecture

```
┌─────────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  xRegulation.net    │────▶│  NPU API Route   │────▶│  Supabase DB    │
│  (VR Sessions)      │     │  /api/xreg-sync  │     │  (Analytics)    │
└─────────────────────┘     └──────────────────┘     └─────────────────┘
         │                           │                        │
         │                           │                        │
         ▼                           ▼                        ▼
    Real-time data            Process & validate         Store metrics
    via webhook or           Apply role-based           Update weekly_progress
    polling API              access rules               Calculate aggregates
```

### Proposed API Integration Methods

#### Option A: Webhook Push (Recommended)
xRegulation.net sends session data to NPU when sessions complete.

```typescript
// /api/xreg-webhook/route.ts
export async function POST(request: NextRequest) {
  const signature = request.headers.get('x-xreg-signature')
  const body = await request.json()
  
  // Verify webhook signature
  if (!verifySignature(signature, body)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }
  
  const { user_email, session_data } = body
  
  // Match user by email
  const { data: user } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', user_email)
    .single()
  
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  
  // Store session data
  await supabase.from('biofeedback_sessions').insert({
    user_id: user.id,
    session_date: session_data.date,
    duration_minutes: session_data.duration,
    avg_hrv: session_data.avg_hrv,
    avg_coherence: session_data.avg_coherence,
    capacity_index: session_data.capacity_index,
    window_of_tolerance: session_data.wot_data,
    raw_data: session_data
  })
  
  // Update weekly progress aggregates
  await updateWeeklyProgress(user.id, session_data)
  
  return NextResponse.json({ success: true })
}
```

#### Option B: Polling API
NPU periodically fetches new session data from xRegulation.net.

```typescript
// Scheduled function (Netlify/Vercel cron)
export async function syncXRegulationData() {
  const lastSync = await getLastSyncTimestamp()
  
  const response = await fetch('https://api.xregulation.net/v1/sessions', {
    headers: {
      'Authorization': `Bearer ${process.env.XREG_API_KEY}`,
      'X-Since': lastSync.toISOString()
    }
  })
  
  const sessions = await response.json()
  
  for (const session of sessions) {
    // Process each session...
  }
  
  await setLastSyncTimestamp(new Date())
}
```

#### Option C: Real-time WebSocket (For Live Sessions)
For displaying live biofeedback during VR sessions.

```typescript
// Client-side real-time connection
const ws = new WebSocket('wss://api.xregulation.net/live')

ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  updateLiveMetrics(data)
}
```

### Role-Based Data Access

```sql
-- Biofeedback sessions table
CREATE TABLE biofeedback_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  cohort_id UUID REFERENCES cohorts(id),
  session_date TIMESTAMPTZ,
  duration_minutes INTEGER,
  avg_hrv NUMERIC,
  avg_coherence NUMERIC,
  capacity_index NUMERIC,
  window_of_tolerance JSONB,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for hierarchical access

-- Participants see only their own data
CREATE POLICY "Participants view own sessions"
ON biofeedback_sessions FOR SELECT
USING (user_id = auth.uid());

-- Facilitators see their cohort participants
CREATE POLICY "Facilitators view cohort sessions"
ON biofeedback_sessions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM cohort_participants cp
    WHERE cp.cohort_id = biofeedback_sessions.cohort_id
    AND cp.user_id = auth.uid()
    AND cp.role = 'facilitator'
  )
);

-- Admins see all facilitator data + their facilitators' participants
CREATE POLICY "Admins view organization sessions"
ON biofeedback_sessions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
    AND (
      -- Direct reports (facilitators in same org)
      EXISTS (
        SELECT 1 FROM profiles facilitator
        WHERE facilitator.id IN (
          SELECT DISTINCT cp.user_id 
          FROM cohort_participants cp 
          WHERE cp.cohort_id = biofeedback_sessions.cohort_id 
          AND cp.role = 'facilitator'
        )
        AND facilitator.organization_id = p.organization_id
      )
    )
  )
);

-- Superadmins see everything
CREATE POLICY "Superadmins view all sessions"
ON biofeedback_sessions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'superadmin'
  )
);
```

### Dashboard Integration

#### Participant View
- Personal session history
- HRV trends over time
- Capacity index progression
- Window of tolerance visualization

#### Facilitator View
- Cohort aggregate metrics
- Individual participant drill-down
- Session completion rates
- Alerts for participants needing attention

#### Admin View
- All facilitators' cohort summaries
- Cross-cohort comparisons
- Facilitator performance metrics
- Organization-wide trends

#### Superadmin View
- Platform-wide analytics
- All organizations' data
- System health metrics
- Data export capabilities

### Implementation Steps

1. **Phase 1: Database Schema**
   - Create biofeedback_sessions table
   - Add RLS policies
   - Create indexes for performance

2. **Phase 2: API Integration**
   - Set up webhook endpoint
   - Implement signature verification
   - Create user matching logic
   - Build aggregate calculation functions

3. **Phase 3: Dashboard UI**
   - Add biofeedback metrics to Progress page
   - Create session detail views
   - Build visualizations (charts, graphs)
   - Implement role-based data filtering

4. **Phase 4: Real-time Features**
   - Live session monitoring (facilitators)
   - Real-time metric updates
   - Alert system for anomalies

### Environment Variables Required
```env
XREG_API_KEY=your_xregulation_api_key
XREG_WEBHOOK_SECRET=webhook_signing_secret
XREG_API_URL=https://api.xregulation.net/v1
```

---

## 9. Deployment & Infrastructure

### Netlify Configuration
```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[build.environment]
  NODE_VERSION = "18"
```

### Environment Variables (Netlify)
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx

ANTHROPIC_API_KEY=sk-ant-xxx

GMAIL_CLIENT_ID=xxx
GMAIL_CLIENT_SECRET=xxx
GMAIL_REFRESH_TOKEN=xxx
```

### Continuous Deployment
- GitHub repository connected to Netlify
- Auto-deploy on push to `main` branch
- Preview deploys for pull requests

---

## 10. Development Roadmap

### Phase 1: Core Platform (✅ Complete)
- Authentication system
- Course builder
- Cohort management
- Payment processing
- Messaging system
- Basic progress tracking

### Phase 2: Participant Experience (🚧 In Progress)
- [ ] Curriculum viewer page
- [ ] Video player integration
- [ ] Lesson completion tracking
- [ ] Journal/reflection system
- [ ] Progress visualization

### Phase 3: Biofeedback Integration (📋 Planned)
- [ ] xRegulation.net API integration
- [ ] Real-time session monitoring
- [ ] Enhanced analytics dashboards
- [ ] Facilitator alerts system

### Phase 4: Advanced Features (📋 Planned)
- [ ] Mobile app (React Native)
- [ ] Push notifications
- [ ] Advanced reporting/exports
- [ ] Multi-organization support
- [ ] Video hosting solution

### Phase 5: Scale & Optimization (📋 Future)
- [ ] Performance optimization
- [ ] CDN integration for media
- [ ] Advanced caching
- [ ] API rate limiting
- [ ] Comprehensive audit logging

---

## Appendix A: Local Development Setup

```bash
# Clone repository
git clone https://github.com/Neuro316/Neuro-progeny-university.git
cd Neuro-progeny-university

# Install dependencies
npm install

# Create .env.local with required variables
cp .env.example .env.local

# Run development server
npm run dev

# Access at http://localhost:3000
```

## Appendix B: Supabase Setup

1. Create new Supabase project
2. Run SQL migrations for all tables
3. Enable Row Level Security on all tables
4. Configure authentication providers (email, Google)
5. Set up database webhooks if needed

## Appendix C: Stripe Setup

1. Create Stripe account
2. Set up webhook endpoint: `https://your-domain.com/api/webhook`
3. Configure webhook events: `checkout.session.completed`
4. Add API keys to environment variables

---

*Document maintained by the Neuro Progeny development team.*
