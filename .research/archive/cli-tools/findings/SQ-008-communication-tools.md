# SQ-008: CLI Communication Tools

**Research depth:** L1 (Exhaustive) **Search rounds:** 8 **Date:** 2026-03-23
**Domain:** technology

---

## Summary

This document catalogs CLI tools for communication — email, Slack, calendar,
notifications, messaging, social media, and file sharing — with emphasis on
Windows 11 compatibility and how each compares to the user's existing MCP
integrations (Gmail MCP, Google Calendar MCP).

**Key finding:** The user already has strong MCP coverage for Gmail and Google
Calendar. The highest-value additions are: (1) **ntfy** for push notifications
from long-running Claude Code tasks, (2) **slackcat** for piping CLI output to
Slack, (3) **signal-cli** for encrypted programmatic alerts, and (4) **croc**
for quick file transfers. Full interactive email/calendar CLIs offer diminishing
returns given MCP coverage.

---

## Category 1: Email

### Himalaya

- **What:** Stateless CLI email client written in Rust — interact with email via
  shell commands, no event loop
- **URL:** https://github.com/pimalaya/himalaya
- **Install:** `cargo install himalaya` / pre-built binaries for Windows, macOS,
  Linux / `scoop install himalaya`
- **Stars/Activity:** ~5.8k stars; v1.2.0 released Feb 2026; actively maintained
- **Windows:** Yes — official Windows binaries provided
- **Auth:** IMAP/SMTP with OAuth2 support, system keyring integration, PGP
  encryption
- **vs MCP:** MCP Gmail handles read/draft/search within Claude conversations.
  Himalaya is better for batch scripting, piping email content to other tools,
  and non-Gmail accounts (Outlook, ProtonMail, iCloud). JSON output mode makes
  it composable.
- **Workflow fit:** Script email operations outside Claude sessions. Useful if
  you need to process emails in pipelines or automate responses. Less useful if
  MCP Gmail covers your needs.
- **Confidence:** HIGH

### aerc

- **What:** TUI email client written in Go — vim-like keybindings,
  multi-account, HTML rendering
- **URL:** https://git.sr.ht/~rjarry/aerc (GitHub mirror:
  https://github.com/rjarry/aerc)
- **Install:** Package managers on Linux/macOS; build from source on Windows
- **Stars/Activity:** Primary development on SourceHut; actively maintained
  through 2026
- **Windows:** Partial — not officially supported on Windows; may work under WSL
  or Cygwin
- **Auth:** IMAP/SMTP with SASL, OAuth2
- **vs MCP:** aerc is a full interactive TUI — a different paradigm from MCP's
  conversational access. Better for dedicated email triage sessions; MCP is
  better for AI-assisted email within Claude.
- **Workflow fit:** If you want a dedicated terminal email workflow separate
  from Claude. Not recommended as primary tool given MCP coverage and limited
  Windows support.
- **Confidence:** MEDIUM

### NeoMutt

- **What:** Feature-rich fork of Mutt — the classic terminal mail reader with
  MIME, PGP, threading
- **URL:** https://github.com/neomutt/neomutt
- **Install:** Package managers on Linux/macOS; WSL on Windows
- **Stars/Activity:** ~3.3k stars; actively maintained
- **Windows:** No native support — requires WSL or Cygwin
- **Auth:** IMAP/POP3/SMTP, SASL, GPG/PGP, OAuth2 via helper scripts
- **vs MCP:** NeoMutt is the power-user's email client for deep email
  management. MCP is lighter-weight and AI-integrated. NeoMutt wins for volume
  email processing; MCP wins for AI-assisted workflows.
- **Workflow fit:** Only if you want a hardcore terminal email setup. Overkill
  given existing MCP Gmail.
- **Confidence:** MEDIUM

### gogcli

- **What:** All-in-one Google Suite CLI — Gmail, Calendar, Drive, Contacts,
  Docs, Sheets, Tasks, and more
