# Development Guide

**Document Version:** 2.1
**Last Updated:** 2026-01-04
**Status:** ACTIVE

---

## 🎯 Purpose & Scope

This guide provides everything needed to set up and develop on the SoNash project.

**Scope:**
- ✅ Local environment setup
- ✅ Development workflows
- ✅ Testing procedures
- ✅ Deployment process

**See also:**
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [SECURITY.md](./docs/SECURITY.md) - Security requirements
- [TESTING_PLAN.md](docs/TESTING_PLAN.md) - Testing strategy and QA procedures

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase CLI: `npm install -g firebase-tools`
- Firebase project with Firestore, Auth, and Cloud Functions enabled

### Installation

```bash
# Clone repository
git clone https://github.com/jasonmichaelbell78-creator/sonash-v0.git
cd sonash-v0

# Install dependencies
npm install
cd functions && npm install && cd ..
```

### Environment Setup

Create `.env.local` in project root:

```bash
# Firebase SDK Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase App Check (Bot Protection)
NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY=your_recaptcha_site_key

# App Check Debug Token (Development Only)
NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN=your_debug_token

# Error Monitoring (Optional)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_SENTRY_ENABLED=false
```

**Get these values from:**
- Firebase Console → Project Settings → General → Your Apps
- App Check → reCAPTCHA Enterprise

### Run with Firebase Emulators (Recommended)

```bash
# Terminal 1: Start Firebase emulators
firebase emulators:start

# Terminal 2: Start Next.js dev server
npm run dev
```

**Emulator Ports:**
- Emulator UI: `localhost:4000`
- Firestore: `localhost:8080`
- Auth: `localhost:9099`
- Functions: `localhost:5001`

### Run Without Emulators

```bash
npm run dev
```

Visit `http://localhost:3000`

---

## 🏗️ Project Structure

```
sonash-v0/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Homepage (book cover)
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Global styles
│   ├── admin/                    # Admin panel
│   ├── colors/                   # Color sampler tool
│   ├── journal/                  # Journal tab
│   └── meetings/                 # Meetings directory
│
├── components/
│   ├── notebook/                 # Notebook UI
│   │   ├── book-cover.tsx        # Book cover component
│   │   ├── notebook-shell.tsx    # Opened notebook
│   │   ├── pages/                # Notebook pages
│   │   │   ├── today-page.tsx    # Today tab
│   │   │   ├── resources-page.tsx
│   │   │   └── support-page.tsx
│   │   └── ribbon-nav.tsx        # Page navigation
│   │
│   ├── journal/                  # Journal system
│   │   ├── entry-card.tsx        # Entry display
│   │   ├── entry-feed.tsx        # Timeline view
│   │   ├── ribbon-nav.tsx        # Filter controls
│   │   └── timeline.tsx          # Main timeline
│   │
│   ├── growth/                   # Growth tab tools
│   │   ├── SpotCheckCard.tsx     # Spot checks
│   │   ├── NightReviewCard.tsx   # Night reviews
│   │   └── GratitudeCard.tsx     # Gratitude lists
│   │
│   ├── desktop/                  # Desktop elements
│   │   ├── lamp-glow.tsx         # Ambient lighting
│   │   └── sobriety-chip.tsx     # Milestone chips
│   │
│   ├── auth/                     # Authentication
│   │   ├── sign-in-modal.tsx
│   │   └── account-link-modal.tsx
│   │
│   └── ui/                       # shadcn/ui components
│
├── lib/                          # Core utilities
│   ├── firebase.ts               # Firebase initialization
│   ├── firestore-service.ts      # Firestore operations
│   ├── logger.ts                 # Logging utility
│   ├── utils.ts                  # Shared utilities
│   ├── auth/                     # Auth helpers
│   ├── database/                 # Database utilities
│   └── security/                 # Security validation
│
├── hooks/                        # React hooks
│   ├── use-journal.ts            # Journal operations
│   ├── use-geolocation.ts        # Location services
│   └── use-speech-recognition.ts # Voice input
│
├── types/                        # TypeScript types
│   └── journal.ts                # Journal interfaces
│
├── functions/                    # Cloud Functions
│   ├── src/
│   │   ├── index.ts              # Function exports
│   │   └── journal/              # Journal functions
│   └── package.json
│
├── tests/                        # Unit tests
│   ├── auth-provider.test.ts
│   ├── firestore-service.test.ts
│   └── security/
│
├── docs/                         # Documentation
│   ├── SECURITY.md
│   ├── INCIDENT_RESPONSE.md
│   └── archive/                  # Archived docs
│
├── public/                       # Static assets
│   ├── manifest.json             # PWA manifest
│   └── images/
│
├── scripts/                      # Utility scripts
│   ├── seed-meetings.ts          # Seed meeting data
│   └── set-admin-claim.ts        # Set admin privileges
│
├── .env.local                    # Environment variables (gitignored)
├── firebase.json                 # Firebase configuration
├── firestore.rules               # Security rules
├── firestore.indexes.json        # Database indexes
├── next.config.mjs               # Next.js configuration
├── package.json                  # Dependencies
└── tsconfig.json                 # TypeScript config
```

