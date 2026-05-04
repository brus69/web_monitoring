package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var jwtKey = []byte("webmon_secret_key")
var monitorMu sync.Mutex
var monitorStops = make(map[string]chan struct{})

type Claims struct {
	Username string `json:"username"`
	jwt.RegisteredClaims
}

func generateToken(username string) (string, error) {
	claims := Claims{
		Username: username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtKey)
}

func authMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Missing auth header", http.StatusUnauthorized)
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		claims := &Claims{}

		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return jwtKey, nil
		})

		if err != nil || !token.Valid {
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}

		next(w, r)
	}
}

func handleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if req.Username != "admin" || req.Password != "admin2" {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	token, err := generateToken(req.Username)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(LoginResponse{Token: token})
}

func handleGetProjects(w http.ResponseWriter, r *http.Request) {
	state, err := LoadProjectState()
	if err != nil {
		http.Error(w, "Failed to load projects", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(state.Projects)
}

func handleCreateProject(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var project Project
	if err := json.NewDecoder(r.Body).Decode(&project); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	project.ID = fmt.Sprintf("%d", time.Now().UnixNano())
	project.Paused = false
	project.CreatedAt = time.Now()
	project.UpdatedAt = time.Now()

	state, _ := LoadProjectState()
	state.Projects = append(state.Projects, project)
	SaveProjectState(state)

	startProjectMonitoring(project)

	json.NewEncoder(w).Encode(project)
}

func handleUpdateProject(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	id := strings.TrimPrefix(r.URL.Path, "/api/projects/")

	var project Project
	if err := json.NewDecoder(r.Body).Decode(&project); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	state, _ := LoadProjectState()
	for i, p := range state.Projects {
		if p.ID == id {
			project.ID = id
			project.Paused = p.Paused
			project.UpdatedAt = time.Now()
			state.Projects[i] = project
			SaveProjectState(state)
			if !project.Paused {
				stopProjectMonitoring(id)
				startProjectMonitoring(project)
			}
			json.NewEncoder(w).Encode(project)
			return
		}
	}

	http.Error(w, "Project not found", http.StatusNotFound)
}

func handleDeleteProject(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	id := strings.TrimPrefix(r.URL.Path, "/api/projects/")

	state, _ := LoadProjectState()
	newProjects := []Project{}
	for _, p := range state.Projects {
		if p.ID != id {
			newProjects = append(newProjects, p)
		}
	}
	state.Projects = newProjects
	delete(state.Results, id)
	SaveProjectState(state)
	stopProjectMonitoring(id)

	w.WriteHeader(http.StatusNoContent)
}

func handleStartProject(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	id := strings.TrimPrefix(r.URL.Path, "/api/projects/")
	id = strings.TrimSuffix(id, "/start")

	state, _ := LoadProjectState()
	for i := range state.Projects {
		if state.Projects[i].ID != id {
			continue
		}
		state.Projects[i].Paused = false
		state.Projects[i].UpdatedAt = time.Now()
		project := state.Projects[i]
		SaveProjectState(state)
		startProjectMonitoring(project)
		json.NewEncoder(w).Encode(project)
		return
	}

	http.Error(w, "Project not found", http.StatusNotFound)
}

func handleStopProject(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	id := strings.TrimPrefix(r.URL.Path, "/api/projects/")
	id = strings.TrimSuffix(id, "/stop")

	state, _ := LoadProjectState()
	for i := range state.Projects {
		if state.Projects[i].ID != id {
			continue
		}
		state.Projects[i].Paused = true
		state.Projects[i].UpdatedAt = time.Now()
		project := state.Projects[i]
		SaveProjectState(state)
		stopProjectMonitoring(id)
		json.NewEncoder(w).Encode(project)
		return
	}

	http.Error(w, "Project not found", http.StatusNotFound)
}

func handleGetResults(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/api/projects/")
	id = strings.TrimSuffix(id, "/results")

	state, _ := LoadProjectState()
	if results, ok := state.Results[id]; ok {
		json.NewEncoder(w).Encode(results)
		return
	}

	json.NewEncoder(w).Encode(State{Pages: []PageState{}})
}

func handleParseSitemap(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		URL string `json:"url"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if req.URL == "" {
		http.Error(w, "URL is required", http.StatusBadRequest)
		return
	}

	urls, err := parseSitemapFromURL(req.URL)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to parse sitemap: %v", err), http.StatusBadRequest)
		return
	}

	json.NewEncoder(w).Encode(map[string][]string{"urls": urls})
}

func runProjectCheck(project Project, state *State, concurrency int) {
	runCheck(project.URLs, state, concurrency)
}

func startProjectMonitoring(project Project) bool {
	if project.Paused {
		return false
	}
	monitorMu.Lock()
	if _, exists := monitorStops[project.ID]; exists {
		monitorMu.Unlock()
		return false
	}
	stopCh := make(chan struct{})
	monitorStops[project.ID] = stopCh
	monitorMu.Unlock()

	go func() {
		defer func() {
			monitorMu.Lock()
			delete(monitorStops, project.ID)
			monitorMu.Unlock()
		}()

		interval := time.Duration(project.Interval) * time.Minute
		ticker := time.NewTicker(interval)
		defer ticker.Stop()

		for {
			loadedState, _ := LoadProjectState()
			results := loadedState.Results[project.ID]
			if results == nil {
				results = &State{Pages: []PageState{}}
			}
			concurrency := project.Concurrency
			if concurrency <= 0 {
				concurrency = 10 // default
			}
			runProjectCheck(project, results, concurrency)
			// Важно: сохраняем результаты в "свежем" state, чтобы не перетирать
			// изменения по проектам (например, paused=true после остановки).
			latestState, _ := LoadProjectState()
			latestState.Results[project.ID] = results
			SaveProjectState(latestState)
			select {
			case <-ticker.C:
			case <-stopCh:
				return
			}
		}
	}()

	return true
}

func stopProjectMonitoring(projectID string) bool {
	monitorMu.Lock()
	stopCh, exists := monitorStops[projectID]
	if exists {
		delete(monitorStops, projectID)
	}
	monitorMu.Unlock()

	if exists {
		close(stopCh)
	}
	return exists
}

func startAPIServer() {
	state, _ := LoadProjectState()
	for _, project := range state.Projects {
		if !project.Paused {
			startProjectMonitoring(project)
		}
	}

	http.HandleFunc("/api/login", handleLogin)
	http.HandleFunc("/api/projects", authMiddleware(handleGetProjects))
	http.HandleFunc("/api/projects/create", authMiddleware(handleCreateProject))
	http.HandleFunc("/api/parse-sitemap", authMiddleware(handleParseSitemap))
	http.HandleFunc("/api/projects/", authMiddleware(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/results") {
			handleGetResults(w, r)
		} else if strings.HasSuffix(r.URL.Path, "/start") {
			handleStartProject(w, r)
		} else if strings.HasSuffix(r.URL.Path, "/stop") {
			handleStopProject(w, r)
		} else {
			switch r.Method {
			case http.MethodPut:
				handleUpdateProject(w, r)
			case http.MethodDelete:
				handleDeleteProject(w, r)
			default:
				http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			}
		}
	}))

	fs := http.FileServer(http.Dir("frontend/build"))
	http.Handle("/", fs)

	log.Println("Server starting on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