- **URL:** https://github.com/steipete/gogcli / https://gogcli.sh/
- **Install:** `brew install steipete/tap/gogcli` / build from source
- **Stars/Activity:** New project (2025-2026); actively developed
- **Windows:** Partial — Go binary should work on Windows; official install via
  Homebrew (macOS/Linux)
- **Auth:** OAuth2, service account impersonation, OS keyring integration,
  multiple accounts
- **vs MCP:** Covers similar ground as your Gmail + Calendar MCPs but as a
  single unified CLI. JSON-first output is script-friendly. Adds Drive,
  Contacts, Tasks, Docs, Sheets which MCP doesn't cover. Could complement or
  replace MCP for scriptable Google access.
- **Workflow fit:** HIGH value if you want scriptable Google Workspace access
  beyond what MCP provides. The Drive/Docs/Sheets/Tasks coverage fills gaps MCP
  doesn't address.
- **Confidence:** MEDIUM (newer project, less battle-tested)

---

## Category 2: Slack

### slackcat

- **What:** CLI utility to post files and command output to Slack channels —
  pipe anything to Slack
- **URL:** https://github.com/bcicen/slackcat / http://slackcat.chat/
- **Install:** `brew install slackcat` / pre-built binaries / `go install`
- **Stars/Activity:** ~1.3k stars; stable/mature
- **Windows:** Yes — Go binary, cross-platform
- **Auth:** Slack OAuth token (one-time browser auth flow)
- **vs MCP:** No MCP equivalent exists for Slack in user's setup. slackcat is
  purpose-built for one thing: sending CLI output to Slack. Perfect for
  notifications.
- **Workflow fit:** HIGH — pipe build output, test results, or Claude task
  completions to a Slack channel. Example:
  `echo "Task done" | slackcat --channel dev-alerts`
- **Confidence:** HIGH

### slack-cli (Community)

- **What:** Powerful Slack CLI via pure bash — rich messaging, uploads, posts,
  piping
- **URL:** https://github.com/rockymadden/slack-cli
- **Install:** `brew install rockymadden/rockymadden/slack-cli` / manual
- **Stars/Activity:** ~700 stars; mature but less actively maintained
- **Windows:** Partial — requires bash (Git Bash should work)
- **Auth:** Slack API token via environment variable
- **vs MCP:** More feature-rich than slackcat for Slack interactions (channels,
  users, files, messaging)
- **Workflow fit:** MEDIUM — if you need more than just posting messages to
  Slack from the terminal
- **Confidence:** MEDIUM

### slack-term

- **What:** Full Slack TUI client for your terminal — browse channels, send
  messages, threads
- **URL:** https://github.com/jpbruinsslot/slack-term
- **Install:** Pre-built binaries / `go install` / Docker
- **Stars/Activity:** ~6.2k stars; mature
- **Windows:** Partial — Go binary, but TUI rendering may have Windows terminal
  issues
- **Auth:** Slack legacy API token
- **vs MCP:** Full interactive Slack client vs. no Slack MCP. If you use Slack
  heavily, this provides terminal access.
- **Workflow fit:** LOW for Claude Code workflow — you'd use the regular Slack
  app for interactive chat. slackcat is better for programmatic posting.
- **Confidence:** MEDIUM

### Slack CLI (Official)

- **What:** Official Slack CLI for creating, developing, and deploying Slack
  apps
- **URL:** https://github.com/slackapi/slack-cli /
  https://docs.slack.dev/tools/slack-cli/
- **Install:** `npm install -g @slack/cli` or standalone binary
- **Stars/Activity:** Official Slack product; actively maintained
- **Windows:** Yes — officially supported
- **Auth:** Slack workspace auth flow
- **vs MCP:** This is for Slack app development, not for sending messages.
  Different use case.
- **Workflow fit:** LOW — only useful if building Slack apps/bots, not for
  communication
- **Confidence:** HIGH (official tool, but wrong use case)

---

## Category 3: Calendar

### gcalcli

- **What:** Google Calendar CLI — agenda, events, reminders, search, import from
  terminal
- **URL:** https://github.com/insanum/gcalcli
- **Install:** `pip install gcalcli`
- **Stars/Activity:** ~3.6k stars; actively maintained through 2026; recent
  config.toml support added
