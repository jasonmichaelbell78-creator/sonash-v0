package main

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"time"
)

// WeatherCache represents cached weather data.
type WeatherCache struct {
	Temp      float64 `json:"temp"`
	Condition string  `json:"condition"`
	High      float64 `json:"high"`
	Low       float64 `json:"low"`
	FetchedAt string  `json:"fetched_at"`
}

// GitHubPRCache represents cached PR status.
type GitHubPRCache struct {
	Number  int    `json:"number"`
	Status  string `json:"status"`
	FetchedAt string `json:"fetched_at"`
}

// GitHubCICache represents cached CI status.
type GitHubCICache struct {
	Status     string `json:"status"`
	Conclusion string `json:"conclusion"`
	FetchedAt  string `json:"fetched_at"`
}

// BackoffState tracks retry backoff per source.
type BackoffState struct {
	Weather  BackoffEntry `json:"weather"`
	GitHubPR BackoffEntry `json:"github_pr"`
	GitHubCI BackoffEntry `json:"github_ci"`
}

// BackoffEntry tracks failures and next retry time for one source.
type BackoffEntry struct {
	Failures    int    `json:"failures"`
	NextRetryAt string `json:"next_retry_at"`
}

func cacheDir() string {
	home, err := os.UserHomeDir()
	if err != nil {
		return ""
	}
	dir := filepath.Join(home, ".claude", "statusline", "cache")
	os.MkdirAll(dir, 0755)
	return dir
}

func readCacheFile(name string, v interface{}) error {
	dir := cacheDir()
	if dir == "" {
		return fmt.Errorf("no cache dir")
	}
	raw, err := os.ReadFile(filepath.Join(dir, name))
	if err != nil {
		return err
	}
	return json.Unmarshal(raw, v)
}

func writeCacheFile(name string, v interface{}) error {
	dir := cacheDir()
	if dir == "" {
		return fmt.Errorf("no cache dir")
	}
	raw, err := json.Marshal(v)
	if err != nil {
		return err
	}
	return os.WriteFile(filepath.Join(dir, name), raw, 0644)
}

func isCacheStale(fetchedAt string, ttlMinutes int) bool {
	if fetchedAt == "" {
		return true
	}
	t, err := time.Parse(time.RFC3339, fetchedAt)
	if err != nil {
		return true
	}
	return time.Since(t) > time.Duration(ttlMinutes)*time.Minute
}

func readBackoff() BackoffState {
	var state BackoffState
	readCacheFile("backoff.json", &state)
	return state
}

func writeBackoff(state BackoffState) {
	writeCacheFile("backoff.json", state)
}

func shouldRetry(entry BackoffEntry) bool {
	if entry.Failures == 0 {
		return true
	}
	if entry.NextRetryAt == "" {
		return true
	}
	t, err := time.Parse(time.RFC3339, entry.NextRetryAt)
	if err != nil {
		return true
	}
	return time.Now().After(t)
}

func recordFailure(entry *BackoffEntry, backoffMinutes []int) {
	entry.Failures++
	idx := entry.Failures - 1
	if idx >= len(backoffMinutes) {
		idx = len(backoffMinutes) - 1
	}
	wait := time.Duration(backoffMinutes[idx]) * time.Minute
	entry.NextRetryAt = time.Now().Add(wait).Format(time.RFC3339)
}

func recordSuccess(entry *BackoffEntry) {
	entry.Failures = 0
	entry.NextRetryAt = ""
}

