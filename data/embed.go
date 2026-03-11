package data

import "embed"

//go:embed items.json spells.json weapon_types.json
var Assets embed.FS