- **Windows:** Yes — Python package, cross-platform
- **Auth:** Google OAuth2 (browser flow, supports `--noauth_local_server` for
  remote)
- **vs MCP:** User already has Google Calendar MCP. gcalcli adds: reminder
  execution (run any command when event starts), terminal agenda display, ICS
  import, and scriptable event creation. MCP is better for AI-assisted
  scheduling; gcalcli is better for scripting and reminders.
- **Workflow fit:** MEDIUM — the reminder/execution feature is unique (trigger
  scripts when calendar events fire). Otherwise MCP covers the core needs.
- **Confidence:** HIGH

### khal

- **What:** Standards-based terminal calendar with CalDAV sync via vdirsyncer
- **URL:** https://github.com/pimutils/khal
- **Install:** `pip install khal`
- **Stars/Activity:** ~2.7k stars; actively maintained
- **Windows:** Partial — Python, but depends on Unix-specific libraries; may
  need WSL
- **Auth:** CalDAV credentials (via vdirsyncer config)
- **vs MCP:** khal works with any CalDAV server (not just Google). Better for
  self-hosted calendars or multi-provider setups.
- **Workflow fit:** LOW — unless you use non-Google CalDAV calendars
- **Confidence:** MEDIUM

### calcurse

- **What:** Terminal calendar and scheduling application with ncurses TUI
- **URL:** https://calcurse.org/
- **Install:** Package managers on Linux/macOS
- **Stars/Activity:** v4.8.2 released Jun 2025; mature project
- **Windows:** No — Unix/Linux only
- **Auth:** Local calendar format only (no Google/CalDAV sync)
- **vs MCP:** Completely different — local-only calendar. No cloud sync.
- **Workflow fit:** LOW — no Google integration, no Windows support
- **Confidence:** LOW

---

## Category 4: Notifications & Alerts

### ntfy (ntfy.sh)

- **What:** HTTP-based pub-sub push notification service — send alerts to
  phone/desktop via curl
- **URL:** https://github.com/binwiederhier/ntfy / https://ntfy.sh/
- **Install:** `choco install ntfy` / Docker / standalone binary / self-hosted
- **Stars/Activity:** ~29k stars; v2.18.0 released 2026; very actively
  maintained
- **Windows:** Yes — Windows binary, desktop client, web app, Android/iOS apps
- **Auth:** Optional (public topics need no auth; self-hosted supports user
  auth + ACLs)
- **vs MCP:** No MCP equivalent. ntfy fills a critical gap: push notifications
  FROM Claude Code tasks TO your phone/desktop. Multiple blog posts document
  ntfy + Claude Code hooks integration.
- **Workflow fit:** **HIGHEST VALUE TOOL IN THIS RESEARCH.** Send notifications
  when Claude Code tasks complete, need input, or encounter errors. One-liner:
  `curl -d "Build complete" ntfy.sh/my-alerts`. Integrates with Claude Code
  hooks natively.
- **Confidence:** HIGH

### claude-notifications-go

- **What:** Cross-platform smart notification plugin specifically for Claude
  Code — 6 notification types, click-to-focus, webhook integrations
- **URL:** https://github.com/777genius/claude-notifications-go
- **Install:** One-line install via Claude Code marketplace
- **Stars/Activity:** New project (2026); actively developed
- **Windows:** Yes — cross-platform (Linux, macOS, Windows)
- **Auth:** No auth needed for local notifications; webhook config for
  ntfy/Slack/Telegram
- **vs MCP:** Purpose-built for Claude Code notifications. Handles Task
  Complete, Review Complete, Question, Plan Ready, Session Limit, API Error
  events.
- **Workflow fit:** HIGH — if you want zero-config Claude Code notifications
  without manual ntfy setup. Supports ntfy, Slack, Telegram webhooks under the
  hood.
- **Confidence:** MEDIUM (new project, less proven)

### ntfy (dschep)

- **What:** Python utility for desktop notifications when commands finish —
  `ntfy done <command>`
