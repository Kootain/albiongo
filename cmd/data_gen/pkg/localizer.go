package pkg

import (
	"albiongo/pkg/game"
	"encoding/xml"
	"io"
	"os"
	"sync"

	"github.com/sirupsen/logrus"
)

type ILocalizer interface {
	Translation(tag string) game.Localization
}

type Localizer struct {
	mu           sync.RWMutex
	translations map[string]game.Localization
}

func NewLocalizer() *Localizer {
	return &Localizer{
		translations: make(map[string]game.Localization),
	}
}

type tmx struct {
	Body body `xml:"body"`
}

type body struct {
	Tus []tu `xml:"tu"`
}

type tu struct {
	Tuid string `xml:"tuid,attr"`
	Tuvs []tuv  `xml:"tuv"`
}

type tuv struct {
	Lang string `xml:"lang,attr"`
	Seg  string `xml:"seg"`
}

func (l *Localizer) LoadFromFile(filepath string) error {
	r, err := os.OpenFile(filepath, os.O_RDONLY, 0644)
	if err != nil {
		logrus.Fatalf("open file failed: %v", err)
	}
	defer r.Close()
	decoder := xml.NewDecoder(r)

	// TMX format is large, so we stream it instead of loading all at once into struct
	// But since the structure is nested (tu -> tuv), we can iterate over <tu> elements

	count := 0
	for {
		t, err := decoder.Token()
		if err == io.EOF {
			break
		}
		if err != nil {
			return err
		}

		switch se := t.(type) {
		case xml.StartElement:
			if se.Name.Local == "tu" {
				var unit tu
				if err := decoder.DecodeElement(&unit, &se); err != nil {
					return err
				}

				if unit.Tuid != "" {
					l.mu.Lock()
					if _, ok := l.translations[unit.Tuid]; !ok {
						l.translations[unit.Tuid] = make(map[game.Lang]string)
					}
					for _, v := range unit.Tuvs {
						l.translations[unit.Tuid][game.Lang(v.Lang)] = v.Seg
					}
					l.mu.Unlock()
					count++
				}
			}
		}
	}

	logrus.Infof("Loaded %d localization units", count)
	return nil
}

func (l *Localizer) Translation(tag string) game.Localization {
	l.mu.RLock()
	defer l.mu.RUnlock()

	if unit, ok := l.translations[tag]; ok {
		return unit
	}
	return nil
}

func (l *Localizer) GetLocalization(tag string) game.Localization {
	l.mu.RLock()
	defer l.mu.RUnlock()

	if unit, ok := l.translations[tag]; ok {
		// Return a copy of the map
		loc := make(game.Localization)
		for k, v := range unit {
			loc[k] = v
		}
		return loc
	}
	return nil
}
