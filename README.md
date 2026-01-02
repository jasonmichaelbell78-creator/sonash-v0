# SoNash - Sober Nashville Recovery Notebook

*A privacy-first digital recovery journal for the recovery community*

**Document Version:** 2.0
**Last Updated:** 2026-01-02
**Status:** ACTIVE

---

## 🎯 Purpose

This README serves as the **entry point** for the SoNash Recovery Notebook project:

1. **Project Overview** - What SoNash is and what it does
2. **Quick Start** - How to get started with development
3. **Documentation Index** - Links to all project documentation
4. **Status Dashboard** - Current project progress and milestones

---

## 📖 Documentation Index

### Core Documents (Tier 1)
- **[ROADMAP.md](./ROADMAP.md)** - Product roadmap and feature planning
- **[ROADMAP_LOG.md](./ROADMAP_LOG.md)** - Archive of completed roadmap items

### Technical Documentation (Tier 2)
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Developer setup and testing guide
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Technical architecture and design patterns
- **[docs/SECURITY.md](./docs/SECURITY.md)** - Security standards and practices

### AI & Development Workflow
- **[AI_WORKFLOW.md](./AI_WORKFLOW.md)** - AI assistant navigation guide
- **[AI_REVIEW_PROCESS.md](./AI_REVIEW_PROCESS.md)** - Code review process
- **[claude.md](./claude.md)** - AI context and tribal knowledge

### Testing & QA
- **[TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)** - Manual QA testing checklist
- **[docs/TESTING_PLAN.md](./docs/TESTING_PLAN.md)** - Testing strategy

---

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
- See **[ROADMAP.md](./ROADMAP.md)** for full product roadmap

## Project Status

**Last Updated:** January 1, 2026
**Overall Progress:** ~35%
**Current Focus:** Quick Wins + Admin Panel + UX

### Milestone Status

| Milestone | Status | Progress |
|-----------|--------|----------|
| M1 - Foundation | ✅ Complete | 100% |
| M1.5 - Quick Wins | 🔄 In Progress | 50% |
| M1.6 - Admin Panel + UX | 🔄 In Progress | 75% |
| M2 - Architecture | ⏸️ Optional | 0% |
| M3 - Meetings | 📋 Planned | 0% |
| M4 - Expansion | 📋 Planned | 0% |
| M5 - Inventories | 📋 Planned | 0% |
| M6 - Prayers | 📋 Planned | 0% |
| M7 - Fellowship | 📋 Planned | 0% |
| M8 - Speakers | 📋 Planned | 0% |
| M10 - Monetization | 🔬 Research | 0% |

### Recent Completions
- ✅ M1 - Foundation

### Current Sprint
- 🔄 M1.5 - Quick Wins (50%)
- 🔄 M1.6 - Admin Panel + UX (75%)

See **[ROADMAP.md](./ROADMAP.md)** for detailed milestone information.

## Data Architecture

This app uses **Firebase Firestore** with a user-centric data model.

- **User Profiles** (`/users/{uid}`):
  - Contains `nickname`, `cleanStart` (Timestamp), and preferences.
  - Security Rules: strictly `request.auth.uid == uid` (see [`firestore.rules`](./firestore.rules)).

- **Daily Logs** (`/users/{uid}/daily_logs/{date}`):
  - Store check-ins, mood, and journal entries.
  - Guarded client-side via `lib/security/firestore-validation.ts` to mirror the deployed rules.

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

This app handles sensitive recovery data.

### Mandatory Security Standards

All code changes MUST comply with these standards:

1. **Rate Limiting** - All endpoints have IP + user-based limits with graceful 429s
2. **Input Validation** - All inputs validated with schemas, type checks, length limits
3. **Secrets Management** - No hardcoded keys; all secrets in env vars; nothing client-side
4. **OWASP Compliance** - Follow OWASP Top 10; clear comments; no breaking changes

See **[docs/GLOBAL_SECURITY_STANDARDS.md](./docs/GLOBAL_SECURITY_STANDARDS.md)** for full requirements.

### Additional Security Documentation

See **[docs/SECURITY.md](./docs/SECURITY.md)** for:
- Data classification (Red/Yellow/Green)
- Security layers (TLS, App Check, Auth, Rules)
- Privacy protections (GDPR, data export/deletion)
- Incident response procedures

**Report security issues:** jason@sonash.app (not via public GitHub Issues)

---

## 📝 Update Triggers

**Update this README when:**
- Project status or milestone progress changes significantly
- New major features are added or completed
- Tech stack changes (dependencies, frameworks)
- Documentation structure changes (new docs added/removed)
- Project structure changes (directory reorganization)

---

## 🤖 AI Instructions

When working on this project:

1. **Read [AI_WORKFLOW.md](./AI_WORKFLOW.md)** first for navigation guidance
2. **Check [ROADMAP.md](./ROADMAP.md)** for current priorities and planned features
3. **Follow [claude.md](./claude.md)** patterns and tribal knowledge
4. **Run `npm run patterns:check`** to verify compliance before committing
5. **Update documentation** when making changes that affect project status
6. **Use `npm run docs:update-readme`** to sync status section from ROADMAP.md

---

## 🗓️ Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | 2026-01-02 | Standardized structure per Phase 3 migration |
| 1.1 | 2026-01-01 | Added Claude Code infrastructure section |
| 1.0 | 2025-12 | Initial README with MVP features |

**Major Milestones:**
- **v0.1** (December 2025) - MVP: Book cover, Today page, Journal system, Meetings directory
- **v0.2** (January 2026) - Admin panel, Documentation standardization, Security hardening

---

## License

Proprietary - All rights reserved

---

## Contact

- **Developer:** Jason Bell
- **Email:** jason@sonash.app
- **Repository:** [github.com/jasonmichaelbell78-creator/sonash-v0](https://github.com/jasonmichaelbell78-creator/sonash-v0)