- **URL:** https://github.com/dschep/ntfy
- **Install:** `pip install ntfy`
- **Stars/Activity:** ~4.6k stars; mature but less actively maintained
- **Windows:** Partial — desktop notifications may not work natively on Windows
- **Auth:** None for local desktop notifications; supports Pushover, Telegram,
  etc. backends
- **vs MCP:** Different from ntfy.sh — this wraps long-running commands and
  notifies on completion
- **Workflow fit:** MEDIUM — useful for `ntfy done npm run build` style
  notifications, but ntfy.sh is more versatile
- **Confidence:** MEDIUM

### Pushover

- **What:** Push notification service with simple API — send alerts to all your
  devices
- **URL:** https://pushover.net/ (no standalone CLI; use curl or wrapper
  scripts)
- **Install:** `curl` one-liner or Python/shell wrapper scripts
- **Stars/Activity:** Commercial service; stable; various community CLI wrappers
- **Windows:** Yes — via API calls with curl; apps for iOS/Android/Desktop
- **Auth:** API token + user key (requires $5 one-time app purchase per
  platform)
- **vs MCP:** Similar role to ntfy.sh but commercial. More reliable (hosted
  service with SLA).
- **Workflow fit:** MEDIUM — if you want a paid, reliable alternative to ntfy.sh
  with better delivery guarantees
- **Confidence:** HIGH

---

## Category 5: Chat & Messaging

### signal-cli

- **What:** Unofficial CLI for Signal messenger — send/receive encrypted
  messages from terminal
- **URL:** https://github.com/AsamK/signal-cli
- **Install:** Pre-built binaries / build from source (requires Java)
- **Stars/Activity:** ~4.3k stars; v0.14.1 released Mar 2026; actively
  maintained
- **Windows:** Yes — Java-based, cross-platform binaries
- **Auth:** Signal phone number registration + verification
- **vs MCP:** No MCP equivalent. signal-cli enables encrypted programmatic
  messaging — send alerts to yourself or others via Signal.
- **Workflow fit:** HIGH — send yourself encrypted notifications when long tasks
  complete. More private than ntfy (end-to-end encrypted). Example:
  `signal-cli -u +1234567890 send -m "Deploy done" +0987654321`
- **Confidence:** HIGH

### WeeChat

- **What:** Extensible terminal chat client — IRC, Matrix, Slack, Discord via
  plugins
- **URL:** https://github.com/weechat/weechat / https://weechat.org/
- **Install:** Package managers / build from source; Windows via Cygwin/WSL
- **Stars/Activity:** ~3k+ stars; v4.5.2 released 2026; actively maintained for
  20+ years
- **Windows:** Partial — runs on Windows via Cygwin or WSL/Bash
- **Auth:** Per-protocol (IRC: NickServ/SASL, Matrix: homeserver credentials)
- **vs MCP:** Multi-protocol chat client for staying in terminal. Not scriptable
  in the same way as MCP.
- **Workflow fit:** LOW for Claude Code workflow — only if you want IRC/Matrix
  access from terminal. Full TUI commitment.
- **Confidence:** MEDIUM

### Irssi

- **What:** Classic terminal IRC client — lightweight, Perl-scriptable, 25+
  years mature
- **URL:** https://irssi.org/ / https://github.com/irssi/irssi
- **Install:** Package managers; Windows via Cygwin
- **Stars/Activity:** ~2.9k stars; mature project
- **Windows:** Partial — Cygwin or WSL only
- **Auth:** IRC NickServ/SASL
- **vs MCP:** IRC-only client. Very niche use case.
- **Workflow fit:** LOW — unless you actively use IRC
- **Confidence:** MEDIUM

### Telegram CLI

- **What:** Terminal clients for Telegram messenger
- **URL:** https://github.com/paul-nameless/tg (TUI) /
  https://github.com/erayerdin/tgcli (bot messages)
- **Install:** `pip install tg` or build from source
- **Stars/Activity:** Various projects, 1-3k stars; mixed maintenance
- **Windows:** Partial — Python-based should work; C-based clients need WSL
- **Auth:** Telegram API credentials / bot token
- **vs MCP:** No MCP equivalent for Telegram. tgcli can send bot messages
  programmatically.
