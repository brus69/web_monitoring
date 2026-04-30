package main

import (
	"encoding/csv"
	"encoding/xml"
	"os"
	"strings"
)

func ParseInputFile(filename string) ([]string, error) {
	if strings.HasSuffix(filename, ".csv") {
		return parseCSV(filename)
	}
	if strings.HasSuffix(filename, ".xml") {
		return parseSitemap(filename)
	}
	return parseTXT(filename)
}

func parseTXT(filename string) ([]string, error) {
	data, err := os.ReadFile(filename)
	if err != nil {
		return nil, err
	}
	lines := strings.Split(string(data), "\n")
	urls := []string{}
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line != "" {
			urls = append(urls, line)
		}
	}
	return urls, nil
}

func parseCSV(filename string) ([]string, error) {
	file, err := os.Open(filename)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	reader := csv.NewReader(file)
	records, err := reader.ReadAll()
	if err != nil {
		return nil, err
	}

	urls := []string{}
	for i, rec := range records {
		if i == 0 && isHeader(rec[0]) {
			continue
		}
		if len(rec) > 0 && rec[0] != "" {
			urls = append(urls, rec[0])
		}
	}
	return urls, nil
}

func isHeader(firstCol string) bool {
	return strings.Contains(firstCol, "url") || strings.Contains(firstCol, "URL")
}

func parseSitemap(filename string) ([]string, error) {
	data, err := os.ReadFile(filename)
	if err != nil {
		return nil, err
	}

	var sitemap struct {
		URLs []struct {
			Loc string `xml:"loc"`
		} `xml:"url"`
	}

	if err := xml.Unmarshal(data, &sitemap); err != nil {
		return nil, err
	}

	urls := []string{}
	for _, u := range sitemap.URLs {
		if u.Loc != "" {
			urls = append(urls, u.Loc)
		}
	}
	return urls, nil
}
