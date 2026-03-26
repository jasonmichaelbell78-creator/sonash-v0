package main

import (
	"encoding/json"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
)

// RateLimitBucket holds usage and reset info for a single rate-limit window.
type RateLimitBucket struct {
	UsedPercentage *float64        `json:"used_percentage"`
	ResetsAt       json.RawMessage `json:"resets_at"`
}

// StdinData matches Claude Code's statusline JSON schema.
type StdinData struct {
	Model struct {
		ID          string `json:"id"`
		DisplayName string `json:"display_name"`
	} `json:"model"`
	SessionID string `json:"session_id"`
	Workspace struct {
		CurrentDir string `json:"current_dir"`
		ProjectDir string `json:"project_dir"`
	} `json:"workspace"`
	ContextWindow struct {
		UsedPercentage      *float64 `json:"used_percentage"`
		RemainingPercentage *float64 `json:"remaining_percentage"`
		ContextWindowSize   int      `json:"context_window_size"`
	} `json:"context_window"`
	Cost struct {
		TotalCostUSD      float64 `json:"total_cost_usd"`
		TotalDurationMs   int64   `json:"total_duration_ms"`
		TotalLinesAdded   int     `json:"total_lines_added"`
		TotalLinesRemoved int     `json:"total_lines_removed"`
	} `json:"cost"`
	RateLimits struct {
		FiveHour RateLimitBucket `json:"five_hour"`
		SevenDay RateLimitBucket `json:"seven_day"`
	} `json:"rate_limits"`
	Agent struct {
		Name string `json:"name"`
	} `json:"agent"`
	Worktree struct {
		Name   string `json:"name"`
		Branch string `json:"branch"`
	} `json:"worktree"`
	OutputStyle struct {
		Name string `json:"name"`
	} `json:"output_style"`
	Vim struct {
		Mode string `json:"mode"`
	} `json:"vim"`
}

func main() {
	// Set Windows UTF-8 code page for proper Unicode output
	if runtime.GOOS == "windows" {
		cmd := exec.Command("chcp.com", "65001")
		cmd.Stdout = nil
		cmd.Stderr = nil
		cmd.Run()
	}

	// Determine config directory (same directory as source config.toml)
	exe, err := os.Executable()
	configDir := "."
	if err == nil {
		configDir = filepath.Dir(exe)
	}
	// If running from source dir (go run), use working directory
	if _, err := os.Stat(filepath.Join(configDir, "config.toml")); err != nil {
		if wd, wdErr := os.Getwd(); wdErr == nil {
			if _, err := os.Stat(filepath.Join(wd, "config.toml")); err == nil {
				configDir = wd
			}
		}
	}

	cfg := loadConfig(configDir)

	// Read stdin
	input, err := io.ReadAll(os.Stdin)
	if err != nil {
		return // silent fail
	}

	var data StdinData
	if err := json.Unmarshal(input, &data); err != nil {
		return // silent fail on bad JSON
	}

	// Build widgets
	widgets := buildAllWidgets(&data, &cfg)

	// Render output (writes directly to stdout per-line with flush)
	renderLines(widgets, &cfg)

	// Refresh API-backed caches synchronously after render
	// (goroutine approach failed — process exits before goroutine completes)
	refreshCacheIfStale(&cfg)
}
