package main

import (
	"fmt"
	"io"
	"net/http"
	"time"
)

const (
	fetchTimeout = 30 * time.Second
	maxBodyBytes = 12 << 20 // защита от огромных ответов
)

// defaultUserAgent имитирует обычный браузер: без него часть сайтов отдаёт пустой HTML или редирект на капчу.
const defaultUserAgent = "Mozilla/5.0 (compatible; WebMon/1.0; +https://github.com/) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

func FetchURL(url string) (int, []byte, error) {
	client := &http.Client{Timeout: fetchTimeout}

	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return 0, nil, err
	}
	req.Header.Set("User-Agent", defaultUserAgent)
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
	req.Header.Set("Accept-Language", "ru-RU,ru;q=0.9,en;q=0.8")

	resp, err := client.Do(req)
	if err != nil {
		return 0, nil, err
	}
	defer resp.Body.Close()

	limited := io.LimitReader(resp.Body, maxBodyBytes+1)
	body, err := io.ReadAll(limited)
	if err != nil {
		return resp.StatusCode, nil, err
	}
	if len(body) > maxBodyBytes {
		return resp.StatusCode, nil, fmt.Errorf("response body exceeds %d bytes", maxBodyBytes)
	}

	return resp.StatusCode, body, nil
}
