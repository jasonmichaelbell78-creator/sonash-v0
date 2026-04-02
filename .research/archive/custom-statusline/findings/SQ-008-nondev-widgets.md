# SQ-008: Non-Development, Lifestyle & Productivity Statusline Widgets

**Researched:** 2026-03-23 **Scope:** What non-dev widgets exist in
statusline/status bar tools and which translate to a Claude Code statusline on
Windows 11?

---

## 1. Executive Summary

Terminal status bars have long supported widgets beyond development metrics.
Tmux alone has 30+ non-dev status bar plugins. Polybar ships 80+ community
scripts. Waybar has 35+ built-in modules. i3pystatus has 40+ modules including
Spotify, Pomodoro, Reddit, weather, and email. ccstatusline (the dominant Claude
Code statusline tool) currently has **zero** dedicated non-dev widgets but its
**Custom Command** widget is specifically designed to fill this gap by running
arbitrary shell commands.

The user already has Google Calendar MCP and Gmail MCP integrations in Claude
Code. These are significant because Claude could query them within the
statusline script context, but only via the Custom Command widget pattern (shell
script that calls an API or reads cached data).

**Key finding:** The most practical non-dev widgets for a Claude Code statusline
on Windows 11 are: next calendar event, unread email count, clock/timezone,
session duration timer, battery level, and break reminder. Weather and Spotify
are popular but less actionable. System metrics (CPU/RAM) are available but
compete with Task Manager.

---

## 2. Widget Catalog by Category

### 2.1 Time & Calendar

#### Clock / Time Display

| Attribute            | Detail                                                                                                                                             |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What it shows**    | `14:32 EST` or `2:32 PM` or dual-zone `14:32 / 09:32 PST`                                                                                          |
| **Data source**      | System clock (`date` command, PowerShell `Get-Date`)                                                                                               |
| **Performance cost** | <1ms (system call, no I/O)                                                                                                                         |
| **Windows compat**   | Full. `date +%H:%M` in Git Bash or `powershell -c "Get-Date -f 'HH:mm'"`                                                                           |
| **Existing tools**   | tmux (built-in `#(date)`), Waybar `clock`, i3status `tztime`, Polybar `date`, Starship `time` module                                               |
| **Claude invocable** | Yes, trivial shell command                                                                                                                         |
| **Practical value**  | **Medium**. Useful if terminal is full-screen and system clock is hidden. Dual-timezone is genuinely useful for the user who works across locales. |

**Example ccstatusline implementation:**

```bash
date +"%H:%M %Z"
```

#### Next Calendar Event (Countdown)

| Attribute            | Detail                                                                                                                                                                 |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What it shows**    | `Next: Standup in 23m` or `Meeting: 1:1 w/ Alex @ 3:00 PM (1h 12m)`                                                                                                    |
| **Data source**      | Google Calendar API via MCP, gcalcli, or cached `.json` file                                                                                                           |
| **Performance cost** | 200-800ms if hitting API live; <5ms if reading cached file                                                                                                             |
| **Windows compat**   | Full via MCP or gcalcli (Python). Cache approach works everywhere.                                                                                                     |
| **Existing tools**   | tmux + gcalcli (`gcalcli agenda \| head -2`), Polybar `nevarman/polybar-calendar`, Waybar custom script, i3pystatus `calendar`                                         |
| **Claude invocable** | Yes. User has Google Calendar MCP. Claude could write a cron/scheduled task that dumps next event to a cache file every 5 minutes, and the statusline reads the cache. |
| **Practical value**  | **HIGH**. This is the #1 non-dev widget. Prevents missed meetings when deep in terminal work. The user already has the MCP integration.                                |

**Implementation pattern:**

1. Background script runs every 5 min: calls Calendar MCP or gcalcli, writes
   `~/.cache/next-event.txt` with formatted output
2. Statusline script reads the cache file (<1ms)
3. Calculates countdown from current time vs event start time

#### Pomodoro / Focus Timer

| Attribute            | Detail                                                                                                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **What it shows**    | `FOCUS 18:42` (countdown) or `BREAK 3:15` or `P: 3/4` (session count)                                                                                                                      |
| **Data source**      | Local state file tracking start time and session count                                                                                                                                     |
| **Performance cost** | <2ms (read file, compute elapsed)                                                                                                                                                          |
| **Windows compat**   | Full. File-based state works on any OS.                                                                                                                                                    |
| **Existing tools**   | tmux-pomodoro-plus (most popular, 500+ stars), i3pystatus `pomodoro`, py3status `pomodoro`, Polybar `info-projecthamster`                                                                  |
| **Claude invocable** | Yes. Could start/stop via Claude commands. State file at `~/.cache/pomodoro.json`.                                                                                                         |
| **Practical value**  | **Medium-High**. Particularly useful for someone who works long terminal sessions. The visual reminder to take breaks has genuine health value. Pairs well with session duration tracking. |

