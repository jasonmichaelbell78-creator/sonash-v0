package main

import (
	"fmt"
	"os"
	"strings"
)

// renderLines assembles all 22 widgets into the 3-line statusline output.
// Each line is written separately with flush, prefixed with ANSI reset,
// and spaces replaced with non-breaking spaces (per ccstatusline pattern).
func renderLines(w *AllWidgets, cfg *Config) string {
	sep := " " + cfg.General.Separator + " "

	// Line 1: Identity & Workspace
	line1Parts := []WidgetResult{w.A1, w.B1, w.B3, w.B2, w.A4, w.A6, w.E1}
	line1 := joinWidgets(line1Parts, sep)

	// Line 2: Health & Metrics
	line2Parts := []WidgetResult{w.D1, w.D5, w.H2, w.H3, w.C8, w.C1}
	line2 := joinWidgets(line2Parts, sep)
	rateCluster := colorize(w.C5) + " " + colorize(w.C7)
	line2 = line2 + sep + rateCluster + sep + colorize(w.C6)

	// Line 3: Lifestyle & Session
	weatherCluster := colorize(w.F6) + " " + colorize(w.F7)
	line3Rest := []WidgetResult{w.F4, w.A3, w.F15, w.I4}
	line3 := weatherCluster + sep + joinWidgets(line3Rest, sep)

	lines := []string{line1, line2, line3}
	for _, line := range lines {
		out := prepareLine(line)
		fmt.Fprintln(os.Stdout, out)
		os.Stdout.Sync()
	}

	// Return empty — output already written directly
	return ""
}

// prepareLine applies the ccstatusline output pattern:
// 1. Prefix with ANSI reset to override Claude Code's default dim
// 2. Replace spaces with non-breaking spaces to prevent terminal trimming
func prepareLine(line string) string {
	// Replace regular spaces with non-breaking spaces (U+00A0)
	// but preserve ANSI escape sequences
	line = strings.ReplaceAll(line, " ", "\u00a0")
	// Prefix with ANSI reset
	return "\x1b[0m" + line
}

// colorize wraps widget text in its ANSI color and resets.
func colorize(w WidgetResult) string {
	if w.Text == "" {
		return ""
	}
	if w.Color == "" {
		return w.Text
	}
	return w.Color + w.Text + colorReset
}

// joinWidgets joins non-empty widget results with a separator.
func joinWidgets(widgets []WidgetResult, sep string) string {
	parts := make([]string, 0, len(widgets))
	for _, w := range widgets {
		colored := colorize(w)
		if colored != "" {
			parts = append(parts, colored)
		}
	}
	return strings.Join(parts, sep)
}
