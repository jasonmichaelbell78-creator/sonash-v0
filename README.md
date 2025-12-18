# SoNash - Sober Nashville Recovery Notebook

*A digital recovery journal app for the Sober Nashville community*

## Roadmap

The canonical roadmap lives in:

- `ROADMAP_V3.md`

## Overview

SoNash is a personalized digital recovery notebook that helps individuals track their sobriety journey. The app features a photo-realistic notebook interface that displays personalized information including the user's nickname, days clean, and provides an interactive journaling experience.

## Current Features (MVP)

### Book Cover

- Photo-realistic weathered blue leather notebook on wooden desk background
- Dynamic personalized text with embossed effect:
  - "SoNash" branding
  - "Sober Nashville" subtitle
  - "[Nickname]'s Recovery Notebook" (personalized)
  - "You've been clean for X days" counter
  - "Turn to Today's Page" call-to-action button
- Pearl-colored text (#e0d8cc) for optimal contrast
- Warm lamp glow lighting effect
- Responsive sizing with 3x scale option

### Notebook Interior

- Multi-page notebook shell with page flip animations
- Lined paper texture with realistic styling
- Bookmark ribbon navigation
- Page sections: Journal, Goals, Reflections, Contacts

## Tech Stack

- **Framework**: Next.js 16.0.7 (App Router with SSR)
- **React**: 19.2.0 (Release Candidate)
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion v12
- **Fonts**: Caveat (handwriting), Handlee, Rock Salt (via next/font/google)
- **UI Components**: shadcn/ui + Radix UI primitives
- **Backend**:
  - Firebase Auth (Anonymous, Email/Password, Google OAuth)
  - Firestore (Real-time database)
  - Cloud Functions v2 (Server-side operations)
  - Firebase App Check (reCAPTCHA Enterprise for bot protection)
- **Validation**: Zod schemas (client & server)
- **Error Monitoring**: Sentry (optional)
- **Testing**: Node.js built-in test runner + c8 coverage

## Project Structure

\`\`\`
├── app/
│   ├── page.tsx          # Main app entry
│   ├── layout.tsx        # Root layout with fonts
│   └── globals.css       # Global styles & design tokens
├── components/
│   ├── notebook/
│   │   ├── book-cover.tsx      # Main book cover component
│   │   ├── notebook-shell.tsx  # Opened notebook container
│   │   ├── notebook-page.tsx   # Individual page component
│   │   └── bookmark-ribbon.tsx # Navigation ribbon
│   ├── desktop/
│   │   ├── lamp-glow.tsx       # Ambient lighting effect
│   │   ├── pencil.tsx          # Desktop element (WIP)
│   │   └── sobriety-chip.tsx   # Milestone chip (WIP)
│   └── ui/                     # shadcn components
└── public/
    └── images/                 # Static assets
\`\`\`

## Development

This repository syncs automatically with [v0.app](https://v0.app) deployments.

### Local Development

\`\`\`bash
npm install
npm run dev
\`\`\`

### Continue Building

Continue development at: **[v0.app/chat/hQzscrZHb69](https://v0.app/chat/hQzscrZHb69)**

## Deployment

Live at: **[sonash.app](https://sonash.app)**

## Setup & Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase project with Firestore, Auth, and Cloud Functions enabled

### 1. Clone the Repository

```bash
git clone https://github.com/jasonmichaelbell78-creator/sonash-v0.git
cd sonash-v0
```

### 2. Install Dependencies

```bash
npm install
cd functions && npm install && cd ..
```

### 3. Configure Environment Variables

Create `.env.local` in the project root:

```bash
# Firebase SDK Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase App Check (Bot Protection)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_recaptcha_site_key

# App Check Debug Token (Development Only - DO NOT use in production)
NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN=your_debug_token

# Error Monitoring (Optional)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_SENTRY_ENABLED=false
```

**Get these values from:**
- Firebase Console → Project Settings → General → Your Apps
- App Check → reCAPTCHA Enterprise

### 4. Run with Firebase Emulators (Recommended for Development)

```bash
# Start Firebase emulators (Firestore, Auth, Functions)
firebase emulators:start

# In a new terminal, start Next.js dev server
npm run dev
```

**Note:** Emulators run on `localhost:4000` (Emulator UI), `localhost:8080` (Firestore), `localhost:9099` (Auth), `localhost:5001` (Functions)

### 5. Run Without Emulators (Uses Production Firebase)

```bash
npm run dev
```

Visit `http://localhost:3000`

### 6. Deploy Cloud Functions (Production)

```bash
cd functions
npm run build
firebase deploy --only functions
```

### 7. Deploy Firestore Security Rules

```bash
firebase deploy --only firestore:rules
```

## Data Architecture

This app uses **Firebase Firestore** with a user-centric data model.

- **User Profiles** (`/users/{uid}`):
  - Contains `nickname`, `cleanStart` (Timestamp), and preferences.
  - Security Rules: strictly `request.auth.uid == uid` (see [`firestore.rules`](./firestore.rules)).

- **Daily Logs** (`/users/{uid}/daily_logs/{date}`):
  - Store check-ins, mood, and journal entries.
  - Guarded client-side via `lib/security/firestore-validation.ts` to mirror the deployed rules.

## Documentation

### Product & Planning
- [ROADMAP_V3.md](./ROADMAP_V3.md) - Canonical product roadmap
- [WEB_ENHANCEMENTS_ROADMAP.md](./WEB_ENHANCEMENTS_ROADMAP.md) - Desktop features roadmap
- [docs/FEATURE_DECISIONS.md](./docs/FEATURE_DECISIONS.md) - Key product decisions

### Technical Documentation
- [docs/LIBRARY_ANALYSIS.md](./docs/LIBRARY_ANALYSIS.md) - **Context7 documentation for all dependencies (192,000+ code snippets)**
- [docs/UNIFIED_JOURNAL_ARCHITECTURE.md](./docs/UNIFIED_JOURNAL_ARCHITECTURE.md) - Journal system design
- [docs/SECURITY.md](./docs/SECURITY.md) - Security best practices
- [docs/TESTING_PLAN.md](./docs/TESTING_PLAN.md) - Testing strategy

### Current Status
- [AI_HANDOFF.md](./AI_HANDOFF.md) - Active development status and next steps
- [PROJECT_STATUS.md](./PROJECT_STATUS.md) - Comprehensive project status report

## Roadmap Module Mapping

| Roadmap tab | Implementation | Status | Feature flag |
| --- | --- | --- | --- |
| Today | `components/notebook/pages/today-page.tsx` | Available | – |
| Resources | `components/notebook/pages/resources-page.tsx` | Available | – |
| Support | `components/notebook/pages/support-page.tsx` | Available | – |
| Growth | `components/notebook/roadmap-modules.tsx` → `PlaceholderPage` | Planned | `NEXT_PUBLIC_ENABLE_GROWTH` |
| Work | `components/notebook/roadmap-modules.tsx` → `PlaceholderPage` | Planned | `NEXT_PUBLIC_ENABLE_WORK` |
| More | `components/notebook/roadmap-modules.tsx` → `PlaceholderPage` | Planned | `NEXT_PUBLIC_ENABLE_MORE` |

Unavailable modules render as notebook stubs and can be toggled on by setting the related feature flag to `true` in the environment.

## Quality Gates

- **Static analysis**: `npm run lint`
- **Unit tests**: `npm test` (runs Node's built-in test runner against FirestoreService and AuthProvider helpers)
- **Data access rules**: client-side Firestore paths are validated via `lib/security/firestore-validation.ts`

These checks align with the roadmap's Q1 stability goals and should be kept green before merging new work.