**State file format:**

```json
{
  "state": "focus",
  "started_at": "2026-03-23T14:00:00Z",
  "duration_min": 25,
  "sessions_completed": 3,
  "break_duration_min": 5
}
```

#### Date Display

| Attribute            | Detail                                                                                                           |
| -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **What it shows**    | `Sun Mar 23` or `2026-03-23` or `Week 12`                                                                        |
| **Data source**      | System clock                                                                                                     |
| **Performance cost** | <1ms                                                                                                             |
| **Windows compat**   | Full                                                                                                             |
| **Existing tools**   | Every statusbar tool has this built-in                                                                           |
| **Claude invocable** | Yes, trivial                                                                                                     |
| **Practical value**  | **Low**. Rarely needed in isolation; usually combined with clock. Week number can be useful for sprint tracking. |

---

### 2.2 Communication

#### Unread Email Count

| Attribute            | Detail                                                                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What it shows**    | `INBOX: 12` or `3 unread` or icon + count                                                                                                         |
| **Data source**      | Gmail API via MCP, IMAP query, or cached count file                                                                                               |
| **Performance cost** | 300-1500ms if hitting API; <5ms if cached                                                                                                         |
| **Windows compat**   | Full via MCP (user has Gmail MCP). IMAP works everywhere.                                                                                         |
| **Existing tools**   | tmux-maildir-counter, Polybar `inbox-imap-shellnetrc`, `inbox-imap-pythongpg`, i3pystatus `mail`, `quelotic/polybarModules`                       |
| **Claude invocable** | Yes. User has Gmail MCP (`gmail_search_messages` with `is:unread`). Same cache pattern as calendar.                                               |
| **Practical value**  | **Medium**. Useful to know if something urgent arrived. Risk: becomes a distraction if checked obsessively. Best if it only shows when count > 0. |

**Cache implementation:**

```bash
# Background: every 10 min, write unread count
# Statusline reads: ~/.cache/gmail-unread.txt
count=$(cat ~/.cache/gmail-unread.txt 2>/dev/null || echo "0")
[ "$count" -gt 0 ] && echo "MAIL:$count"
```

#### Calendar Alerts / Meeting Imminent

| Attribute            | Detail                                                                                                                                               |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What it shows**    | `!! MEETING IN 5 MIN !!` (flashing/colored when imminent)                                                                                            |
| **Data source**      | Same as next calendar event, but with urgency threshold                                                                                              |
| **Performance cost** | <5ms (reads same cache as calendar widget)                                                                                                           |
| **Windows compat**   | Full                                                                                                                                                 |
| **Existing tools**   | gcalcli `remind` command, Waybar custom with urgency classes                                                                                         |
| **Claude invocable** | Yes                                                                                                                                                  |
| **Practical value**  | **HIGH**. This is the killer feature of the calendar widget. A subtle "next meeting" becomes a loud alert when threshold is crossed (e.g., <10 min). |

#### Notification Count (General)

| Attribute            | Detail                                                                                                                      |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **What it shows**    | `NOTIF: 5` (aggregated from multiple sources)                                                                               |
| **Data source**      | OS notification center, custom aggregation                                                                                  |
| **Performance cost** | 50-200ms depending on source                                                                                                |
| **Windows compat**   | Partial. Windows notification API is COM-based, harder to query from bash. PowerShell can read Action Center but it's slow. |
| **Existing tools**   | Polybar `dunst-snooze`, Waybar custom                                                                                       |
| **Claude invocable** | Partially. Would need a custom aggregator script.                                                                           |
| **Practical value**  | **Low**. Too vague to be actionable. Better to show specific counts (email, calendar) than generic notification count.      |

---

### 2.3 System Monitoring

#### CPU / Memory Usage

| Attribute            | Detail                                                                                                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What it shows**    | `CPU:23% MEM:61%` or `CPU:23% RAM:9.8/16G`                                                                                                                                      |
| **Data source**      | OS APIs. Windows: `Get-CimInstance Win32_Processor`, `Get-Process`, `systeminfo`. Linux: `/proc/stat`, `/proc/meminfo`.                                                         |
| **Performance cost** | 50-300ms on Windows (PowerShell startup overhead ~200ms). <5ms on Linux.                                                                                                        |
| **Windows compat**   | Full but **slow** due to PowerShell cold-start. Mitigation: use `wmic` (deprecated) or cache with background script. Node.js `os.cpus()` and `os.freemem()` are faster (~10ms). |
| **Existing tools**   | tmux-cpu, tmux-mem-cpu-load, Waybar `cpu`/`memory`, i3status `cpu_usage`/`memory`, Polybar `cpu`/`memory`, i3pystatus `cpu_usage`/`mem`, ccstatusline `Memory Usage` widget     |
| **Claude invocable** | Yes, but performance matters. Best via Node.js one-liner or cached.                                                                                                             |
| **Practical value**  | **Medium**. Useful to notice when a build or process is consuming excessive resources. ccstatusline already has a Memory widget.                                                |

