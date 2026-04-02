package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

const testModelName = "Opus 4.6"

func TestDefaultConfig(t *testing.T) {
	cfg := defaultConfig()
	if cfg.General.Separator != "│" {
		t.Errorf("expected │ separator, got %s", cfg.General.Separator)
	}
	if cfg.General.Lines != 3 {
		t.Errorf("expected 3 lines, got %d", cfg.General.Lines)
	}
	if cfg.Thresholds.ContextYellow != 50 {
		t.Errorf("expected context_yellow=50, got %d", cfg.Thresholds.ContextYellow)
	}
}

func TestLoadConfig(t *testing.T) {
	dir := t.TempDir()

	// Write a shared config
	shared := `[general]
separator = "|"
lines = 2
`
	os.WriteFile(filepath.Join(dir, "config.toml"), []byte(shared), 0644)
	cfg := loadConfig(dir)
	if cfg.General.Separator != "|" {
		t.Errorf("expected | separator, got %s", cfg.General.Separator)
	}
	if cfg.General.Lines != 2 {
		t.Errorf("expected 2 lines, got %d", cfg.General.Lines)
	}
	// Defaults should still be in place for unset fields
	if cfg.Thresholds.ContextYellow != 50 {
		t.Errorf("expected default context_yellow=50, got %d", cfg.Thresholds.ContextYellow)
	}
}

func TestLoadConfigWithLocal(t *testing.T) {
	dir := t.TempDir()
	shared := `[weather]
location = "Nashville,TN,US"
`
	local := `[weather]
location = "Austin,TX,US"
`
	os.WriteFile(filepath.Join(dir, "config.toml"), []byte(shared), 0644)
	os.WriteFile(filepath.Join(dir, "config.local.toml"), []byte(local), 0644)
	cfg := loadConfig(dir)
	if cfg.Weather.Location != "Austin,TX,US" {
		t.Errorf("local override failed, got %s", cfg.Weather.Location)
	}
}

func TestStdinParsing(t *testing.T) {
	input := `{"model":{"display_name":"` + testModelName + `"},"session_id":"test-1","context_window":{"used_percentage":42}}`
	var data StdinData
	if err := json.Unmarshal([]byte(input), &data); err != nil {
		t.Fatalf("failed to parse stdin: %v", err)
	}
	if data.Model.DisplayName != testModelName {
		t.Errorf("expected Opus 4.6, got %s", data.Model.DisplayName)
	}
	if data.ContextWindow.UsedPercentage == nil || *data.ContextWindow.UsedPercentage != 42 {
		t.Error("expected used_percentage=42")
	}
}

func TestStdinPartialJSON(t *testing.T) {
	input := `{}`
	var data StdinData
	if err := json.Unmarshal([]byte(input), &data); err != nil {
		t.Fatalf("failed to parse empty JSON: %v", err)
	}
	if data.Model.DisplayName != "" {
		t.Error("expected empty display name")
	}
	if data.ContextWindow.UsedPercentage != nil {
		t.Error("expected nil used_percentage")
	}
}

func TestSanitize(t *testing.T) {
	tests := []struct {
		input    string
		maxLen   int
		expected string
	}{
		{"hello", 80, "hello"},
		{"a\x00b\x1fc", 80, "abc"},
		{"\x1b[31mred\x1b[0m", 80, "red"},
		{"long string here", 4, "long"},
		{"", 80, ""},
	}
	for _, tc := range tests {
		got := sanitize(tc.input, tc.maxLen)
		if got != tc.expected {
			t.Errorf("sanitize(%q, %d) = %q, want %q", tc.input, tc.maxLen, got, tc.expected)
		}
	}
}

func TestWidgetModelName(t *testing.T) {
	data := &StdinData{}
	w := widgetModelName(data)
	if w.Text != "Claude" {
		t.Errorf("expected default Claude, got %s", w.Text)
	}

	data.Model.DisplayName = testModelName
	w = widgetModelName(data)
	if w.Text != testModelName {
		t.Errorf("expected Opus 4.6, got %s", w.Text)
	}
}

func TestWidgetSessionDuration(t *testing.T) {
	tests := []struct {
		ms       int64
		expected string
	}{
		{0, "0m"},
		{60000, "1m"},
		{3600000, "1h0m"},
		{5400000, "1h30m"},
	}
	for _, tc := range tests {
		data := &StdinData{}
		data.Cost.TotalDurationMs = tc.ms
		w := widgetSessionDuration(data)
		if w.Text != tc.expected {
			t.Errorf("duration(%d) = %s, want %s", tc.ms, w.Text, tc.expected)
		}
	}
}

