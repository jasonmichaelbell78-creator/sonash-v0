# SoNash Development Roadmap

## Overview

This document outlines the development phases for the SoNash Recovery Notebook app.

---

## Phase 1: Book Cover Design ✅ COMPLETE

### Completed Features
- [x] Wood desk background texture
- [x] Photo-realistic blue leather notebook cover (blank template)
- [x] Dynamic text overlay with embossed/debossed effect
- [x] Personalized elements:
  - [x] "SoNash" branding
  - [x] "Sober Nashville" subtitle
  - [x] "[Nickname]'s Recovery Notebook"
  - [x] "You've been clean for X days" counter
  - [x] "Turn to Today's Page" CTA button
- [x] Text color system (settled on Pearl #e0d8cc)
- [x] Warm lamp glow ambient lighting
- [x] Responsive 3x scaled notebook sizing
- [x] Text positioning refinements

### Deferred to Later
- [ ] Desktop elements with transparent backgrounds:
  - [ ] Pencil
  - [ ] Sobriety chip/coin (dynamic based on days clean)
  - [ ] Cell phone (optional)
- [ ] Additional desktop elements:
  - [ ] Coffee mug
  - [ ] Reading glasses
  - [ ] Candle

---

## Phase 2: Book Opening Animation 🔄 IN PROGRESS (MVP COMPLETE)

### Current State
- [x] Basic page transition (cover to notebook interior)
- [x] AnimatePresence handling component swap

### Future Improvements
- [ ] Realistic book opening animation (cover lifts from spine)
- [ ] Pages revealed underneath during transition
- [ ] Continuous fluid motion (not component swap)
- [ ] Page flip sound effects (optional)

---

## Phase 3: Notebook Interior Pages 📋 PLANNED

### Journal Section
- [ ] Daily journal entry interface
- [ ] Handwriting-style font for entries
- [ ] Date headers
- [ ] Save/load journal entries
- [ ] Lined paper background

### Goals Section
- [ ] Recovery goals tracking
- [ ] Goal completion checkboxes
- [ ] Progress indicators
- [ ] Milestone celebrations

### Reflections Section
- [ ] Gratitude lists
- [ ] Daily affirmations
- [ ] Mood tracking
- [ ] Reflection prompts

### Contacts Section
- [ ] Sponsor contact info
- [ ] Emergency contacts
- [ ] Support group information
- [ ] Quick-dial integration

---

## Phase 4: User Authentication & Data 📋 PLANNED

### Authentication
- [ ] User signup/login
- [ ] Profile creation (nickname, clean date)
- [ ] Secure session management

### Database Integration
- [ ] Supabase integration
- [ ] User data storage
- [ ] Journal entry persistence
- [ ] Goals and progress tracking
- [ ] Row Level Security (RLS)

### Dynamic Data
- [ ] Real clean days calculation from user's clean date
- [ ] Dynamic sobriety chip based on milestones
- [ ] Progress statistics

---

## Phase 5: Advanced Features 📋 FUTURE

### Notifications & Reminders
- [ ] Daily journaling reminders
- [ ] Milestone celebration alerts
- [ ] Meeting reminders

### Community Features
- [ ] Anonymous sharing (opt-in)
- [ ] Community support wall
- [ ] Local meeting finder (Nashville area)

### Export & Backup
- [ ] Export journal as PDF
- [ ] Cloud backup
- [ ] Data portability

### Accessibility
- [ ] Screen reader support
- [ ] High contrast mode
- [ ] Font size adjustments

---

## Technical Debt & Improvements

### Code Quality
- [ ] Component unit tests
- [ ] E2E testing with Playwright
- [ ] Performance optimization
- [ ] Image optimization (WebP/AVIF)

### Design System
- [ ] Consolidate color tokens
- [ ] Typography scale documentation
- [ ] Component library documentation

---

## Milestone Definitions (Sobriety Chips)

| Days Clean | Chip Color/Type |
|------------|-----------------|
| 1 day | 24-hour chip |
| 30 days | Bronze/30-day |
| 60 days | Red/60-day |
| 90 days | Gold/90-day |
| 6 months | Blue/6-month |
| 9 months | Purple/9-month |
| 1 year | Bronze medallion |
| 18 months | Silver/18-month |
| 2+ years | Multi-year medallion |

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 0.1.0 | Current | MVP - Book cover with dynamic text, basic page transition |

---

*Last Updated: December 2024*