**Fast Windows approach (Node.js):**

```bash
node -e "const os=require('os');const f=os.freemem(),t=os.totalmem();console.log('RAM:'+Math.round((1-f/t)*100)+'%')"
```

Execution time: ~40ms (Node already loaded for ccstatusline).

#### Battery Level

| Attribute            | Detail                                                                                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **What it shows**    | `BAT: 67% [charging]` or `BAT: 23% !!` (low warning)                                                                                             |
| **Data source**      | Windows: `Get-CimInstance Win32_Battery`, `WMIC path Win32_Battery`. macOS: `pmset -g batt`. Linux: `/sys/class/power_supply/`                   |
| **Performance cost** | 150-300ms (PowerShell), <5ms (Linux sysfs)                                                                                                       |
| **Windows compat**   | Full. Desktop machines report no battery (widget auto-hides).                                                                                    |
| **Existing tools**   | tmux-battery (500+ stars), Waybar `battery`, i3status `battery`, Polybar `battery-combined-udev`, i3pystatus `battery`                           |
| **Claude invocable** | Yes                                                                                                                                              |
| **Practical value**  | **Medium** on laptop, **None** on desktop. Should auto-hide when no battery detected. Useful for the user if working on a laptop away from desk. |

**Windows one-liner:**

```powershell
powershell -NoProfile -c "(Get-CimInstance Win32_Battery).EstimatedChargeRemaining"
```

#### Disk Space

| Attribute            | Detail                                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **What it shows**    | `C: 142G free` or `DISK: 78%`                                                                                                  |
| **Data source**      | `df -h` (Git Bash), PowerShell `Get-PSDrive`, `wmic logicaldisk`                                                               |
| **Performance cost** | 30-150ms                                                                                                                       |
| **Windows compat**   | Full                                                                                                                           |
| **Existing tools**   | tmux-df, Waybar `disk`, i3status `disk`, Polybar `filesystem`, i3pystatus `disk`                                               |
| **Claude invocable** | Yes                                                                                                                            |
| **Practical value**  | **Low**. Only useful when disk is nearly full. Better as a threshold alert (show only when >90% used) than a constant display. |

#### Network Status

| Attribute            | Detail                                                                                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What it shows**    | `WiFi: Connected` or `VPN: Active` or `NET: 45Mbps`                                                                                                                 |
| **Data source**      | `ipconfig`, `netsh`, PowerShell `Get-NetAdapter`. Linux: `ip addr`, `nmcli`.                                                                                        |
| **Performance cost** | 100-400ms                                                                                                                                                           |
| **Windows compat**   | Full                                                                                                                                                                |
| **Existing tools**   | tmux-online-status, tmux-net-speed, tmux-ip-address, Waybar `network`, i3status `wireless`/`ethernet`, Polybar `network-publicip`, i3pystatus `network`             |
| **Claude invocable** | Yes                                                                                                                                                                 |
| **Practical value**  | **Low-Medium**. VPN status is the most actionable piece (am I connected to work VPN?). Raw speed is rarely useful. Online/offline is useful for spotty connections. |

#### System Uptime

| Attribute            | Detail                                                                                 |
| -------------------- | -------------------------------------------------------------------------------------- |
| **What it shows**    | `UP: 3d 14h`                                                                           |
| **Data source**      | `uptime`, PowerShell `(Get-CimInstance Win32_OperatingSystem).LastBootUpTime`          |
| **Performance cost** | 50-200ms                                                                               |
| **Windows compat**   | Full                                                                                   |
| **Existing tools**   | tmux-uptime, i3pystatus `uptime`, i3status (via custom)                                |
| **Claude invocable** | Yes                                                                                    |
| **Practical value**  | **Very Low**. Novelty only. Knowing your machine has been up 3 days is not actionable. |

---

### 2.4 Media & Lifestyle

#### Currently Playing Music (Spotify / Media)

| Attribute            | Detail                                                                                                                                                           |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What it shows**    | `Now: Artist - Song Title` or `Spotify: Radiohead - Everything In Its Right Place`                                                                               |
| **Data source**      | Spotify Web API, MPRIS (Linux), Windows Media Session API, `playerctl`                                                                                           |
| **Performance cost** | 200-800ms (API call), <50ms (local D-Bus/COM query)                                                                                                              |
| **Windows compat**   | Partial. No `playerctl` on Windows. Spotify Web API works. Windows GlobalSystemMediaTransportControls API is accessible via PowerShell but complex.              |
| **Existing tools**   | tmux-now-playing, tmux-spotify-tui, tmux-spotify-info, Waybar `mpris`, Polybar `player-mpris-tail`, `polybar-spotify`, i3pystatus `spotify`/`now_playing`        |
| **Claude invocable** | Via Spotify Web API with OAuth token, or via PowerShell COM on Windows                                                                                           |
| **Practical value**  | **Low**. Purely aesthetic/fun. Does not drive any action. The user knows what they're listening to. Popular in ricing communities but not productivity-relevant. |

