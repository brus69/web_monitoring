package main

import (
	"html"
	"regexp"
	"strings"
)

var (
	// Многострочный <title>, атрибуты на теге допускаются.
	titleRegex = regexp.MustCompile(`(?is)<title[^>]*>([\s\S]*?)</title>`)

	// Fallback, если <title> пустой/отсутствует (часть SPA/редиректов).
	ogTitlePatterns = []*regexp.Regexp{
		regexp.MustCompile(`(?is)<meta\b[^>]*\bproperty\s*=\s*og:title\b[^>]*\bcontent\s*=\s*"([^"]*)"`),
		regexp.MustCompile(`(?is)<meta\b[^>]*\bcontent\s*=\s*"([^"]*)"[^>]*\bproperty\s*=\s*og:title\b`),
		regexp.MustCompile(`(?is)<meta\b[^>]*\bproperty\s*=\s*"og:title"[^>]*\bcontent\s*=\s*"([^"]*)"`),
		regexp.MustCompile(`(?is)<meta\b[^>]*\bname\s*=\s*twitter:title\b[^>]*\bcontent\s*=\s*"([^"]*)"`),
	}

	// Сначала варианты без кавычек у name/property (HTML5 minify: name=description).
	metaDescriptionPatterns = []*regexp.Regexp{
		regexp.MustCompile(`(?is)<meta\b[^>]*\bname\s*=\s*description\b[^>]*\bcontent\s*=\s*"([^"]*)"`),
		regexp.MustCompile(`(?is)<meta\b[^>]*\bname\s*=\s*description\b[^>]*\bcontent\s*=\s*'([^']*)'`),
		regexp.MustCompile(`(?is)<meta\b[^>]*\bcontent\s*=\s*"([^"]*)"[^>]*\bname\s*=\s*description\b`),
		regexp.MustCompile(`(?is)<meta\b[^>]*\bcontent\s*=\s*'([^']*)'[^>]*\bname\s*=\s*description\b`),
		regexp.MustCompile(`(?is)<meta\b[^>]*\bproperty\s*=\s*og:description\b[^>]*\bcontent\s*=\s*"([^"]*)"`),
		regexp.MustCompile(`(?is)<meta\b[^>]*\bcontent\s*=\s*"([^"]*)"[^>]*\bproperty\s*=\s*og:description\b`),
		regexp.MustCompile(`(?is)<meta\b[^>]*\bproperty\s*=\s*og:description\b[^>]*\bcontent\s*=\s*'([^']*)'`),
		// С кавычками вокруг name / property
		regexp.MustCompile(`(?is)<meta\b[^>]*\bname\s*=\s*"description"[^>]*\bcontent\s*=\s*"([^"]*)"`),
		regexp.MustCompile(`(?is)<meta\b[^>]*\bname\s*=\s*'description'[^>]*\bcontent\s*=\s*'([^']*)'`),
		regexp.MustCompile(`(?is)<meta\b[^>]*\bcontent\s*=\s*"([^"]*)"[^>]*\bname\s*=\s*"description"`),
		regexp.MustCompile(`(?is)<meta\b[^>]*\bcontent\s*=\s*'([^']*)'[^>]*\bname\s*=\s*'description'`),
		regexp.MustCompile(`(?is)<meta\b[^>]*\bproperty\s*=\s*"og:description"[^>]*\bcontent\s*=\s*"([^"]*)"`),
		regexp.MustCompile(`(?is)<meta\b[^>]*\bproperty\s*=\s*'og:description'[^>]*\bcontent\s*=\s*'([^']*)'`),
		regexp.MustCompile(`(?is)<meta\b[^>]*\bcontent\s*=\s*"([^"]*)"[^>]*\bproperty\s*=\s*"og:description"`),
		regexp.MustCompile(`(?is)<meta\b[^>]*\bname\s*=\s*"twitter:description"[^>]*\bcontent\s*=\s*"([^"]*)"`),
	}

	h1Regex     = regexp.MustCompile(`(?i)<h1[^>]*>([\s\S]*?)</h1>`)
	scriptRegex = regexp.MustCompile(`(?i)<script[^>]*>[\s\S]*?</script>`)
	styleRegex  = regexp.MustCompile(`(?i)<style[^>]*>[\s\S]*?</style>`)
	tagRegex    = regexp.MustCompile(`<[^>]+>`)
)

func firstCapture(re *regexp.Regexp, s string) string {
	m := re.FindStringSubmatch(s)
	if len(m) < 2 {
		return ""
	}
	return strings.TrimSpace(html.UnescapeString(m[1]))
}

func normalizeTitleInner(t string) string {
	t = tagRegex.ReplaceAllString(t, " ")
	return strings.TrimSpace(strings.Join(strings.Fields(t), " "))
}

func extractTitle(htmlBody string) string {
	t := firstCapture(titleRegex, htmlBody)
	t = normalizeTitleInner(t)
	if t != "" {
		return t
	}
	for _, re := range ogTitlePatterns {
		if x := firstCapture(re, htmlBody); x != "" {
			return normalizeTitleInner(x)
		}
	}
	return ""
}

func extractMetaDescription(htmlBody string) string {
	for _, re := range metaDescriptionPatterns {
		if d := firstCapture(re, htmlBody); d != "" {
			return d
		}
	}
	return ""
}

func extractH1(htmlBody string) string {
	if m := h1Regex.FindStringSubmatch(htmlBody); len(m) > 1 {
		inner := tagRegex.ReplaceAllString(m[1], " ")
		inner = html.UnescapeString(inner)
		return strings.TrimSpace(strings.Join(strings.Fields(inner), " "))
	}
	return ""
}

func plainTextFromHTML(htmlBody string) string {
	working := scriptRegex.ReplaceAllString(htmlBody, " ")
	working = styleRegex.ReplaceAllString(working, " ")
	working = tagRegex.ReplaceAllString(working, " ")
	working = html.UnescapeString(working)
	return strings.Join(strings.Fields(working), " ")
}

// ExtractContent вытаскивает title (тег <title>), meta description (в т.ч. og/twitter),
// первый <h1> и обычный текст страницы без разметки.
func ExtractContent(htmlBody string) (title, description, h1, text string) {
	title = extractTitle(htmlBody)
	description = extractMetaDescription(htmlBody)
	h1 = extractH1(htmlBody)
	text = plainTextFromHTML(htmlBody)
	return
}
