package game

type Spell struct {
	Index              int
	UniqueName         string
	Target             string
	Category           string
	NameLocatag        string
	DescriptionLocatag string
	Name               Localization
	Description        Localization
}