#### Weather (Current Conditions)

| Attribute            | Detail                                                                                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What it shows**    | `72F Sunny` or `22C Cloudy` or `Nashville: 72F`                                                                                                           |
| **Data source**      | wttr.in (free, no API key), OpenWeatherMap API (free tier), weather.com                                                                                   |
| **Performance cost** | 500-2000ms (HTTP request). With caching: <5ms.                                                                                                            |
| **Windows compat**   | Full. `curl wttr.in/?format="%t+%C"` works in Git Bash.                                                                                                   |
| **Existing tools**   | tmux-weather, tmux-clima, tmux-weather-info-yr, Waybar custom, Polybar `openweathermap-*` (3 variants), i3pystatus `weather`, tmux-powerline `weather.sh` |
| **Claude invocable** | Yes. Simple curl command or cached.                                                                                                                       |
| **Practical value**  | **Low-Medium**. Mildly useful to know if it's raining before stepping out. Not actionable during coding. Best cached with 30-60 min refresh.              |

**Compact one-liner:**

```bash
curl -s "wttr.in/?format=%t+%C" 2>/dev/null || echo "?"
# Output: +72°F Sunny
```

**Cached approach (recommended for statusline):**

```bash
# Background cron every 30 min: curl -s "wttr.in/?format=%t+%C" > ~/.cache/weather.txt
cat ~/.cache/weather.txt 2>/dev/null
```

#### Motivational Quotes

| Attribute            | Detail                                                                          |
| -------------------- | ------------------------------------------------------------------------------- |
| **What it shows**    | `"Ship it." — Reid Hoffman` (rotates periodically)                              |
| **Data source**      | Local text file, quotable.io API, fortune command                               |
| **Performance cost** | <5ms (local file), 300-800ms (API)                                              |
| **Windows compat**   | Full (file-based)                                                               |
| **Existing tools**   | Polybar custom scripts, tmux custom                                             |
| **Claude invocable** | Yes                                                                             |
| **Practical value**  | **Very Low**. Becomes wallpaper after day 1. Classic "cute but useless" widget. |

---

### 2.5 Productivity

#### Session Duration / Active Time Tracker

| Attribute            | Detail                                                                                                                                    |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **What it shows**    | `Session: 2h 34m` or `Today: 5h 12m`                                                                                                      |
| **Data source**      | ccstatusline already has `Session Duration` widget. For "today" tracking, needs a persistent log file.                                    |
| **Performance cost** | <2ms (timestamp math)                                                                                                                     |
| **Windows compat**   | Full                                                                                                                                      |
| **Existing tools**   | ccstatusline `Session Duration` (built-in), Polybar `info-projecthamster`, `info-wakatime`, tmux custom                                   |
| **Claude invocable** | Yes. Session duration is already in Claude Code's JSON payload.                                                                           |
| **Practical value**  | **HIGH**. ccstatusline already ships this. Knowing "I've been coding for 4 hours straight" triggers break decisions. Pairs with Pomodoro. |

#### Word / Line Count for Current Session

| Attribute            | Detail                                                                                                                                                                 |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What it shows**    | `+342 lines` or `Written: 1.2k lines`                                                                                                                                  |
| **Data source**      | `git diff --stat`, token counts from Claude Code JSON                                                                                                                  |
| **Performance cost** | 50-200ms (`git diff`)                                                                                                                                                  |
| **Windows compat**   | Full                                                                                                                                                                   |
| **Existing tools**   | ccstatusline `Git Insertions`/`Git Deletions` (built-in)                                                                                                               |
| **Claude invocable** | Yes. Git stats available. Token counts in JSON.                                                                                                                        |
| **Practical value**  | **Medium**. ccstatusline already shows git insertions/deletions. Lines written gives a sense of productivity but can encourage bad habits (more lines != better code). |

#### Break Reminder