- **Workflow fit:** MEDIUM — if you use Telegram, tgcli can send bot
  notifications. ntfy.sh also supports Telegram as a backend.
- **Confidence:** MEDIUM

### Discord Terminal Clients

- **What:** Unofficial Discord TUI clients (discordo, cordless)
- **URL:** https://github.com/ayn2op/discordo
- **Install:** `go install` / pre-built binaries
- **Stars/Activity:** discordo actively developed; cordless archived/abandoned
- **Windows:** Partial — Go binaries work but TUI rendering varies
- **Auth:** Discord user token (violates TOS)
- **vs MCP:** No MCP equivalent, but using these risks account ban.
- **Workflow fit:** NOT RECOMMENDED — against Discord TOS. Account suspension
  risk. Use Discord's webhook API for notifications instead.
- **Confidence:** LOW

### Microsoft Teams CLI

- **What:** Community-built terminal clients for MS Teams
- **URL:** https://github.com/fossteams/teams-cli /
  https://github.com/atc0005/send2teams
- **Install:** Build from source / `go install`
- **Stars/Activity:** Low stars (<200); experimental
- **Windows:** Partial — Go binaries
- **Auth:** Microsoft OAuth2
- **vs MCP:** No MCP equivalent. send2teams is useful for posting messages to
  Teams channels programmatically.
- **Workflow fit:** LOW — only if your workplace uses Teams and you want CLI
  notifications there
- **Confidence:** LOW

### Twilio CLI

- **What:** Official CLI for Twilio — send SMS, make calls, manage Twilio
  resources
- **URL:** https://www.twilio.com/docs/twilio-cli/quickstart
- **Install:** `npm install -g twilio-cli` / `brew install twilio/brew/twilio`
- **Stars/Activity:** Official Twilio product; actively maintained
- **Windows:** Yes — npm package, cross-platform
- **Auth:** Twilio Account SID + Auth Token
- **vs MCP:** No MCP equivalent. Enables SMS notifications from CLI. Costs per
  message.
- **Workflow fit:** MEDIUM — send SMS alerts for critical events. Example:
  `twilio api:core:messages:create --from "+1..." --to "+1..." --body "Deploy failed"`.
  Requires paid Twilio account.
- **Confidence:** HIGH

---

## Category 6: Social Media

### toot

- **What:** Mastodon CLI and TUI client — post, reply, search, follow, media
  uploads
- **URL:** https://github.com/ihabunek/toot
- **Install:** `pip install toot` / `snap install toot`
- **Stars/Activity:** ~1.1k stars; actively maintained
- **Windows:** Yes — Python package, cross-platform
- **Auth:** Mastodon instance OAuth (browser flow)
- **vs MCP:** No MCP equivalent for Mastodon. toot enables posting from
  terminal.
- **Workflow fit:** LOW — only if you use Mastodon for professional updates
- **Confidence:** HIGH

### Simplex (cross-poster)

- **What:** Post to Twitter/X, Bluesky, Mastodon, and LinkedIn with a single
  command
- **URL:** https://github.com/kristoff-it/simplex
- **Install:** Clone repo; depends on `t`, `toot`, `bksy`, `linkedin-cli`
- **Stars/Activity:** Small project; novel concept
- **Windows:** Partial — bash script, works in Git Bash
- **Auth:** Each platform authenticated separately via its own CLI tool
- **vs MCP:** No MCP equivalent. Unified cross-posting from terminal.
- **Workflow fit:** LOW — only if you post to multiple social platforms
  regularly
- **Confidence:** LOW

---

## Category 7: File Sharing

### croc

- **What:** Securely send files between any two computers — relay-based,
  end-to-end encrypted, resumable
- **URL:** https://github.com/schollz/croc
- **Install:** `choco install croc` / `scoop install croc` / `brew install croc`
  / `go install`
- **Stars/Activity:** ~34k stars; v10.3.1 (Nov 2025); very actively maintained
- **Windows:** Yes — first-class Windows support via Chocolatey/Scoop; single
  binary