// refreshCacheIfStale checks all API-backed caches and refreshes if stale.
// Called as a goroutine — the main process doesn't wait for this.
func refreshCacheIfStale(cfg *Config) {
	ttl := cfg.Cache.FetchIntervalMinutes
	backoff := readBackoff()

	// Weather
	var weather WeatherCache
	readCacheFile("weather.json", &weather)
	if isCacheStale(weather.FetchedAt, ttl) && shouldRetry(backoff.Weather) {
		if err := fetchWeather(cfg, &weather); err != nil {
			recordFailure(&backoff.Weather, cfg.Cache.RetryBackoff)
		} else {
			recordSuccess(&backoff.Weather)
			weather.FetchedAt = time.Now().Format(time.RFC3339)
			writeCacheFile("weather.json", weather)
		}
	}

	// GitHub PR
	var pr GitHubPRCache
	readCacheFile("github-pr.json", &pr)
	if isCacheStale(pr.FetchedAt, ttl) && shouldRetry(backoff.GitHubPR) {
		if err := fetchGitHubPR(&pr); err != nil {
			recordFailure(&backoff.GitHubPR, cfg.Cache.RetryBackoff)
		} else {
			recordSuccess(&backoff.GitHubPR)
			pr.FetchedAt = time.Now().Format(time.RFC3339)
			writeCacheFile("github-pr.json", pr)
		}
	}

	// GitHub CI
	var ci GitHubCICache
	readCacheFile("github-ci.json", &ci)
	if isCacheStale(ci.FetchedAt, ttl) && shouldRetry(backoff.GitHubCI) {
		if err := fetchGitHubCI(&ci); err != nil {
			recordFailure(&backoff.GitHubCI, cfg.Cache.RetryBackoff)
		} else {
			recordSuccess(&backoff.GitHubCI)
			ci.FetchedAt = time.Now().Format(time.RFC3339)
			writeCacheFile("github-ci.json", ci)
		}
	}

	writeBackoff(backoff)
}

// --- Fetch functions ---

func fetchWeather(cfg *Config, cache *WeatherCache) error {
	key := cfg.APIKeys.WeatherAPIKey
	if key == "" || key == "YOUR_OPENWEATHERMAP_API_KEY" {
		return fmt.Errorf("no weather API key configured")
	}
	url := fmt.Sprintf(
		"https://api.openweathermap.org/data/2.5/weather?q=%s&units=%s&appid=%s",
		cfg.Weather.Location, cfg.Weather.Units, key,
	)

	cmd := exec.Command("curl", "-sf", "--max-time", "5", url)
	out, err := cmd.Output()
	if err != nil {
		return err
	}

	var resp struct {
		Main struct {
			Temp    float64 `json:"temp"`
			TempMax float64 `json:"temp_max"`
			TempMin float64 `json:"temp_min"`
		} `json:"main"`
		Weather []struct {
			Main string `json:"main"`
			Icon string `json:"icon"`
		} `json:"weather"`
	}
	if err := json.Unmarshal(out, &resp); err != nil {
		return err
	}

	cache.Temp = resp.Main.Temp
	cache.High = resp.Main.TempMax
	cache.Low = resp.Main.TempMin
	if len(resp.Weather) > 0 {
		cache.Condition = weatherIcon(resp.Weather[0].Icon)
	}
	return nil
}

func fetchGitHubPR(cache *GitHubPRCache) error {
	cmd := exec.Command("gh", "pr", "view", "--json", "number,statusCheckRollup,state")
	cmd.Stderr = nil
	out, err := cmd.Output()
	if err != nil {
		return err
	}

	var resp struct {
		Number             int    `json:"number"`
		State              string `json:"state"`
		StatusCheckRollup  []struct {
			State      string `json:"state"`
			Conclusion string `json:"conclusion"`
		} `json:"statusCheckRollup"`
	}
	if err := json.Unmarshal(out, &resp); err != nil {
		return err
	}

	cache.Number = resp.Number
	cache.Status = "passing"
	for _, check := range resp.StatusCheckRollup {
		if check.Conclusion == "FAILURE" || check.State == "FAILURE" {
			cache.Status = "failing"
			break
		}
		if check.State == "PENDING" {
			cache.Status = "pending"
		}
	}
	return nil
}

func fetchGitHubCI(cache *GitHubCICache) error {
	cmd := exec.Command("gh", "run", "list", "--limit", "1", "--json", "status,conclusion")
	cmd.Stderr = nil
	out, err := cmd.Output()
	if err != nil {
		return err
	}

	var runs []struct {
		Status     string `json:"status"`
		Conclusion string `json:"conclusion"`
	}
	if err := json.Unmarshal(out, &runs); err != nil {
		return err
	}
	if len(runs) == 0 {
		return fmt.Errorf("no CI runs found")
	}

	cache.Status = runs[0].Status
	cache.Conclusion = runs[0].Conclusion
	return nil
}

