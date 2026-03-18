package game

type Player struct {
	Name         string
	GuildName    string
	AllianceName string
	Equipments   []int
	Spells       []int
	UpdateTime   int64
}

type IPlayerManager interface {
	ListPlayer(*PlayerFilter) ([]*Player, error)
}

type PlayerFilter struct {
	Name         *string
	GuildName    *string
	AllianceName *string
}
