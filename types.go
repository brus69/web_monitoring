package main

import "time"

type PageState struct {
	URL         string    `json:"url"`
	ContentHash string    `json:"content_hash,omitempty"`
	LastChecked time.Time `json:"last_checked"`
	Status      string    `json:"status"`
	Title       string    `json:"title,omitempty"`
	Description string    `json:"description,omitempty"`
	TextContent string    `json:"text_content,omitempty"`
}

type State struct {
	Pages []PageState `json:"pages"`
}