- **Auth:** None — uses PAKE (password-authenticated key exchange) with
  generated codes
- **vs MCP:** No MCP equivalent. Fills a different need — transferring files
  between machines.
- **Workflow fit:** HIGH — quickly share files between your dev machine and
  others. Example: `croc send myfile.zip` generates a code the recipient uses to
  receive. Works across platforms.
- **Confidence:** HIGH

### magic-wormhole

- **What:** Original CLI file transfer tool — PAKE-encrypted, rendezvous-server
  based
- **URL:** https://github.com/magic-wormhole/magic-wormhole
- **Install:** `pip install magic-wormhole`
- **Stars/Activity:** ~20k stars; actively maintained
- **Windows:** Partial — Python package, works but requires Python ecosystem
  setup
- **Auth:** None — PAKE with generated wormhole codes
- **vs MCP:** Same role as croc but Python-based. croc is easier to install on
  Windows.
- **Workflow fit:** MEDIUM — croc is preferred on Windows due to simpler install
- **Confidence:** HIGH

---

## Tier Rankings

### Tier 1: Highest Value — Install These

| Tool           | Category      | Why                                                                                                         |
| -------------- | ------------- | ----------------------------------------------------------------------------------------------------------- |
| **ntfy.sh**    | Notifications | Push alerts to phone/desktop when Claude tasks finish. Proven Claude Code integration via hooks. 29k stars. |
| **slackcat**   | Slack         | Pipe any CLI output to Slack. One-liner integration.                                                        |
| **croc**       | File Sharing  | Fastest way to transfer files between machines. Single binary, Windows-native. 34k stars.                   |
| **signal-cli** | Messaging     | Encrypted programmatic alerts via Signal. Good for sensitive notifications.                                 |

### Tier 2: High Value — Consider Based on Workflow

| Tool                        | Category      | Why                                                                                                         |
| --------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------- |
| **claude-notifications-go** | Notifications | Zero-config Claude Code notifications with 6 event types. New but purpose-built.                            |
| **gogcli**                  | Email + More  | Unified Google Workspace CLI (Gmail, Calendar, Drive, Docs, Tasks). Complements MCP with Drive/Docs access. |
| **gcalcli**                 | Calendar      | Calendar reminders that execute commands. Useful for automated scheduling triggers.                         |
| **himalaya**                | Email         | Scriptable email for non-Gmail accounts. JSON output for pipelines.                                         |

### Tier 3: Niche — Only If You Use the Platform

| Tool         | Category | Why                                              |
| ------------ | -------- | ------------------------------------------------ |
| toot         | Social   | Mastodon CLI. Only if you use Mastodon.          |
| WeeChat      | Chat     | IRC/Matrix TUI. Only if you use IRC/Matrix.      |
| Twilio CLI   | SMS      | Paid SMS alerts. Only if you need SMS.           |
| Telegram CLI | Chat     | Telegram bot messages. Only if you use Telegram. |

### Not Recommended

| Tool                     | Why Not                                         |
| ------------------------ | ----------------------------------------------- |
| Discord terminal clients | Against TOS; account ban risk                   |
| calcurse                 | No cloud sync, no Windows                       |
| NeoMutt/aerc on Windows  | Poor Windows support; MCP Gmail covers the need |

---

## MCP vs CLI Comparison

