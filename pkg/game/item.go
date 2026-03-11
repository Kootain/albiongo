package game

import (
	"strconv"
	"strings"
)

type Item struct {
	Index       int
	UniqueName  string
	Name        Localization
	Description Localization
	Tier        int
	Enchant     int
	NameID      string
}

func (i *Item) init() {
	if strings.HasPrefix(i.UniqueName, "T") {
		tier, _ := strconv.Atoi(i.UniqueName[1:2])
		tmp := strings.Split(i.UniqueName, "_")
		// slot := tmp[1]
		name := strings.Join(tmp[1:], "_")

		tmp = strings.Split(name, "@")
		if len(tmp) > 1 {
			i.Enchant, _ = strconv.Atoi(tmp[1])
			name = tmp[0]
		}
		i.NameID = name
		i.Tier = tier
	}
}

type nameHandler func(string) string

var nameHandlers = map[Lang]nameHandler{
	LangZHCN: func(in string) string {
		tokens := strings.Split(in, "级")
		if len(tokens) > 1 {
			return strings.Join(tokens[1:], "")
		}
		return in
	},
}

func NewItem(index int, uniqueName string, name Localization, description Localization) *Item {
	if name != nil {
		for lang, handler := range nameHandlers {
			name[lang] = handler(name[lang])
		}
	}
	// TODO replace desc placeholder
	i := &Item{
		Index:       index,
		UniqueName:  uniqueName,
		Name:        name,
		Description: description,
	}
	i.init()
	return i
}

type EquipmentSlot int

//go:generate stringer -type=EquipmentSlot
const (
	EquipmentSlot_MainHand EquipmentSlot = iota
	EquipmentSlot_OffHand
	EquipmentSlot_Head
	EquipmentSlot_Chest
	EquipmentSlot_Shoes
	EquipmentSlot_Bag
	EquipmentSlot_Cape
	EquipmentSlot_Mount
	EquipmentSlot_Potion
	EquipmentSlot_Food
)

var spellIndex = map[EquipmentSlot][]int{
	EquipmentSlot_MainHand: {0, 1, 2},
	EquipmentSlot_Chest:    {3},
	EquipmentSlot_Head:     {4},
	EquipmentSlot_Shoes:    {5},
	EquipmentSlot_Potion:   {12},
	EquipmentSlot_Food:     {13},
}
