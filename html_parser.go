package main

import (
	"regexp"
	"strings"
)

var (
	titleRegex    = regexp.MustCompile(`(?i)<title>(.*?)</title>`)
	metaDescRegex = regexp.MustCompile(`(?i)<meta\s+name=["']description["']\s+content=["'](.*?)["']`)
	scriptRegex   = regexp.MustCompile(`(?i)<script[^>]*>.*?</script>`)
	styleRegex    = regexp.MustCompile(`(?i)<style[^>]*>.*?</style>`)
	tagRegex      = regexp.MustCompile(`<[^>]+>`)
)

func ExtractContent(htmlBody string) (title, description, text string) {
	working := htmlBody

	// Remove script and style tags
	working = scriptRegex.ReplaceAllString(working, " ")
	working = styleRegex.ReplaceAllString(working, " ")

	// Extract title
	if m := titleRegex.FindStringSubmatch(htmlBody); len(m) > 1 {
		title = strings.TrimSpace(m[1])
	}

	// Extract description
	if m := metaDescRegex.FindStringSubmatch(htmlBody); len(m) > 1 {
		description = strings.TrimSpace(m[1])
	}

	// Extract text: remove tags and collapse whitespace
	working = tagRegex.ReplaceAllString(working, " ")
	working = strings.Join(strings.Fields(working), " ")
	text = working

	return
}
