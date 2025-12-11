# SoNash - Sober Nashville Recovery Notebook

*A digital recovery journal app for the Sober Nashville community*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/jason-bells-projects-70400dfc/sonash-v0)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/hQzscrZHb69)

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

Live at: **[vercel.com/jason-bells-projects-70400dfc/sonash-v0](https://vercel.com/jason-bells-projects-70400dfc/sonash-v0)**

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
  - Security Rules: strictly `request.auth.uid == uid`.

- **Daily Logs** (`/users/{uid}/daily_logs/{date}`):
  - Store check-ins, mood, and journal entries.

## Documentation

- [ROADMAP.md](./ROADMAP.md) - Feature roadmap and development phases
