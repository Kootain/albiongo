package replay

type Player struct {
	Name   string
	Status *PlayerStatus
	Stats  *PlayerStats
}

type PlayerStatus struct {
	Buffs   []*Buff
	Casting *Spell
}

type PlayerStats struct {
	Name   string
	Spells []*Spell
}

func (p *Player) completeCast(seqID int64) {

	if p.Status.Casting == nil {
		return
	}
	if p.Status.Casting.SeqID > seqID {
		// TODO: 异常，需要记录
		return
	}
	p.Status.Casting.Success = false
	p.Status.Casting.IsInterupted = false
	p.Status.Casting.Canceled = false
	p.Status.Casting.Error = true
}

func (p *Player) CastStart(spellID int, seqID int64, ts Timestamp) {
	p.completeCast(seqID)
	c := NewSpell(spellID, seqID, p.Name, ts)
	p.Status.Casting = c
	p.Stats.Spells = append(p.Stats.Spells, c)
}

func (p *Player) CastCancel(isInterupted bool, ts Timestamp) {
	if p.Status.Casting == nil {
		// TODO: 异常，需要记录
		return
	}
	p.Status.Casting.Success = false
	p.Status.Casting.IsInterupted = isInterupted
	p.Status.Casting.Canceled = true
	p.Status.Casting.Duration.Cast.EndTimestamp = &ts

	p.Status.Casting = nil
}

func (p *Player) CastFinish(spellID int, ts Timestamp) {
	if p.Status.Casting == nil {
		// TODO: 异常，需要记录
		return
	}
	if p.Status.Casting.ID != spellID {
		// TODO: 异常，需要记录
		return
	}
	p.Status.Casting.Success = true
	p.Status.Casting.Duration.Cast.EndTimestamp = &ts
}