func TestWidgetContextGauge(t *testing.T) {
	cfg := defaultConfig()

	// Nil percentage
	data := &StdinData{}
	w := widgetContextGauge(data, &cfg)
	if w.Text != "..." {
		t.Errorf("expected placeholder, got %s", w.Text)
	}

	// 42% used
	pct := 42.0
	data.ContextWindow.UsedPercentage = &pct
	w = widgetContextGauge(data, &cfg)
	if !strings.Contains(w.Text, "42%") {
		t.Errorf("expected 42%% in text, got %s", w.Text)
	}
	if w.Color != colorGreen {
		t.Errorf("expected green at 42%%, got %s", w.Color)
	}

	// 55% used (yellow)
	pct = 55.0
	w = widgetContextGauge(data, &cfg)
	if w.Color != colorYellow {
		t.Errorf("expected yellow at 55%%, got %s", w.Color)
	}

	// 70% used (orange)
	pct = 70.0
	w = widgetContextGauge(data, &cfg)
	if w.Color != "\x1b[38;5;208m" {
		t.Errorf("expected orange at 70%%, got %s", w.Color)
	}

	// 85% used (blink red)
	pct = 85.0
	w = widgetContextGauge(data, &cfg)
	if w.Color != colorBlink {
		t.Errorf("expected blink red at 85%%, got %s", w.Color)
	}
}

func TestWidgetRateLimits(t *testing.T) {
	cfg := defaultConfig()

	// Nil
	data := &StdinData{}
	w := widgetRateLimit5hr(data, &cfg)
	if !strings.Contains(w.Text, "...") {
		t.Errorf("expected placeholder, got %s", w.Text)
	}

	// Normal
	pct := 42.0
	data.RateLimits.FiveHour.UsedPercentage = &pct
	w = widgetRateLimit5hr(data, &cfg)
	if w.Text != "5hr:42%" {
		t.Errorf("expected 5hr:42%%, got %s", w.Text)
	}
	if w.Color != colorGreen {
		t.Errorf("expected green, got %s", w.Color)
	}

	// Warning
	pct = 75.0
	w = widgetRateLimit5hr(data, &cfg)
	if w.Color != colorYellow {
		t.Errorf("expected yellow at 75%%, got %s", w.Color)
	}

	// Critical
	pct = 95.0
	w = widgetRateLimit5hr(data, &cfg)
	if w.Color != colorRed {
		t.Errorf("expected red at 95%%, got %s", w.Color)
	}
}

func TestWidgetLinesChanged(t *testing.T) {
	data := &StdinData{}
	data.Cost.TotalLinesAdded = 124
	data.Cost.TotalLinesRemoved = 38
	w := widgetLinesChanged(data)
	if w.Text != "+124 -38" {
		t.Errorf("expected +124 -38, got %s", w.Text)
	}
}

func TestWidgetPlaceholders(t *testing.T) {
	cfg := defaultConfig()
	data := &StdinData{}

	w := widgetWorktree(data, &cfg)
	if w.Text != "wt:none" {
		t.Errorf("expected wt:none, got %s", w.Text)
	}

	w = widgetActiveAgent(data, &cfg)
	if w.Text != "agent:none" {
		t.Errorf("expected agent:none, got %s", w.Text)
	}

	w = widgetCurrentTask(data, &cfg)
	if w.Text != "task:none" {
		t.Errorf("expected task:none, got %s", w.Text)
	}
}

func TestTailLastLine(t *testing.T) {
	dir := t.TempDir()
	f := filepath.Join(dir, "test.jsonl")

	// Empty file
	os.WriteFile(f, []byte(""), 0644)
	if got := tailLastLine(f); got != "" {
		t.Errorf("expected empty, got %s", got)
	}

	// Multiple lines
	os.WriteFile(f, []byte("{\"a\":1}\n{\"b\":2}\n{\"c\":3}\n"), 0644)
	if got := tailLastLine(f); got != `{"c":3}` {
		t.Errorf("expected last line, got %s", got)
	}

	// Missing file
	if got := tailLastLine(filepath.Join(dir, "nope.jsonl")); got != "" {
		t.Errorf("expected empty for missing file, got %s", got)
	}
}