// weatherIcon maps OpenWeatherMap icon codes to Unicode symbols.
func weatherIcon(icon string) string {
	switch {
	case icon == "01d":
		return "\u2600\ufe0f"  // sunny
	case icon == "01n":
		return "\U0001F319" // crescent moon
	case icon == "02d", icon == "02n":
		return "\u26c5" // partly cloudy
	case icon == "03d", icon == "03n", icon == "04d", icon == "04n":
		return "\u2601\ufe0f"  // cloudy
	case icon == "09d", icon == "09n":
		return "\U0001F327\ufe0f" // rain
	case icon == "10d", icon == "10n":
		return "\U0001F326\ufe0f" // sun behind rain
	case icon == "11d", icon == "11n":
		return "\u26c8\ufe0f"  // thunderstorm
	case icon == "13d", icon == "13n":
		return "\u2744\ufe0f"  // snow
	case icon == "50d", icon == "50n":
		return "\U0001F32B\ufe0f" // fog
	default:
		return "\u2601\ufe0f" // default: cloudy
	}
}

// --- API-backed widget functions ---

func widgetWeatherCurrent(cfg *Config) WidgetResult {
	var cache WeatherCache
	if err := readCacheFile("weather.json", &cache); err != nil {
		return WidgetResult{Text: "weather:" + cfg.Placeholders.Unavailable, Color: colorDim}
	}
	stale := ""
	if isCacheStale(cache.FetchedAt, cfg.Cache.FetchIntervalMinutes*2) {
		stale = cfg.Cache.StaleIndicator
	}
	text := fmt.Sprintf("%.0f\u00b0F %s%s", cache.Temp, cache.Condition, stale)
	return WidgetResult{Text: text, Color: colorDim}
}

func widgetWeatherForecast(cfg *Config) WidgetResult {
	var cache WeatherCache
	if err := readCacheFile("weather.json", &cache); err != nil {
		return WidgetResult{Text: "forecast:" + cfg.Placeholders.Unavailable, Color: colorDim}
	}
	stale := ""
	if isCacheStale(cache.FetchedAt, cfg.Cache.FetchIntervalMinutes*2) {
		stale = cfg.Cache.StaleIndicator
	}
	text := fmt.Sprintf("H:%.0f L:%.0f%s", cache.High, cache.Low, stale)
	return WidgetResult{Text: text, Color: colorDim}
}

func widgetGitHubPR(cfg *Config) WidgetResult {
	var cache GitHubPRCache
	if err := readCacheFile("github-pr.json", &cache); err != nil {
		return WidgetResult{Text: cfg.Placeholders.PR, Color: colorDim}
	}
	stale := ""
	if isCacheStale(cache.FetchedAt, cfg.Cache.FetchIntervalMinutes*2) {
		stale = cfg.Cache.StaleIndicator
	}
	icon := "\u2713"
	color := colorGreen
	switch cache.Status {
	case "failing":
		icon = "\u2717"
		color = colorRed
	case "pending":
		icon = "\u231b"
		color = colorYellow
	}
	text := fmt.Sprintf("PR#%d %s%s", cache.Number, icon, stale)
	return WidgetResult{Text: text, Color: color}
}

func widgetCIPipeline(cfg *Config) WidgetResult {
	var cache GitHubCICache
	if err := readCacheFile("github-ci.json", &cache); err != nil {
		return WidgetResult{Text: cfg.Placeholders.CI, Color: colorDim}
	}
	stale := ""
	if isCacheStale(cache.FetchedAt, cfg.Cache.FetchIntervalMinutes*2) {
		stale = cfg.Cache.StaleIndicator
	}
	icon := "\u2713"
	color := colorGreen
	switch {
	case cache.Conclusion == "failure":
		icon = "\u2717"
		color = colorRed
	case cache.Status == "in_progress" || cache.Status == "queued":
		icon = "\u231b"
		color = colorYellow
	}
	text := fmt.Sprintf("CI %s%s", icon, stale)
	return WidgetResult{Text: text, Color: color}
}
