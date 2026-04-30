package main

import (
	"crypto/sha256"
	"fmt"
	"strings"
)

func ComputeHash(content []byte) string {
	h := sha256.Sum256(content)
	return fmt.Sprintf("%x", h)
}

func IsChanged(oldHash string, newContent []byte) bool {
	return oldHash != ComputeHash(newContent)
}

// ANSI colors
const (
	ColorReset    = "\033[0m"
	ColorGreen    = "\033[32m"
	ColorRed      = "\033[31m"
	Strikethrough = "\033[9m"
)

// GenerateDiff сравнивает два текста и возвращает строку с подсветкой изменений
// Зеленый - добавлено, Красный + зачеркнутый - удалено
func GenerateDiff(oldText, newText string) string {
	oldWords := strings.Fields(oldText)
	newWords := strings.Fields(newText)

	var result []string
	lenOld := len(oldWords)
	lenNew := len(newWords)

	i, j := 0, 0
	for i < lenOld || j < lenNew {
		if i < lenOld && j < lenNew && oldWords[i] == newWords[j] {
			result = append(result, oldWords[i])
			i++
			j++
		} else {
			// Ищем удаленные (красные)
			found := false
			if i < lenOld {
				// Проверяем, появится ли это слово позже в новом тексте
				for k := j; k < lenNew; k++ {
					if oldWords[i] == newWords[k] {
						found = true
						break
					}
				}
			}
			if !found && i < lenOld {
				result = append(result, fmt.Sprintf("%s%s%s%s", ColorRed, Strikethrough, oldWords[i], ColorReset))
				i++
				continue
			}

			// Ищем добавленные (зеленые)
			if j < lenNew {
				foundOld := false
				for k := i; k < lenOld; k++ {
					if newWords[j] == oldWords[k] {
						foundOld = true
						break
					}
				}
				if !foundOld {
					result = append(result, fmt.Sprintf("%s%s%s", ColorGreen, newWords[j], ColorReset))
					j++
					continue
				}
			}

			// Если ничего не подошло, просто двигаемся
			if i < lenOld {
				i++
			}
			if j < lenNew {
				j++
			}
		}
	}

	return strings.Join(result, " ")
}