func TestCountUnackedSince(t *testing.T) {
	dir := t.TempDir()
	logFile := filepath.Join(dir, "warnings.jsonl")
	ackFile := filepath.Join(dir, "ack.json")

	// 3 entries with millisecond timestamps: old, recent, recent
	lines := `{"timestamp":"2026-03-20T10:00:00.123Z"}
{"timestamp":"2026-03-25T10:00:00.456Z"}
{"timestamp":"2026-03-26T10:00:00.789Z"}
`
	if err := os.WriteFile(logFile, []byte(lines), 0644); err != nil {
		t.Fatalf("write logFile: %v", err)
	}

	// No ack file — all 3 should be unacked
	if got := countUnackedSince(logFile, ackFile); got != 3 {
		t.Errorf("no ack file: expected 3 unacked, got %d", got)
	}

	// Ack file with lastCleared (millis) between old and recent — only 2 after
	if err := os.WriteFile(ackFile, []byte(`{"lastCleared":"2026-03-24T00:00:00.000Z"}`), 0644); err != nil {
		t.Fatalf("write ackFile (partial): %v", err)
	}
	if got := countUnackedSince(logFile, ackFile); got != 2 {
		t.Errorf("partial ack: expected 2 unacked, got %d", got)
	}

	// Ack file with lastCleared after all — 0 unacked
	if err := os.WriteFile(ackFile, []byte(`{"lastCleared":"2026-03-27T00:00:00.000Z"}`), 0644); err != nil {
		t.Fatalf("write ackFile (full): %v", err)
	}
	if got := countUnackedSince(logFile, ackFile); got != 0 {
		t.Errorf("full ack: expected 0 unacked, got %d", got)
	}

	// Legacy format: acked field, no timestamp
	legacyLines := `{"acked":false}
{"acked":true}
{"acked":false}
`
	if err := os.WriteFile(logFile, []byte(legacyLines), 0644); err != nil {
		t.Fatalf("write logFile (legacy): %v", err)
	}
	os.Remove(ackFile) // clear ack
	if got := countUnackedSince(logFile, ackFile); got != 2 {
		t.Errorf("legacy format: expected 2 unacked, got %d", got)
	}

	// Malformed entries count as unacked
	malformedLines := `{"timestamp":"2026-03-25T10:00:00Z"}
not-json-at-all
{"timestamp":"2026-03-26T10:00:00Z"}
`
	if err := os.WriteFile(logFile, []byte(malformedLines), 0644); err != nil {
		t.Fatalf("write logFile (malformed): %v", err)
	}
	if got := countUnackedSince(logFile, ackFile); got != 3 {
		t.Errorf("malformed entries: expected 3 unacked, got %d", got)
	}

	// Resolved entries are excluded from unacked count
	resolvedLines := `{"timestamp":"2026-03-25T10:00:00Z"}
{"timestamp":"2026-03-25T11:00:00Z","resolved":true,"resolvedAt":"2026-03-26T00:00:00Z"}
{"timestamp":"2026-03-26T10:00:00Z"}
{"timestamp":"2026-03-26T11:00:00Z","resolved":true}
`
	if err := os.WriteFile(logFile, []byte(resolvedLines), 0644); err != nil {
		t.Fatalf("write logFile (resolved): %v", err)
	}
	os.Remove(ackFile) // clear ack — all non-resolved should count
	if got := countUnackedSince(logFile, ackFile); got != 2 {
		t.Errorf("resolved entries: expected 2 unacked, got %d", got)
	}
}

func TestPrepareLine(t *testing.T) {
	line := "\x1b[2mhello world\x1b[0m"
	out := prepareLine(line)

	// Should start with ANSI reset
	if !strings.HasPrefix(out, "\x1b[0m") {
		t.Error("expected ANSI reset prefix")
	}

	// Should have non-breaking spaces instead of regular spaces
	if strings.Contains(out, " ") {
		t.Error("regular spaces should be replaced with non-breaking spaces")
	}
	if !strings.Contains(out, "\u00a0") {
		t.Error("should contain non-breaking spaces")
	}
}

func TestJoinWidgets(t *testing.T) {
	widgets := []WidgetResult{
		{Text: testModelName, Color: colorDim},
		{Text: "main", Color: colorCyan},
		{Text: "", Color: ""},
		{Text: "sonash-v0", Color: colorDim},
	}
	sep := " │ "
	result := joinWidgets(widgets, sep)

	// Empty widget should be skipped
	if strings.Contains(result, "│ │") {
		t.Error("empty widgets should be skipped")
	}
	if !strings.Contains(result, testModelName) {
		t.Error("should contain model name")
	}
	if !strings.Contains(result, "sonash-v0") {
		t.Error("should contain project dir")
	}
}

func TestCacheStale(t *testing.T) {
	if !isCacheStale("", 5) {
		t.Error("empty fetchedAt should be stale")
	}
	if !isCacheStale("invalid", 5) {
		t.Error("invalid fetchedAt should be stale")
	}
	fresh := "2099-01-01T00:00:00Z"
	if isCacheStale(fresh, 5) {
		t.Error("future fetchedAt should not be stale")
	}
}
