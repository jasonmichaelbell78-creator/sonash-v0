# SoNash - Sober Nashville Recovery Notebook

*A privacy-first digital recovery journal for the recovery community*

## 📖 Documentation

- **[ROADMAP.md](./ROADMAP.md)** - Product roadmap and feature planning
- **[ROADMAP_LOG.md](./ROADMAP_LOG.md)** - Archive of completed roadmap items
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Developer setup and testing guide
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Technical architecture and design patterns
- **[TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)** - QA testing checklist

## Overview

SoNash is a personalized digital recovery notebook that helps individuals track their sobriety journey with secure, real-time data synchronization. The app features a photo-realistic notebook interface, unified journal system, and privacy-first design.

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

- **Frontend**: Next.js 16.1 (App Router), React 19.2.3, TypeScript 5.x
- **Styling**: Tailwind CSS v4, Framer Motion 12, shadcn/ui
- **Backend**: Firebase (Auth, Firestore, Cloud Functions v2, App Check)
- **Security**: reCAPTCHA Enterprise, App Check, Firestore Rules, Rate Limiting
- **Testing**: Node test runner, c8 coverage (97.8% passing)
- **Monitoring**: Sentry (optional)

## Project Structure

\`\`\`
├── .claude/                    # Claude Code development infrastructure
│   ├── agents/                 # 24 specialized AI agents (architecture, security, testing, etc.)
│   ├── skills/                 # 23 task-specific skills (senior roles, debugging, research, design)
│   ├── hooks/
│   │   └── session-start.sh    # Auto-install dependencies on session start
│   └── settings.json           # Hook configuration
├── app/
│   ├── page.tsx                # Main app entry
│   ├── layout.tsx              # Root layout with fonts
│   └── globals.css             # Global styles & design tokens
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

## Core Features

### ✅ Current (MVP)
- **Book Cover**: Photo-realistic notebook with personalized sobriety counter
- **Today Tab**: Mood tracking, craving/used logging, recovery notepad
- **Journal System**: Unified timeline with entry types (stamps, stickers, notes)
- **Growth Tab**: Spot checks, night reviews, gratitude lists
- **Meetings**: Directory with search and fellowship filters
- **Security**: App Check, rate limiting, encrypted storage, GDPR compliance

### 🔄 In Progress
- Settings page UI improvements
- Enhanced profile management
- Recovery library (glossary + etiquette guide)

### ✅ Recently Completed (December 2025)
- **Claude Code Development Infrastructure** (December 31):
  - SessionStart hook for automatic dependency installation
  - 24 specialized AI agents (architecture, security, testing, DevOps, documentation)
  - 23 task-specific skills (senior roles, debugging, research, design tools)
  - Auto-build for tests and Firebase Functions on session start
- **Admin Panel Enhancement** (Phases 1-3):
  - Dashboard with system health checks and user metrics
  - Enhanced user management (search, detail view, admin actions)
  - Background jobs monitoring with manual triggers
- **Today Page UX Overhaul** (All 10 improvements):
  - Progressive check-in flow with visual progress tracking
  - Loading states and professional skeleton screens
  - Enhanced visual feedback (animations, glow effects)
  - Quick Actions FAB with 4 customizable shortcuts
  - Smart contextual prompts (evening reminder, HALT suggestion, streak celebration)
  - Keyboard shortcuts (press 1-4 to select mood)
  - Offline-first support with network status indicator
  - Accessibility improvements (ARIA labels, screen reader support)
  - Code quality: custom hooks (useSmartPrompts, useScrollToSection)
  - localStorage persistence for dismissed prompts

### 📋 Planned (2026)
- **Customizable Quick Actions FAB**: User-configurable action buttons, drag-and-drop ordering, custom phone numbers
- **Sentry Error Tracking Integration**: Error dashboard with plain-English translations
- Meeting proximity detection and maps
- Nightly inventory tools (10th step)
- Sponsor connection and support network
- Speaker recordings library
- See **[SoNash__AdminPanelEnhancement__v1_2__2025-12-22.md](./SoNash__AdminPanelEnhancement__v1_2__2025-12-22.md)** for full roadmap

## Project Status

**Last Updated:** December 31, 2025
**Current Focus:** UX Polish + Admin Operations

### Recent Completions
- ✅ Today Page UX Overhaul (10 improvements: loading states, smart prompts, quick actions, keyboard shortcuts)
- ✅ Admin Panel Enhancement (Phases 1-3: Dashboard, Users, Jobs)
- ✅ Security hardening (App Check, rate limiting, audit logging)
- ✅ Journal system consolidation (single-save architecture)
- ✅ Entry type separation (mood stamps, stickers, notes)
- ✅ Firestore indexes for performance
- ✅ Dependencies updated (Next.js 16.1.0, React 19.2.3)
- ✅ 97.8% test pass rate (89/91 tests)

### Current Sprint
- 🔄 Settings page improvements
- 🔄 Recovery library implementation
- 🔄 Code quality refinement

See **[AI_HANDOFF.md](./AI_HANDOFF.md)** for detailed development status.

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
- [ROADMAP.md](./ROADMAP.md) - Canonical product roadmap (consolidated Dec 19, 2025)

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
Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Lint code
npm run lint
```

**Test Status:** 89/91 passing (97.8%)

See **[TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)** for manual QA checklist.

---

## Contributing

1. Check **[ROADMAP.md](./ROADMAP.md)** for planned features
2. Review **[ARCHITECTURE.md](./ARCHITECTURE.md)** for design patterns
3. Follow code style in **[DEVELOPMENT.md](./DEVELOPMENT.md)**
4. Ensure tests pass before submitting PR
5. Update documentation for new features

---

## Security

This app handles sensitive recovery data. See **[docs/SECURITY.md](./docs/SECURITY.md)** for:
- Data classification (Red/Yellow/Green)
- Security layers (TLS, App Check, Auth, Rules)
- Privacy protections (GDPR, data export/deletion)
- Incident response procedures

**Report security issues:** jason@sonash.app (not via public GitHub Issues)

---

## License

Proprietary - All rights reserved

---

## Contact

- **Developer:** Jason Bell
- **Email:** jason@sonash.app
- **Repository:** [github.com/jasonmichaelbell78-creator/sonash-v0](https://github.com/jasonmichaelbell78-creator/sonash-v0)