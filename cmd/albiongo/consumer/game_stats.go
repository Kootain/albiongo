package consumer

import (
	"albiongo/pkg/api"
	"albiongo/pkg/game"
	"albiongo/pkg/protocol"
	"albiongo/pkg/protocol/types"
	"context"
	"fmt"
	"reflect"
	"sync"
)

type GameStats struct {
	Players   *PlayerManager
	Broadcast api.IBroadcaster
	mu        sync.RWMutex
}

func (g *GameStats) Player() game.IPlayerManager {
	return g.Players
}

func (g *GameStats) SetBroadcaster(broadcaster api.IBroadcaster) {
	g.Broadcast = broadcaster
}

func NewGameStats(broadcaster api.IBroadcaster) *GameStats {
	return &GameStats{
		Players:   NewPlayerManager(),
		Broadcast: broadcaster,
	}
}

type PlayerManager struct {
	HostUsername string
	HostObjectId int
	userNameIdx  map[string]*game.Player
	userIdx      map[int]string
	mu           sync.RWMutex
}

func NewPlayerManager() *PlayerManager {
	return &PlayerManager{
		userNameIdx: make(map[string]*game.Player),
		userIdx:     make(map[int]string),
	}
}

func (pm *PlayerManager) changeHostIdx(objectID int) {
	pm.mu.Lock()
	defer pm.mu.Unlock()
	if pm.HostUsername == "" {
		return
	}
	pm.HostObjectId = objectID
	pm.userIdx[pm.HostObjectId] = pm.HostUsername
}

func (pm *PlayerManager) newHost(username string, objectID int, player *game.Player) {
	pm.mu.Lock()
	defer pm.mu.Unlock()
	pm.HostUsername = username
	pm.HostObjectId = objectID
	pm.userIdx[pm.HostObjectId] = pm.HostUsername
	pm.userNameIdx[pm.HostUsername] = player
}

func (pm *PlayerManager) getUserNameByID(objectID int) string {
	pm.mu.RLock()
	defer pm.mu.RUnlock()
	return pm.userIdx[objectID]
}

func (pm *PlayerManager) delIdx(objectID int) {
	pm.mu.Lock()
	defer pm.mu.Unlock()
	delete(pm.userIdx, objectID)
}

func (pm *PlayerManager) updatePlayer(idx int, play *game.Player) {
	pm.mu.Lock()
	defer pm.mu.Unlock()
	pm.userNameIdx[play.Name] = play
	pm.userIdx[idx] = play.Name
}

func (pm *PlayerManager) updatePlayerEquiments(idx int, equipments []int, spells []int) error {
	pm.mu.Lock()
	defer pm.mu.Unlock()
	username := pm.userIdx[idx]
	if username == "" {
		return fmt.Errorf("player %d not found", idx)
	}
	player := pm.userNameIdx[username]
	if player == nil {
		return fmt.Errorf("player %s idx: %d not found", username, idx)
	}
	player.Equipments = equipments
	player.Spells = spells
	return nil
}

func (pm *PlayerManager) ListPlayer(filter *game.PlayerFilter) ([]*game.Player, error) {
	pm.mu.RLock()
	defer pm.mu.RUnlock()
	players := make([]*game.Player, 0, len(pm.userNameIdx))
	for _, player := range pm.userNameIdx {
		if filter != nil {
			if filter.Name != nil && *filter.Name != player.Name {
				continue
			}
			if filter.GuildName != nil && *filter.GuildName != player.GuildName {
				continue
			}
			if filter.AllianceName != nil && *filter.AllianceName != player.AllianceName {
				continue
			}
		}
		players = append(players, player)
	}
	return players, nil
}

func (g *GameStats) PlayerNameComplete(e protocol.Command) {
	event, ok := e.(game.IPlayerNameAware)
	if !ok {
		return
	}
	name := g.Players.getUserNameByID(event.PlayerID())
	if name == "" {
		return
	}

	v := reflect.ValueOf(event)
	// If it's a pointer, get the underlying element
	if v.Kind() == reflect.Ptr {
		v = v.Elem()
	}

	if v.Kind() != reflect.Struct {
		return
	}

	// Find the first field of type game.PlayerName and set it
	var pName game.IPlayerName
	for i := 0; i < v.NumField(); i++ {
		field := v.Field(i)
		if field.Type() == reflect.TypeOf(pName) {
			if field.CanSet() {
				field.SetString(name)
			}
			break
		}
	}
}

func (g *GameStats) GameStatsConsumer(ctx context.Context, event protocol.Command) error {
	g.PlayerNameComplete(event)

	switch event := event.(type) {
	// case *types.EventRegenerationPlayerComboChanged:
	// g.Players.changeHostIdx(event.ObjectID)
	case *types.EventCharacterEquipmentChanged:
		if err := g.Players.updatePlayerEquiments(int(event.PlayerID()), event.EquipmentIDs, event.SpellIDs); err != nil {
			return err
		}
	case *types.EventNewCharacter:
		player := &game.Player{
			Name:         event.Name,
			GuildName:    event.GuildName,
			AllianceName: event.AllianceName,
			Equipments:   event.EquipmentIDs,
			Spells:       event.SpellIDs,
		}
		g.Players.updatePlayer(event.ObjectID, player)

	case *types.ResponseJoin:
		player := &game.Player{
			Name:         event.Name,
			GuildName:    event.GuildName,
			AllianceName: event.AllianceName,
		}
		g.Players.newHost(event.Name, event.ObjectID, player)
	case *types.EventLeave:
		g.Players.delIdx(event.ObjectID)
	}
	g.Broadcast.Broadcast(event)
	return nil
}
