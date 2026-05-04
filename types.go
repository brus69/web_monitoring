package main

import "time"

type PageState struct {
	URL         string         `json:"url"`
	ContentHash string         `json:"content_hash,omitempty"`
	LastChecked time.Time      `json:"last_checked"`
	Status      string         `json:"status"`
	StatusCode  int            `json:"status_code"`
	Title       string         `json:"title,omitempty"`
	Description string         `json:"description,omitempty"`
	H1          string         `json:"h1,omitempty"`
	TextContent string         `json:"text_content,omitempty"`
	Changes     []ChangeRecord `json:"changes,omitempty"`
}

type ChangeRecord struct {
	Timestamp time.Time `json:"timestamp"`
	Field     string    `json:"field"` // "title", "description", "h1", "text"
	OldValue  string    `json:"old_value"`
	NewValue  string    `json:"new_value"`
	Diff      string    `json:"diff"` // HTML-форматированный дифф
}

type State struct {
	Pages []PageState `json:"pages"`
}

type Project struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	URLs         []string  `json:"urls"`
	TrackTitle   bool      `json:"track_title"`
	TrackDesc    bool      `json:"track_desc"`
	TrackContent bool      `json:"track_content"`
	Paused       bool      `json:"paused"`      // true = мониторинг остановлен
	Interval     int       `json:"interval"`    // в минутах
	Concurrency  int       `json:"concurrency"` // максимум потоков
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type ProjectState struct {
	Projects []Project         `json:"projects"`
	Results  map[string]*State `json:"results"` // projectID -> State
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string `json:"token"`
}
