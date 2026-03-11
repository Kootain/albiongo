package pkg

import (
	"albiongo/pkg/game"
	"encoding/json"
	"os"

	"github.com/sirupsen/logrus"
)

type jsonItem struct {
	Index                           int `json:"Index,string"`
	UniqueName                      string
	LocalizationNameVariable        string
	LocalizationDescriptionVariable string
	LocalizedNames                  game.Localization
	LocalizedDescriptions           game.Localization
}

type ItemManager struct {
	Items map[int]*game.Item `json:"Items"`
}

func (im *ItemManager) LoadFromFile(filepath string) {
	data, err := os.ReadFile(filepath)
	if err != nil {
		logrus.Errorf("Failed to read file %s: %v", filepath, err)
		return
	}
	var items []jsonItem
	err = json.Unmarshal(data, &items)
	if err != nil {
		logrus.Errorf("Failed to unmarshal file %s: %v", filepath, err)
		return
	}
	if im.Items == nil {
		im.Items = make(map[int]*game.Item)
	}
	for _, i := range items {
		im.Items[i.Index] = game.NewItem(i.Index, i.UniqueName, i.LocalizedNames, i.LocalizedDescriptions)
	}
}

func (im *ItemManager) JsonDumpToFile(filepath string) error {
	f, err := os.OpenFile(filepath, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0644)
	if err != nil {
		return err
	}
	defer f.Close()
	if err := json.NewEncoder(f).Encode(im.Items); err != nil {
		return err
	}
	return nil
}