---

## 🧪 Testing

### Automated Tests

**Run all tests:**
```bash
npm test
```

**Test coverage:**
```bash
npm run test:coverage
```

**Current Status:**
- ✅ 115/116 tests passing (99.1%)
- ✅ Security validation tests
- ✅ Date utilities
- ✅ Firebase type guards
- ✅ Logger with PII redaction
- ✅ Rate limiter
- ⚠️ 1 skipped test (Firebase emulator setup)

### Manual Testing Checklist

#### Basic Functionality
- [ ] App loads at `http://localhost:3000`
- [ ] No console errors
- [ ] Notebook renders correctly
- [ ] Click notebook to open

#### Authentication
- [ ] Sign in anonymously
- [ ] User state persists after refresh
- [ ] Sign out works
- [ ] Account linking (email/password)

#### Onboarding
- [ ] Clean date picker appears for new users
- [ ] Fellowship selector (AA/NA/CA/etc)
- [ ] Nickname entry
- [ ] Profile saves to Firestore

#### Journal System (December 2025)
- [ ] Mood selection creates mood stamp entry
- [ ] Craving/used tracking creates check-in sticker
- [ ] Recovery notepad creates sticky note entry
- [ ] All entries appear in timeline
- [ ] No duplicate entries
- [ ] Filter ribbons work (Crisis, Daily, Notes, etc.)
- [ ] Entry detail dialog opens on click

#### Growth Tab
- [ ] Spot check saves to both inventoryEntries and journal
- [ ] Night review saves correctly
- [ ] Gratitude list saves correctly
- [ ] All appear in journal timeline

#### Meetings
- [ ] Meetings load from Firestore
- [ ] Filter by fellowship works
- [ ] Search by name works
- [ ] Map view displays markers (if enabled)

#### Admin Panel
- [ ] Only accessible with admin claim
- [ ] Non-admin users see "not authorized" message
- [ ] Admin can view users
- [ ] Admin can manage meetings
- [ ] Admin can manage quotes

---

## 🔒 Security

### Firebase App Check

**Setup for Development:**

1. Get debug token:
```bash
# In browser console on localhost:3000
firebase.appCheck().activate(window.FIREBASE_APPCHECK_DEBUG_TOKEN_FROM_CI, true)
```

2. Add token to Firebase Console:
   - App Check → Apps → Debug tokens
   - Paste token and save

3. Add to `.env.local`:
```bash
NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN=your_debug_token
```

**Production Setup:**
- Uses reCAPTCHA Enterprise (no user interaction)
- Configured in Firebase Console
- Required for all Firestore and Cloud Functions access

### Firestore Security Rules

**Deploy rules:**
```bash
firebase deploy --only firestore:rules
```

**Key principles:**
- All data user-scoped (`request.auth.uid == uid`)
- App Check required for production
- Validation at database level
- See [docs/SECURITY.md](./docs/SECURITY.md) for details

### Rate Limiting

**Cloud Functions:**
- 10 requests/minute per user
- 429 status code if exceeded
- Tracks by authenticated UID

**Client-side:**
- Toast error notification
- Automatic retry after 60 seconds

---

## 🚀 Deployment

### Deploy Cloud Functions

```bash
cd functions
npm run build
firebase deploy --only functions
```

### Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### Deploy Firestore Indexes

```bash
firebase deploy --only firestore:indexes
```

### Deploy Hosting (if configured)

```bash
npm run build
firebase deploy --only hosting
```

### Deploy Everything

```bash
firebase deploy
```

---

## 📦 Dependencies

### Core Stack
- **Next.js** 16.1.0 - React framework with App Router
- **React** 19.2.3 - UI library
- **TypeScript** 5.x - Type safety
- **Tailwind CSS** 4.x - Styling
- **Framer Motion** 12.x - Animations