| Attribute            | Detail                                                                                                                                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **What it shows**    | `BREAK DUE` (after 90 min continuous work) or `Eyes: REST` (20-20-20 rule)                                                                                                                                                     |
| **Data source**      | Session start time + configurable interval                                                                                                                                                                                     |
| **Performance cost** | <2ms                                                                                                                                                                                                                           |
| **Windows compat**   | Full                                                                                                                                                                                                                           |
| **Existing tools**   | tmux-pomodoro-plus (includes break reminders), Polybar custom, `focus` CLI tool                                                                                                                                                |
| **Claude invocable** | Yes                                                                                                                                                                                                                            |
| **Practical value**  | **Medium-High**. Ergonomic value is real. The 20-20-20 rule (every 20 min, look at something 20 feet away for 20 seconds) is medically recommended. Could flash/change color when break is due. Overlaps with Pomodoro widget. |

#### Typing Speed Indicator

| Attribute            | Detail                                                                                    |
| -------------------- | ----------------------------------------------------------------------------------------- |
| **What it shows**    | `WPM: 85` or `Speed: 92 wpm`                                                              |
| **Data source**      | Polybar `info-hackspeed` (counts keypresses per interval)                                 |
| **Performance cost** | Requires background daemon monitoring keystrokes                                          |
| **Windows compat**   | Poor. Keystroke monitoring requires elevated privileges or specific tools on Windows.     |
| **Existing tools**   | Polybar `info-hackspeed` (Linux only)                                                     |
| **Claude invocable** | No. Would need a background daemon.                                                       |
| **Practical value**  | **Very Low**. Novelty metric. Not actionable. Privacy concerns with keystroke monitoring. |

---

## 3. Cross-Reference: What Existing Tools Ship

### 3.1 ccstatusline (sirmalloc/ccstatusline) — Complete Widget List

**Dev widgets (already cataloged in SQ-001):**

- Model Name, Session Name, Session Duration, Session Cost
- Token Count, Input Speed, Output Speed, Total Speed
- Session Usage, Weekly Usage, Context Percentage, Context Bar
- Block Reset Timer, Block Timer
- Git Branch, Git Status, Git Insertions, Git Deletions, Git Worktree, Git Root
  Dir
- Current Working Directory, Memory Usage, Vim Mode, Thinking Effort, Skills

**Non-dev widgets:** **NONE** dedicated. The `Custom Command` and `Custom Text`
widgets serve as the extension point for all non-dev use cases.

**Custom Command widget details:**

- Executes any shell command, displays stdout
- Refreshes on each Claude Code statusline update (after each assistant message)
- Configurable timeout (kills long-running commands)
- Can receive Claude Code's JSON via stdin (pipe-through)
- Supports chaining with other statusline formatters

**Assessment:** ccstatusline is dev-focused by design. Non-dev widgets require
the user to write shell scripts and use Custom Command. This is both a strength
(infinite flexibility) and a weakness (high effort for common widgets).

### 3.2 tmux — Non-Dev Status Bar Plugins (30+)

| Plugin                 | What It Shows             | Stars |
| ---------------------- | ------------------------- | ----- |
| tmux-battery           | Battery % + icon          | 500+  |
| tmux-cpu               | CPU % + icon              | 400+  |
| tmux-mem-cpu-load      | CPU, RAM, load            | 300+  |
| tmux-weather           | Weather via wttr.in       | 82    |
| tmux-clima             | Weather via OpenWeather   | —     |
| tmux-weather-info-yr   | Weather via yr.no         | —     |
| tmux-online-status     | Online/offline indicator  | 200+  |
| tmux-net-speed         | Upload/download speed     | 200+  |
| tmux-ping              | Latency to host           | —     |
| tmux-packet-loss       | Packet loss %             | —     |
| tmux-ip-address        | Public IP display         | —     |
| tmux-now-playing       | Current track + controls  | —     |
| tmux-spotify-tui       | Spotify track display     | —     |
| tmux-spotify-info      | Spotify track (Linux)     | 15    |
| tmux-spotify-playlists | Spotify playlists         | 25    |
| tmux-pomodoro          | Basic Pomodoro timer      | —     |
| tmux-pomodoro-plus     | Enhanced Pomodoro         | 200+  |
| tmux-ticker            | Stock/market prices       | —     |
| tmux-maildir-counter   | Maildir file count        | —     |
| tmux-newsboat          | RSS reader counters       | —     |
| tmux-mullvad           | Mullvad VPN status        | —     |
| tmux-piavpn            | PIA VPN status            | —     |
| tmux-xdrip             | Glucose level tracking    | —     |
| tmux-uptime            | System uptime             | —     |
| tmux-df                | Disk space usage          | —     |
| tmux-acpi              | Thermal/battery/adapter   | —     |
| tmux-keyboard-layout   | Keyboard layout indicator | —     |

### 3.3 Polybar — Community Scripts (80+)

Categories with non-dev scripts:

