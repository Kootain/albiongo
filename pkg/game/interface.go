package game

type IGame interface {
	Player() IPlayerManager
}

type Game struct {
	playerManager IPlayerManager
}

func NewGame(playerManager IPlayerManager) IGame {
	return &Game{
		playerManager: playerManager,
	}
}

func (g *Game) Player() IPlayerManager {
	return g.playerManager
}

type ISpellManager interface {
	GetSpellByID(id int) (*Spell, error)
}
