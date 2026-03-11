package game

import (
	"fmt"
)

type CharacterID string

type Lang string

const (
	LangENUS Lang = "EN-US"
	LangDEDE Lang = "DE-DE"
	LangFRFR Lang = "FR-FR"
	LangRURU Lang = "RU-RU"
	LangPLPL Lang = "PL-PL"
	LangESES Lang = "ES-ES"
	LangPTBR Lang = "PT-BR"
	LangITIT Lang = "IT-IT"
	LangZHCN Lang = "ZH-CN"
	LangKOKR Lang = "KO-KR"
	LangJAJP Lang = "JA-JP"
	LangZHTW Lang = "ZH-TW"
	LangIDID Lang = "ID-ID"
	LangTRTR Lang = "TR-TR"
	LangARSA Lang = "AR-SA"
)

type Localization map[Lang]string

type Position [2]float32

func (p Position) X() float32 {
	return p[0]
}

func (p Position) Y() float32 {
	return p[1]
}

type Timestamp int64

func (t Timestamp) String() string {
	totalMs := int(t)
	hours := totalMs / 3600000
	minutes := (totalMs % 3600000) / 60000
	seconds := (totalMs % 60000) / 1000
	millis := totalMs % 1000
	return fmt.Sprintf("%02d:%02d:%02d.%03d", hours, minutes, seconds, millis)
}

type IPlayerObjectID int

func (o IPlayerObjectID) PlayerID() int {
	return int(o)
}

type IPlayerName string

func (n IPlayerName) PlayerName() string {
	return string(n)
}

type IPlayerNameAware interface {
	PlayerName() string
	PlayerID() int
}

type ICaster interface {
	GetCasterID() IPlayerObjectID
	SetCasterName(string)
}