| Category       | Scripts | Examples                                                                   |
| -------------- | ------- | -------------------------------------------------------------------------- |
| Weather        | 3       | openweathermap-fullfeatured, -simple, -detailed                            |
| Email          | 3       | inbox-imap-shellnetrc, inbox-imap-pythongpg, DanaruDev/UnseenMail          |
| Media/Music    | 3       | player-mpris-tail, player-mpris-simple, player-cmus                        |
| Spotify        | 4+      | polybar-spotify (3 variants), spotify-module                               |
| System/Battery | 5+      | battery-combined-udev, cpu-temppercore, bluetooth, usb-udev                |
| Network/VPN    | 6+      | publicip, localip, ipinfo.io, openvpn, wireguard, anyconnect               |
| Finance        | 2       | ticker-crypto, air-quality-index                                           |
| Productivity   | 4       | info-projecthamster, info-taskspooler, info-todotxt, info-hackspeed        |
| Notifications  | 4       | notification-reddit, notification-chess, notification-spacex, dunst-snooze |
| Privacy        | 2       | info-camera-mic, system-eprivacy                                           |
| Misc           | 5+      | info-timezone, info-trash, info-redshift-temp, info-healthchecks.io        |

### 3.4 Waybar — Built-in Modules (35+)

Non-dev built-in modules:

| Module         | Category | What It Shows                |
| -------------- | -------- | ---------------------------- |
| clock          | Time     | Time/date with timezone      |
| battery        | System   | Charge level + status        |
| cpu            | System   | Processor usage %            |
| memory         | System   | RAM consumption              |
| disk           | System   | Storage usage                |
| temperature    | System   | Thermal sensors              |
| network        | Network  | WiFi/Ethernet status + speed |
| bluetooth      | Network  | BT device connections        |
| backlight      | Hardware | Screen brightness            |
| pulseaudio     | Media    | Volume + audio device        |
| mpris          | Media    | Music player info            |
| mpd            | Media    | Music Player Daemon          |
| keyboard-state | Input    | Caps/Num/Scroll lock         |
| language       | Input    | Keyboard layout              |
| upower         | System   | Power management             |
| idle-inhibitor | System   | Sleep prevention             |
| privacy        | Privacy  | Camera/mic activity          |
| gamemode       | Gaming   | Gaming mode status           |
| tray           | System   | System tray apps             |
| custom         | Any      | Script output (any data)     |
| cava           | Media    | Audio visualizer             |

### 3.5 i3pystatus — Modules (40+)

Non-dev modules:

| Module                    | What It Shows                        |
| ------------------------- | ------------------------------------ |
| battery                   | Battery status/charge                |
| clock                     | Time display                         |
| cpu_usage                 | CPU % (also bar, graph variants)     |
| disk                      | Disk usage                           |
| load                      | System load averages                 |
| mem / mem_bar             | Memory usage                         |
| network / network_traffic | Network status/speed                 |
| temp                      | Temperature sensors                  |
| uptime                    | System uptime                        |
| weather                   | Weather (weather.com via pywapi)     |
| spotify                   | Spotify track (via playerctl)        |
| now_playing               | Generic media player info            |
| cmus                      | cmus player integration              |
| mpd                       | MPD integration                      |
| mail                      | Email (IMAP/Maildir backends)        |
| pomodoro                  | Pomodoro timer (click to start/stop) |
| reddit                    | Reddit notifications                 |
| bitcoin                   | Bitcoin price                        |
| calendar                  | Calendar display                     |
| parcel                    | Package tracking                     |
| pulseaudio / alsa         | Audio volume                         |
| backlight                 | Screen brightness                    |
| keyboard_locks            | Caps/Num lock state                  |

### 3.6 Starship — Built-in Modules (Prompt, Not Status Bar)

Starship is a prompt customizer, not a status bar, but relevant modules:

| Module       | What It Shows         |
| ------------ | --------------------- |
| time         | Current time          |
| battery      | Battery level + state |
| memory_usage | RAM usage             |
| hostname     | Machine name          |
| username     | Current user          |
| os           | Operating system icon |
| custom       | Any command output    |