### Firebase
- **Firebase** 12.7.0 - Backend platform
  - Authentication (Anonymous, Email, Google)
  - Firestore (Real-time database)
  - Cloud Functions v2
  - App Check (reCAPTCHA Enterprise)

### UI Components
- **shadcn/ui** - Component library
- **Radix UI** - Accessible primitives
- **Lucide React** - Icon library
- **Sonner** - Toast notifications
- **date-fns** - Date manipulation

### Development Tools
- **ESLint** - Linting (181 warnings baseline, 0 errors)
- **Prettier** - Code formatting
- **madge** - Circular dependency detection
- **knip** - Unused export detection
- **Node test runner** - Built-in testing (116 tests)
- **c8** - Code coverage
- **Husky** - Git hooks (pre-commit, pre-push)

### Monitoring
- **Sentry** (optional) - Error tracking
- **Firebase Analytics** - Usage metrics

### Update Dependencies

```bash
# Check outdated packages
npm outdated

# Update all to latest compatible
npm update

# Update specific package
npm install package@latest

# Audit for vulnerabilities
npm audit
npm audit fix
```

---

## 🛠️ Developer Tooling

### Code Quality Commands

| Command | Purpose | Notes |
|---------|---------|-------|
| `npm run lint` | ESLint check | Must pass (0 errors) |
| `npm run format` | Prettier auto-format | Formats all files |
| `npm run format:check` | Prettier check | For CI (no changes) |
| `npm run deps:circular` | Check circular deps | Uses madge |
| `npm run deps:unused` | Find unused exports | Uses knip |
| `npm test` | Run all tests | 116 tests (1 skipped) |
| `npm run test:coverage` | Test with coverage | Uses c8 |

### Prettier (Code Formatting)

**Configuration:** `.prettierrc`
- 2-space tabs
- Double quotes (consistent with JSX)
- Trailing commas (es5)
- 100 char line width (80 for markdown)

**Format code:**
```bash
npm run format           # Format all files
npm run format:check     # Check without changing (CI)
```

**Ignores:** See `.prettierignore` - excludes build output, dependencies, generated files.

### madge (Circular Dependencies)

**Check for circular imports:**
```bash
npm run deps:circular
```

Currently: ✅ No circular dependencies

### knip (Unused Exports)

**Find unused code:**
```bash
npm run deps:unused
```

**Configuration:** `knip.json`
- Analyzes `app/`, `components/`, `lib/`
- Ignores test files and scripts
- Some false positives ignored (fonts, CSS, test utils)

**Current baseline (to investigate):**
- 7 potentially unused dependencies
- 2 unlisted dependencies
- 1 duplicate export

### ESLint

**Run linting:**
```bash
npm run lint
```

**Current baseline:** 0 errors, 181 warnings (eslint-plugin-security + TypeScript rules)

**Warning breakdown (audited as false positives - 2026-01-04):**
- `detect-object-injection` (91): Safe iteration/lookups with developer-defined keys
- `detect-non-literal-fs-filename` (66): CLI scripts with controlled paths
- `detect-unsafe-regex` (14): Bounded input, linear patterns
- `detect-non-literal-regexp` (6): Intentional dynamic patterns
- `detect-possible-timing-attacks` (1): Comparing user's own password inputs
- `@typescript-eslint/no-unused-vars` (3): Legitimate unused variables in type definitions

**Configuration:** `eslint.config.mjs` (flat config)

### Git Hooks (Husky)

**Location:** `.husky/`

**Pre-commit hook (`.husky/pre-commit`) runs:**

| Step | Command | Blocking? |
|------|---------|-----------|
| ESLint | `npm run lint` | YES - blocks commit |
| Prettier | `npm run format:check` | NO - warning only |
| Tests | `npm test` | YES - blocks commit |

**Pre-push hook (`.husky/pre-push`) runs:**

| Step | Command | Blocking? |
|------|---------|-----------|
| Tests | `npm test` | YES - blocks push |
| Circular deps | `npm run deps:circular` | YES - blocks push |
| Pattern compliance | `npm run patterns:check` | YES - blocks push |
| Type check | `npx tsc --noEmit` | YES - blocks push |

**⚠️ Never bypass:** See Git Workflow section for policy.

### CI/CD Workflows

