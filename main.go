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
