package main

import "testing"

func TestExtractContent_titleMultiline(t *testing.T) {
	html := `<head>
<title>Line1
Line2</title></head><body>x</body>`
	title, _, _, _ := ExtractContent(html)
	if title != "Line1 Line2" {
		t.Fatalf("title: got %q want %q", title, "Line1 Line2")
	}
}

func TestExtractContent_metaDescriptionOrders(t *testing.T) {
	cases := []struct {
		html string
		want string
	}{
		{`<meta name="description" content="A &amp; B">`, "A & B"},
		{`<meta content="Second order" name="description">`, "Second order"},
		{`<meta property="og:description" content="OG desc">`, "OG desc"},
		{`<meta content="OG rev" property="og:description">`, "OG rev"},
		{`<meta name='description' content='Single quotes'>`, "Single quotes"},
	}
	for i, tc := range cases {
		_, d, _, _ := ExtractContent(tc.html)
		if d != tc.want {
			t.Fatalf("[%d] description: got %q want %q", i, d, tc.want)
		}
	}
}

func TestExtractContent_titleEntities(t *testing.T) {
	html := `<title>Test &mdash; Site</title>`
	title, _, _, _ := ExtractContent(html)
	want := "Test \u2014 Site" // &mdash; → em dash
	if title != want {
		t.Fatalf("title: got %q want %q", title, want)
	}
}

// Hugo/minify: name=description без кавычек; многострочный <title>.
func TestExtractContent_minifiedMetaLikeP9x(t *testing.T) {
	html := `<!doctype html><head><meta charset=utf-8>` +
		`<title>10 лучших SEO-инструментов с искусственным интеллектом в 2025 году
| P9X</title>` +
		`<meta name=description content="Краткое описание статьи про SEO и ИИ.">` +
		`</head><body></body>`
	title, desc, _, _ := ExtractContent(html)
	wantTitle := "10 лучших SEO-инструментов с искусственным интеллектом в 2025 году | P9X"
	if title != wantTitle {
		t.Fatalf("title: got %q want %q", title, wantTitle)
	}
	if desc != "Краткое описание статьи про SEO и ИИ." {
		t.Fatalf("description: got %q", desc)
	}
}