**Location:** `.github/workflows/`

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Push/PR to main | Lint, test, build |
| `deploy-firebase.yml` | Manual/Release | Deploy to Firebase |
| `docs-lint.yml` | PR with .md changes | Documentation linting |
| `review-check.yml` | Scheduled/Manual | Check review triggers |
| `auto-label-review-tier.yml` | PR opened | Auto-label PRs |
| `sync-readme.yml` | Push to main | Sync README status |
| `validate-plan.yml` | Manual | Validate improvement plan |

**CI Workflow (`ci.yml`) steps:**

| Step | Blocking? | Notes |
|------|-----------|-------|
| ESLint | YES | |
| Prettier | NO | `continue-on-error: true` |
| Circular deps | YES | |
| Unused deps | NO | `continue-on-error: true` |
| Pattern check | NO | `continue-on-error: true` |
| Docs check | NO | `continue-on-error: true` |
| Type check | YES | |
| Tests | YES | |
| Build | YES | |

---

## 🔌 MCP Servers (Model Context Protocol)

MCP servers extend Claude Code's capabilities with external integrations.

### Setup

1. **Copy the example config:**
   ```bash
   cp .mcp.json.example .mcp.json
   ```

2. **Add your tokens:**
   Edit `.mcp.json` and replace placeholder values with real tokens.

3. **Restart Claude Code** to load the new configuration.

### Available Servers

| Server | Purpose | Token Required |
|--------|---------|----------------|
| `ccusage` | Claude usage tracking | No |
| `sonarcloud` | Code quality metrics | Yes (SONAR_TOKEN) |

### SonarCloud Setup

1. Get a token from https://sonarcloud.io/account/security
2. Add to `.mcp.json`:
   ```json
   "sonarcloud": {
     "env": {
       "SONAR_TOKEN": "your-token-here"
     }
   }
   ```

### Security

- **`.mcp.json` is gitignored** - Never commit tokens
- **Use `.mcp.json.example`** as a template (committed, no secrets)
- **Rotate tokens** if accidentally exposed

### Adding New MCP Servers

Recommended servers for this project:
- **Next.js DevTools MCP** - Error detection, build status
- **Firebase MCP** - Firestore, Auth, Storage access
- **GitHub MCP** - PR management, issue tracking

See: https://github.com/modelcontextprotocol/servers

---

## 🎨 Code Style

### TypeScript

**Naming conventions:**
- Components: `PascalCase` (BookCover.tsx)
- Hooks: `camelCase` with `use` prefix (useJournal.ts)
- Utilities: `camelCase` (formatDate.ts)
- Types: `PascalCase` (JournalEntry)
- Constants: `SCREAMING_SNAKE_CASE` (MAX_ENTRIES)

**Type safety:**
- Use strict mode (`tsconfig.json`)
- Avoid `any` (use `unknown` instead)
- Define interfaces for all data structures
- Use Zod for runtime validation

### React

**Component patterns:**
```typescript
// Use React.FC sparingly
export default function BookCover({ nickname }: { nickname: string }) {
  return <div>...</div>
}

// Prefer named exports for testability
export function JournalEntry({ entry }: { entry: JournalEntry }) {
  return <article>...</article>
}
```

**Hooks order:**
1. `useState`
2. `useEffect`
3. `useContext`
4. Custom hooks
5. Event handlers
6. Render helpers

### CSS/Tailwind

**Class order (Prettier plugin handles this):**
1. Layout (flex, grid)
2. Positioning (absolute, relative)
3. Box model (w-, h-, p-, m-)
4. Typography (text-, font-)
5. Visual (bg-, border-, shadow-)
6. Misc (cursor-, transition-)

**Custom classes:**
- Prefer Tailwind utilities
- Use CSS modules for complex animations
- Define design tokens in `globals.css`

---

## 🐛 Debugging

### Common Issues

**Firebase initialization errors:**
- Check `.env.local` has all required variables
- Verify Firebase config in console
- Ensure emulators are running (if using)

**App Check errors:**
- Use debug token in development
- Check Firebase Console → App Check → Debug tokens
- Disable App Check in emulator mode

**Firestore permission errors:**
- Check security rules deployed
- Verify user is authenticated
- Use emulator UI to inspect rules evaluation

