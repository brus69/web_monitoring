package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"time"
)

func main() {
	mode := flag.String("mode", "cli", "Mode: cli or server")
	file := flag.String("file", "", "Input file (.csv, .txt, sitemap.xml)")
	interval := flag.Int("interval", 14400, "Check interval in seconds")
	concurrency := flag.Int("concurrency", 10, "Max concurrent requests")
	stateFile := flag.String("state", "state.json", "State file path")
	flag.Parse()

	if *mode == "server" {
		startAPIServer()
		return
	}

	if *file == "" {
		fmt.Println("Usage: webmon --file urls.txt --interval 4 --concurrency 10")
		fmt.Println("Or: webmon --mode server (for API server)")
		os.Exit(1)
	}

	urls, err := ParseInputFile(*file)
	if err != nil {
		log.Fatalf("Failed to parse input: %v", err)
	}
	fmt.Printf("Loaded %d URLs\n", len(urls))

	state, err := LoadState(*stateFile)
	if err != nil {
		log.Fatalf("Failed to load state: %v", err)
	}

	ticker := time.NewTicker(time.Duration(*interval) * time.Second)
	defer ticker.Stop()

	for {
		runCheck(urls, state, *concurrency)
		if err := SaveState(*stateFile, state); err != nil {
			log.Printf("Failed to save state: %v", err)
		}
		<-ticker.C
	}
}

func runCheck(urls []string, state *State, concurrency int) {
	sem := make(chan struct{}, concurrency)
	changed := 0
	unchanged := 0

	for _, url := range urls {
		sem <- struct{}{}
		go func(u string) {
			defer func() { <-sem }()

			statusCode, content, err := FetchURL(u)
			if err != nil {
				log.Printf("[%s] FETCH ERROR: %v", u, err)
				return
			}

			title, desc, textContent := ExtractContent(string(content))
			hash := ComputeHash(content)
			oldState := findPage(state, u)
			now := time.Now().Format("2006-01-02 15:04:05")
			status := "без изменений"

			if oldState == nil {
				status = "новая"
				changed++
				fmt.Printf("\n%s | %d | НОВАЯ СТРАНИЦА\n", now, statusCode)
				fmt.Printf("  Title: %s\n", title)
				fmt.Printf("  Desc: %s\n", desc)
				fmt.Printf("  Text: %s...\n", truncate(textContent, 100))
			} else {
				hasChanges := false

				if oldState.Title != title {
					hasChanges = true
					diff := GenerateDiff(oldState.Title, title)
					htmlDiff := GenerateHTMLDiff(oldState.Title, title)
					fmt.Printf("\n%s | %d | ИЗМЕНЕН ЗАГОЛОВОК\n", now, statusCode)
					fmt.Printf("  Old: %s\n", oldState.Title)
					fmt.Printf("  New: %s\n", title)
					fmt.Printf("  Diff: %s\n", diff)
					addChange(oldState, "title", oldState.Title, title, htmlDiff)
				}
				if oldState.Description != desc {
					hasChanges = true
					diff := GenerateDiff(oldState.Description, desc)
					htmlDiff := GenerateHTMLDiff(oldState.Description, desc)
					fmt.Printf("\n%s | %d | ИЗМЕНЕНО ОПИСАНИЕ\n", now, statusCode)
					fmt.Printf("  Old: %s\n", oldState.Description)
					fmt.Printf("  New: %s\n", desc)
					fmt.Printf("  Diff: %s\n", diff)
					addChange(oldState, "description", oldState.Description, desc, htmlDiff)
				}
				if oldState.TextContent != textContent {
					hasChanges = true
					diff := GenerateDiff(oldState.TextContent, textContent)
					htmlDiff := GenerateHTMLDiff(oldState.TextContent, textContent)
					fmt.Printf("\n%s | %d | ИЗМЕНЕН ТЕКСТ\n", now, statusCode)
					fmt.Printf("  Diff (first 200 chars): %s...\n", truncate(diff, 200))
					addChange(oldState, "text", oldState.TextContent, textContent, htmlDiff)
				}

				if hasChanges {
					status = "изменена"
					changed++
				} else {
					unchanged++
				}
			}

			updatePage(state, u, hash, status, title, desc, textContent)
		}(url)
	}

	for i := 0; i < concurrency; i++ {
		sem <- struct{}{}
	}

	fmt.Printf("\nПроверка завершена: %d изменено, %d без изменений\n", changed, unchanged)
}

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n]
}

func findPage(state *State, url string) *PageState {
	for i := range state.Pages {
		if state.Pages[i].URL == url {
			return &state.Pages[i]
		}
	}
	return nil
}

func updatePage(state *State, url, hash, status, title, description, textContent string) {
	for i := range state.Pages {
		if state.Pages[i].URL == url {
			state.Pages[i].ContentHash = hash
			state.Pages[i].LastChecked = time.Now()
			state.Pages[i].Status = status
			state.Pages[i].Title = title
			state.Pages[i].Description = description
			state.Pages[i].TextContent = textContent
			return
		}
	}
	state.Pages = append(state.Pages, PageState{
		URL:         url,
		ContentHash: hash,
		LastChecked: time.Now(),
		Status:      status,
		Title:       title,
		Description: description,
		TextContent: textContent,
	})
}

func addChange(page *PageState, field, oldVal, newVal, htmlDiff string) {
	record := ChangeRecord{
		Timestamp: time.Now(),
		Field:     field,
		OldValue:  oldVal,
		NewValue:  newVal,
		Diff:      htmlDiff,
	}
	page.Changes = append(page.Changes, record)
	// Храним только последние 50 изменений
	if len(page.Changes) > 50 {
		page.Changes = page.Changes[len(page.Changes)-50:]
	}
}