Starship lacks non-dev widgets by design (it's a prompt, not a dashboard).

---

## 4. The User's Unique Position: MCP Integrations

The user has two MCP integrations that no standard statusline tool leverages:

### Google Calendar MCP

- **Tool:** `gcal_list_events`
- **Capability:** Query upcoming events with full detail
- **Statusline value:** Next event countdown, meeting alerts
- **Limitation:** MCP tools are only available during Claude Code sessions, not
  from arbitrary shell scripts. A statusline script cannot call MCP directly.
- **Workaround:** Claude writes a cache file during conversation. Background
  script (Task Scheduler) calls gcalcli or Google Calendar API independently.

### Gmail MCP

- **Tool:** `gmail_search_messages` with `q: "is:unread"`
- **Capability:** Query unread count, recent senders
- **Statusline value:** Unread email count
- **Limitation:** Same as Calendar — MCP not available from shell scripts.
- **Workaround:** Same cache pattern, or use a lightweight Gmail API script.

**Architecture for MCP-backed widgets:**

```
[Task Scheduler: every 5 min]
  └─> Python/Node script
      └─> Google Calendar API → ~/.cache/next-event.txt
      └─> Gmail API → ~/.cache/gmail-unread.txt

[ccstatusline Custom Command]
  └─> reads ~/.cache/next-event.txt
  └─> reads ~/.cache/gmail-unread.txt
  └─> formats for statusline output
```

This decouples the data-fetching (slow, authenticated) from the display (fast,
file read). The statusline never blocks on API calls.

---

## 5. Practical Value Ranking

Ranked by actual usefulness for a solo developer who lives in Claude Code on
Windows 11 all day:

| Rank | Widget                        | Value       | Why                                                              |
| ---- | ----------------------------- | ----------- | ---------------------------------------------------------------- |
| 1    | **Next Calendar Event**       | HIGH        | Prevents missed meetings. User has MCP.                          |
| 2    | **Meeting Alert (imminent)**  | HIGH        | Escalation of #1 when <10 min away.                              |
| 3    | **Session Duration**          | HIGH        | Already in ccstatusline. Drives break decisions.                 |
| 4    | **Break Reminder / Pomodoro** | MEDIUM-HIGH | Ergonomic health. Pairs with #3.                                 |
| 5    | **Unread Email Count**        | MEDIUM      | Triage signal. User has Gmail MCP.                               |
| 6    | **Clock + Timezone**          | MEDIUM      | Useful in full-screen terminal. Dual-zone for cross-locale work. |
| 7    | **Battery Level**             | MEDIUM      | Laptop only. Auto-hide on desktop.                               |
| 8    | **Weather**                   | LOW-MEDIUM  | Mildly useful. Cached, low cost.                                 |
| 9    | **CPU/Memory**                | MEDIUM      | ccstatusline has Memory. CPU adds marginal value.                |
| 10   | **VPN Status**                | LOW-MEDIUM  | Useful if work requires VPN. Binary indicator.                   |
| 11   | **Disk Space**                | LOW         | Only matters when nearly full. Threshold alert only.             |
| 12   | **Now Playing (Spotify)**     | LOW         | Aesthetic only. Not actionable.                                  |
| 13   | **Network Online/Offline**    | LOW         | Only useful on unreliable connections.                           |
| 14   | **Motivational Quotes**       | VERY LOW    | Wallpaper effect.                                                |
| 15   | **Typing Speed**              | VERY LOW    | Novelty. Privacy concern.                                        |
| 16   | **System Uptime**             | VERY LOW    | Not actionable.                                                  |

---

## 6. Windows 11 Compatibility Matrix

| Widget         | Method                      | Approx. Latency | Notes                        |
| -------------- | --------------------------- | --------------- | ---------------------------- |
| Clock          | `date` (Git Bash)           | <1ms            | Native                       |
| Calendar Event | File cache read             | <5ms            | Needs background fetcher     |
| Pomodoro       | File read + math            | <2ms            | Pure shell/node              |
| Email Count    | File cache read             | <5ms            | Needs background fetcher     |
| Battery        | PowerShell CIM              | 150-300ms       | Only on laptops. **Slow.**   |
| Battery (fast) | Node.js `systeminformation` | ~50ms           | npm package, faster          |
| CPU/Memory     | Node.js `os` module         | ~10ms           | Fast, cross-platform         |
| CPU/Memory     | PowerShell                  | 200-400ms       | **Too slow** for statusline  |
| Weather        | File cache read             | <5ms            | Background curl to wttr.in   |
| Disk           | `df -h` (Git Bash)          | 30-50ms         | Acceptable                   |
| Network        | PowerShell                  | 200-400ms       | **Slow.** Cache recommended. |
| Spotify        | Spotify Web API             | 300-800ms       | Needs OAuth. Cache.          |
| VPN            | `ipconfig` / `netsh`        | 100-200ms       | Borderline acceptable        |

**Key insight:** On Windows, anything requiring PowerShell is 150-400ms due to
the runtime startup cost. For statusline use, prefer:

1. Git Bash built-ins (`date`, `cat`, file reads) — <5ms
2. Node.js one-liners (since Node is already running for ccstatusline) — 10-50ms
3. Cached files from background scripts — <5ms reads
4. Avoid: direct PowerShell invocations in the hot path

---

## 7. Recommended Non-Dev Widget Set for SoNash Statusline

Based on practical value, Windows compatibility, and the user's existing MCP
integrations, here is the recommended non-dev widget set:

### Tier 1: Implement First (High value, low effort)

1. **Clock with dual timezone** — `date` command, <1ms
2. **Session duration** — Already in ccstatusline, just enable
3. **Next calendar event with countdown** — Cache-based, needs background
   fetcher script

### Tier 2: Implement Second (High value, moderate effort)

4. **Meeting imminent alert** — Extension of #3 with color change at threshold
5. **Break reminder** — Simple timer state file, <2ms
6. **Unread email count** — Cache-based, same pattern as calendar

### Tier 3: Nice to Have (Lower value or higher effort)

7. **Weather** — Cached wttr.in, trivial but low value
8. **Battery** — Node.js `systeminformation`, auto-hide on desktop
9. **VPN status** — Cached network check

### Not Recommended

- Spotify/Now Playing — Aesthetic only, high implementation cost on Windows
- Typing speed — Privacy concern, Windows keystroke monitoring is complex
- Motivational quotes — Wallpaper effect
- System uptime — Not actionable
- Generic notification count — Too vague

---

## 8. Implementation Sketch: Background Data Fetcher

For cache-dependent widgets (calendar, email, weather), a single background
script can populate all cache files:

```bash
#!/bin/bash
# ~/.claude/statusline-data-fetcher.sh
# Run via Windows Task Scheduler every 5 minutes

CACHE_DIR="$HOME/.cache/statusline"
mkdir -p "$CACHE_DIR"

# Weather (every 30 min — check file age)
weather_file="$CACHE_DIR/weather.txt"
if [ ! -f "$weather_file" ] || [ $(( $(date +%s) - $(stat -c %Y "$weather_file" 2>/dev/null || echo 0) )) -gt 1800 ]; then
  curl -s "wttr.in/?format=%t+%C" > "$weather_file" 2>/dev/null
fi

# Calendar next event (every 5 min)
# Requires gcalcli or custom Google Calendar API script
if command -v gcalcli &>/dev/null; then
  gcalcli agenda --nocolor --tsv "$(date +%Y-%m-%dT%H:%M:%S)" "$(date -d '+8 hours' +%Y-%m-%dT%H:%M:%S)" 2>/dev/null | head -1 > "$CACHE_DIR/next-event.txt"
fi

# Gmail unread count (every 10 min)
# Requires authenticated Gmail API access
# Placeholder — actual implementation depends on auth method
```

**Windows Task Scheduler setup:**

```
schtasks /create /tn "StatuslineDataFetch" /tr "bash -c '~/.claude/statusline-data-fetcher.sh'" /sc minute /mo 5
```

---

## 9. Sources

### Primary Tool Repositories

- [sirmalloc/ccstatusline](https://github.com/sirmalloc/ccstatusline) — Claude
  Code statusline tool
- [tmux-plugins/list](https://github.com/tmux-plugins/list) — Official tmux
  plugin registry
- [rothgar/awesome-tmux](https://github.com/rothgar/awesome-tmux) — Curated tmux
  resource list
- [polybar/polybar-scripts](https://github.com/polybar/polybar-scripts) —
  Community polybar scripts
- [Alexays/Waybar](https://github.com/Alexays/Waybar) — Waybar compositor bar
- [enkore/i3pystatus](https://github.com/enkore/i3pystatus) — i3 status
  replacement
- [starship/starship](https://github.com/starship/starship) — Cross-shell prompt

### Specific Plugins Referenced

- [tmux-plugins/tmux-battery](https://github.com/tmux-plugins/tmux-battery) —
  Battery indicator
- [olimorris/tmux-pomodoro-plus](https://github.com/olimorris/tmux-pomodoro-plus)
  — Pomodoro timer
- [erikw/tmux-powerline](https://github.com/erikw/tmux-powerline) — Status bar
  segments
- [insanum/gcalcli](https://github.com/insanum/gcalcli) — Google Calendar CLI
- [chubin/wttr.in](https://github.com/chubin/wttr.in) — Terminal weather service
- [ayoisaiah/focus](https://github.com/ayoisaiah/focus) — CLI Pomodoro timer

### Additional Tools

- [chongdashu/cc-statusline](https://github.com/chongdashu/cc-statusline) —
  Alternative Claude Code statusline
- [Haleclipse/CCometixLine](https://github.com/Haleclipse/CCometixLine) —
  Rust-based Claude Code statusline
- [race604/clock-tui](https://github.com/race604/clock-tui) — Terminal clock
- [octobanana/peaclock](https://github.com/octobanana/peaclock) — Terminal
  clock/timer

### Documentation

- [Waybar wiki](https://github.com/Alexays/Waybar/wiki) — Module documentation
- [i3status manual](https://i3wm.org/docs/i3status.html) — i3status module
  reference
- [i3pystatus module reference](https://i3pystatus.readthedocs.io/en/latest/i3pystatus.html)
  — Full module docs
- [Starship configuration](https://starship.rs/config/) — Module configuration
- [wttr.in help](https://wttr.in/:help) — Weather API format options
