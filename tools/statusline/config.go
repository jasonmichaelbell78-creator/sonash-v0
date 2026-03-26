package main

import (
	"os"
	"path/filepath"

	"github.com/BurntSushi/toml"
)

type Config struct {
	General      GeneralConfig      `toml:"general"`
	Weather      WeatherConfig      `toml:"weather"`
	Timezone     TimezoneConfig     `toml:"timezone"`
	Thresholds   ThresholdsConfig   `toml:"thresholds"`
	Cache        CacheConfig        `toml:"cache"`
	Placeholders PlaceholdersConfig `toml:"placeholders"`
	APIKeys      APIKeysConfig      `toml:"api_keys"`
	Paths        PathsConfig        `toml:"paths"`
}

type GeneralConfig struct {
	Separator string `toml:"separator"`
	Lines     int    `toml:"lines"`
	ColorMode string `toml:"color_mode"`
}

type WeatherConfig struct {
	Location       string `toml:"location"`
	Units          string `toml:"units"`
	CacheTTLMinutes int   `toml:"cache_ttl_minutes"`
}

type TimezoneConfig struct {
	Zone   string `toml:"zone"`
	Format string `toml:"format"`
}

type ThresholdsConfig struct {
	ContextYellow    int `toml:"context_yellow"`
	ContextOrange    int `toml:"context_orange"`
	ContextRed       int `toml:"context_red"`
	RateLimitWarning  int `toml:"rate_limit_warning"`
	RateLimitCritical int `toml:"rate_limit_critical"`
}

type CacheConfig struct {
	FetchIntervalMinutes int   `toml:"fetch_interval_minutes"`
	RetryBackoff         []int `toml:"retry_backoff"`
	StaleIndicator       string `toml:"stale_indicator"`
}

type PlaceholdersConfig struct {
	Worktree    string `toml:"worktree"`
	Agent       string `toml:"agent"`
	Task        string `toml:"task"`
	PR          string `toml:"pr"`
	CI          string `toml:"ci"`
	Unavailable string `toml:"unavailable"`
}

type APIKeysConfig struct {
	WeatherAPIKey string `toml:"weather_api_key"`
}

type PathsConfig struct {
	BinaryDir string `toml:"binary_dir"`
}

func defaultConfig() Config {
	return Config{
		General: GeneralConfig{
			Separator: "│",
			Lines:     3,
			ColorMode: "16",
		},
		Weather: WeatherConfig{
			Location:       "Nashville,TN,US",
			Units:          "imperial",
			CacheTTLMinutes: 5,
		},
		Timezone: TimezoneConfig{
			Zone:   "America/Chicago",
			Format: "15:04 CST",
		},
		Thresholds: ThresholdsConfig{
			ContextYellow:    50,
			ContextOrange:    65,
			ContextRed:       80,
			RateLimitWarning:  70,
			RateLimitCritical: 90,
		},
		Cache: CacheConfig{
			FetchIntervalMinutes: 5,
			RetryBackoff:         []int{1, 2, 5, 10},
			StaleIndicator:       "?",
		},
		Placeholders: PlaceholdersConfig{
			Worktree:    "wt:none",
			Agent:       "agent:none",
			Task:        "task:none",
			PR:          "PR:none",
			CI:          "CI:none",
			Unavailable: "...",
		},
	}
}

// loadConfig reads config.toml from the binary's directory, then merges
// config.local.toml on top if it exists.
func loadConfig(dir string) Config {
	cfg := defaultConfig()

	shared := filepath.Join(dir, "config.toml")
	if _, err := os.Stat(shared); err == nil {
		toml.DecodeFile(shared, &cfg)
	}

	local := filepath.Join(dir, "config.local.toml")
	if _, err := os.Stat(local); err == nil {
		toml.DecodeFile(local, &cfg)
	}

	return cfg
}