**Build errors:**
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npm run type-check`

### Debug Tools

**React DevTools:**
- Install browser extension
- Inspect component tree
- View props and state

**Firebase Emulator UI:**
- Visit `localhost:4000`
- View Firestore data
- Test security rules
- Monitor function logs

**VS Code Extensions:**
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- Firebase Explorer
- Error Lens

---

## 📊 Performance

### Optimization Checklist

- [ ] Use Next.js Image component for all images
- [ ] Lazy load heavy components
- [ ] Debounce user inputs (search, autosave)
- [ ] Use React.memo for expensive renders
- [ ] Implement virtual scrolling for long lists
- [ ] Optimize Firestore queries (indexes, limits)
- [ ] Enable Service Worker caching
- [ ] Compress assets (images, fonts)

### Monitoring

**Lighthouse scores (target):**
- Performance: >90
- Accessibility: >90
- Best Practices: >90
- SEO: >90

**Core Web Vitals:**
- LCP (Largest Contentful Paint): <2.5s
- INP (Interaction to Next Paint): <200ms
- CLS (Cumulative Layout Shift): <0.1

---

## 🔄 Git Workflow

### Git Hooks Policy

**⚠️ MANDATORY: Never bypass git hooks**

This project uses Husky hooks to enforce code quality:
- **Pre-commit**: ESLint, tests
- **Pre-push**: Tests, pattern compliance, type check

**DO NOT use `--no-verify`** to bypass hooks:
```bash
# ❌ NEVER DO THIS
git commit --no-verify
git push --no-verify

# ✅ ALWAYS DO THIS
git commit  # Let hooks run
git push    # Let hooks run
```

**Why this matters:**
- Hooks catch issues before they enter git history
- CI will reject PRs anyway, so bypassing wastes time
- Bad commits pollute git history permanently
- Team trust depends on everyone following the same rules

**If hooks are blocking you:**
1. Fix the underlying issue (lint errors, test failures)
2. If legitimately stuck, ask for help in PR discussion
3. Never bypass - the hook is telling you something important

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch (future)
- Feature branches: `feature/feature-name`
- Bug fixes: `fix/bug-name`
- Hotfixes: `hotfix/issue-name`

### Commit Messages

**Format:**
```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting, no code change
- `refactor`: Code restructure
- `test`: Adding tests
- `chore`: Maintenance

**Examples:**
```bash
feat(journal): add entry type separation

- Split entries into mood stamps, stickers, notes
- Implement deduplication logic
- Update timeline filters

Closes #123
```

### Pull Request Checklist

- [ ] Tests pass (`npm test`)
- [ ] Linter passes (`npm run lint`)
- [ ] Type check passes (`npm run type-check`)
- [ ] Manual QA complete
- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] No secrets in code
- [ ] Screenshots added (if UI change)

---

## 📚 Resources

### Documentation
- [Architecture Guide](./ARCHITECTURE.md)
- [Product Roadmap](./ROADMAP.md)
- [Security Guide](./docs/SECURITY.md)
- [Incident Response](./docs/INCIDENT_RESPONSE.md)

### External Resources
- [Next.js Docs](https://nextjs.org/docs)
- [Firebase Docs](https://firebase.google.com/docs)
- [Tailwind Docs](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Community
- GitHub Issues: Report bugs and request features
- Discussions: Ask questions and share ideas

---

## 🆘 Getting Help

**Stuck on something?**

1. Check this guide and [ARCHITECTURE.md](./ARCHITECTURE.md)
2. Search GitHub Issues for similar problems
3. Check Firebase Console logs
4. Review Sentry error reports
5. Create a GitHub Issue with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Console errors
   - Environment (OS, Node version, browser)

**Security issues:**
- Do NOT create public GitHub Issue
- Email: jason@sonash.app (or designated security contact)
- Include detailed steps to reproduce
- Allow 48 hours for response

---

## 📝 Update Triggers

**Update this document when:**
- Development setup steps change (new dependencies, env vars)
- Testing procedures are modified
- Deployment process changes
- New development workflows are established
- Troubleshooting guides need updates

---

## 🤖 AI Instructions

When maintaining this document:

1. **Update "Quick Start"** when Node.js version or Firebase CLI requirements change
2. **Update "Environment Setup"** when new env vars or Firebase config is added
3. **Update "Testing"** section when test coverage or CI/CD procedures change
4. **Update "Deployment"** when Firebase services or deployment flow change
5. **Verify all commands work** before committing changes (run them!)
6. **Keep troubleshooting current** - add new common issues as discovered

---

## 🗓️ Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.1 | 2026-01-04 | Added Developer Tooling section (Prettier, madge, knip) |
| 2.0 | 2026-01-02 | Standardized structure per Phase 3 migration |
| 1.0 | 2025-12-19 | Initial guide consolidated from multiple sources |
