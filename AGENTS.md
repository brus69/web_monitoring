# AGENTS.md

## Project
Go CLI tool for website change monitoring.

## Build
```bash
go build -o webmon .
```

## Run
```bash
./webmon --file urls.txt --interval 14400 --concurrency 10
```

Flags:
- `--file` - input file (.csv, .txt, sitemap.xml)
- `--interval` - check interval in seconds (default 14400)
- `--concurrency` - max concurrent requests (default 10)
- `--state` - state file path (default state.json)

## Architecture
Flat structure, stdlib only:
- `main.go` - CLI flags, main loop, check runner
- `parser.go` - input file parsing (TXT/CSV/XML)
- `fetcher.go` - HTTP requests with 30s timeout
- `comparator.go` - SHA-256 hashing for change detection
- `storage.go` - JSON state load/save
- `types.go` - PageState and State structs

State stored in `state.json`. Program runs in infinite loop, prints summary after each cycle.
