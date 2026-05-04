package main

import (
	"encoding/json"
	"os"
)

func LoadState(path string) (*State, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return &State{Pages: []PageState{}}, nil
		}
		return nil, err
	}

	var state State
	if err := json.Unmarshal(data, &state); err != nil {
		return nil, err
	}
	return &state, nil
}

func SaveState(path string, state *State) error {
	data, err := json.MarshalIndent(state, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0644)
}

func LoadProjectState() (*ProjectState, error) {
	path := "projects.json"
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return &ProjectState{
				Projects: []Project{},
				Results:  make(map[string]*State),
			}, nil
		}
		return nil, err
	}

	var state ProjectState
	if err := json.Unmarshal(data, &state); err != nil {
		return nil, err
	}
	if state.Results == nil {
		state.Results = make(map[string]*State)
	}
	return &state, nil
}

func SaveProjectState(state *ProjectState) error {
	data, err := json.MarshalIndent(state, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile("projects.json", data, 0644)
}
