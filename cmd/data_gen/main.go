package main

import (
	"albiongo/cmd/data_gen/pkg"

	"github.com/sirupsen/logrus"
)

func main() {
	spell := pkg.SpellManager{}
	spell.LoadFromFile("./data/spells.xml")

	localizer := pkg.NewLocalizer()
	localizer.LoadFromFile("./data/localization.xml")
	spell.InitLocalizer(localizer)

	item := &pkg.ItemManager{}
	item.LoadFromFile("./data/indexedItems.json")

	item.JsonDumpToFile("./data/items.json")

	if err := spell.JsonDumpToFile("./data/spells.json"); err != nil {
		logrus.Fatalf("[MetaData][Spell] dump error: %v", err)
	}
	if err := item.JsonDumpToFile("./data/items.json"); err != nil {
		logrus.Fatalf("[MetaData][Item] dump error: %v", err)
	}
}
