package replay

import (
	. "albiongo/pkg/protocol/types"
)

type Timestamp int64

type EffectArea struct {
}

type Duration struct {
	StartTimestamp *Timestamp
	EndTimestamp   *Timestamp
}

type SpellDuration struct {
	Cast       *Duration
	Channeling *Duration
}

type Spell struct {
	ID         int
	SeqID      int64
	CasterName string

	EffectAreas  []*EffectArea
	Effects      []*SpellEffect
	Duration     *SpellDuration
	Success      bool
	IsInterupted bool
	Canceled     bool
	Error        bool
}

func NewSpell(spellID int, seqID int64, casterName string, ts Timestamp) *Spell {
	return &Spell{
		ID:          spellID,
		CasterName:  casterName,
		EffectAreas: make([]*EffectArea, 0),
		Effects:     make([]*SpellEffect, 0),
		Duration: &SpellDuration{
			Cast: &Duration{
				StartTimestamp: &ts,
			},
		},
	}
}

type SpellEffect struct {
	SeqID       int64
	CasterName  string
	CastSpellID int

	TargetName    string
	EffectSpellID int

	Buff    *Buff
	Damages []*HealthChange
}

type HealthChange struct {
	Health      int
	HealthDelta int
	Timestamp   Timestamp
}

type Buff struct {
	SpellID    int
	CauserName string

	Stack            int
	ExpectDurationMs int
	Duration         Duration
	Damages          []*HealthChange
	Heals            []*HealthChange
}

type Engine struct {
	PlayerStats map[string]*PlayerStats
}

func (e *Engine) player(name string) *PlayerStats {
	return e.PlayerStats[name]
}

func (e *Engine) CastStart(event *EventCastStart) {
	// spell := NewSpell(event.SpellID, event.SeqID, event.Name, Timestamp(event.Ts))

}

func (e *Engine) CastCancel(name string, seqID int64, isInterupted bool, ts Timestamp) {

}

func (e *Engine) CastFinish() {

}

func (e *Engine) CastSpell() {

}

func (e *Engine) ChannelingEnd() {

}
