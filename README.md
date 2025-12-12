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

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Fonts**: Caveat (handwriting), EB Garamond (serif)
- **UI Components**: shadcn/ui

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

1. **Clone the repository:**

    ```bash
    git clone https://github.com/jasonmichaelbell78-creator/sonash-v0.git
    cd sonash-v0
    ```

2. **Configure Environment:**
    - Copy `.env.local.example` to `.env.local`
    - Fill in your Firebase config values (Project Settings -> General -> Your Apps)

3. **Install & Run:**

    ```bash
    npm install
    npm run dev
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

- [ROADMAP.md](./ROADMAP.md) - Feature roadmap and development phases

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
