package data

import "embed"

//go:embed items.json spells.json
var Assets embed.FS
