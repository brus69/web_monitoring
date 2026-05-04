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

type Project struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	URLs         []string  `json:"urls"`
	TrackTitle   bool      `json:"track_title"`
	TrackDesc    bool      `json:"track_desc"`
	TrackContent bool      `json:"track_content"`
	Interval     int       `json:"interval"` // в минутах
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
