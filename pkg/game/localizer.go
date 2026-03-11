package game

import (
	"encoding/json"
	"os"
)

type Localizer interface {
	Translation(tag string) string
}

type LocalizerImpl struct {
	lang         string
	translations map[string]map[string]string
}

type fileData struct {
	Tuid string      `json:"@tuid"`
	Tuv  interface{} `json:"tuv"`
}

func (l *LocalizerImpl) LoadFromFile(filePath string) error {
	var tmps []fileData
	if f, err := os.ReadFile(filePath); err != nil {
		return err
	} else {
		if err = json.Unmarshal(f, &tmps); err != nil {
			return err
		}
	}
	l.translations = make(map[string]map[string]string)
	for _, v := range tmps {
		l.translations[v.Tuid] = make(map[string]string)
		if tuv, ok := v.Tuv.([]interface{}); ok {
			for _, tuv := range tuv {
				if tuv, ok := tuv.(map[string]interface{}); ok {
					if lang, ok := tuv["@xml:lang"].(string); ok {
						if value, ok := tuv["seg"].(string); ok {
							l.translations[v.Tuid][lang] = value
						}
					}
				}
			}
		}
		if tuv, ok := v.Tuv.(map[string]interface{}); ok {
			if lang, ok := tuv["@xml:lang"].(string); ok {
				if value, ok := tuv["seg"].(string); ok {
					l.translations[v.Tuid][lang] = value
				}
			}
		}
	}
	return nil
}

func (l *LocalizerImpl) Translation(tag string) string {
	if v, ok := l.translations[tag]; ok {
		if v, ok := v[l.lang]; ok {
			return v
		}
	}
	return ""
}

func NewLocalizer(lang string) Localizer {
	l := &LocalizerImpl{lang: lang}
	if err := l.LoadFromFile("./data/merged_localization.json"); err != nil {
		panic(err)
	}
	return l
}