| Capability          | MCP (Current)       | Best CLI Alternative | Verdict                                                    |
| ------------------- | ------------------- | -------------------- | ---------------------------------------------------------- |
| Read Gmail          | Gmail MCP           | himalaya, gogcli     | **MCP wins** — AI-integrated, conversational               |
| Draft Gmail         | Gmail MCP           | himalaya, gogcli     | **MCP wins** — natural language drafting                   |
| Search Gmail        | Gmail MCP           | himalaya, gogcli     | **MCP wins** — semantic search via AI                      |
| Script email ops    | Gmail MCP (limited) | himalaya             | **CLI wins** — JSON output, piping, batch ops              |
| Calendar view       | Calendar MCP        | gcalcli              | **Tie** — MCP for AI queries, gcalcli for terminal display |
| Calendar create     | Calendar MCP        | gcalcli, gogcli      | **MCP wins** — natural language event creation             |
| Calendar reminders  | Not available       | gcalcli              | **CLI wins** — execute commands on event triggers          |
| Push notifications  | Not available       | ntfy.sh              | **CLI wins** — no MCP equivalent exists                    |
| Slack posting       | Not available       | slackcat             | **CLI wins** — no MCP equivalent exists                    |
| File transfer       | Not available       | croc                 | **CLI wins** — no MCP equivalent exists                    |
| Encrypted messaging | Not available       | signal-cli           | **CLI wins** — no MCP equivalent exists                    |
| Google Drive/Docs   | Not available       | gogcli               | **CLI wins** — no MCP equivalent exists                    |

**Bottom line:** MCP excels at AI-assisted, conversational interactions with
Gmail and Calendar. CLI tools are better for scriptable automation,
notifications, and services not covered by MCP (Slack, notifications, file
transfer, encrypted messaging).

---

## Quick-Start: Claude Code + ntfy Integration

The most impactful addition for the user's workflow. Multiple community guides
confirm this pattern (Feb-Mar 2026):

```jsonc
// .claude/settings.json — hooks section
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Stop",
        "command": "curl -s -d 'Claude needs input' ntfy.sh/YOUR_TOPIC",
      },
    ],
    "SessionEnd": [
      {
        "command": "curl -s -d 'Session complete' ntfy.sh/YOUR_TOPIC",
      },
    ],
  },
}
```

Install ntfy mobile app, subscribe to your topic, and receive push notifications
when Claude Code needs attention.

---

## Sources

- [Himalaya GitHub](https://github.com/pimalaya/himalaya)
- [aerc official site](https://aerc-mail.org/)
- [gogcli GitHub](https://github.com/steipete/gogcli)
- [gogcli website](https://gogcli.sh/)
- [Google Workspace CLI](https://github.com/googleworkspace/cli)
- [slackcat GitHub](https://github.com/bcicen/slackcat)
- [slack-term GitHub](https://github.com/jpbruinsslot/slack-term)
- [slack-cli community GitHub](https://github.com/rockymadden/slack-cli)
- [Slack CLI official](https://docs.slack.dev/tools/slack-cli/)
- [gcalcli GitHub](https://github.com/insanum/gcalcli)
- [khal GitHub](https://github.com/pimutils/khal)
- [ntfy.sh docs](https://docs.ntfy.sh/)
- [ntfy GitHub](https://github.com/binwiederhier/ntfy)
- [ntfy desktop client](https://github.com/Aetherinox/ntfy-desktop)
- [Claude Code + ntfy guide](https://felipeelias.github.io/2026/02/25/claude-code-notifications.html)
- [Claude Code ntfy hooks](https://tonydehnke.com/blog/claude-code-notifications-ntfy-hooks/)
- [Claude Code notification hooks](https://alexop.dev/posts/claude-code-notification-hooks/)
- [claude-notifications-go](https://github.com/777genius/claude-notifications-go)
- [signal-cli GitHub](https://github.com/AsamK/signal-cli)
- [WeeChat GitHub](https://github.com/weechat/weechat)
- [Irssi](https://irssi.org/)
- [toot GitHub](https://github.com/ihabunek/toot)
- [Simplex cross-poster](https://github.com/kristoff-it/simplex)
- [croc GitHub](https://github.com/schollz/croc)
- [magic-wormhole GitHub](https://github.com/magic-wormhole/magic-wormhole)
- [Twilio CLI docs](https://www.twilio.com/docs/twilio-cli/quickstart)
- [discordo GitHub](https://github.com/ayn2op/discordo)
- [send2teams GitHub](https://github.com/atc0005/send2teams)
- [Pushover](https://pushover.net/)
- [Terminal email clients 2026](https://forwardemail.net/en/blog/open-source/terminal-email-clients)
- [CLI email clients 2026](https://forwardemail.net/en/blog/open-source/command-line--cli-email-clients)
