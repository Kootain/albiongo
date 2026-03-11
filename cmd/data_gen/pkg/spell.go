package pkg

import (
	"albiongo/pkg/game"
	"encoding/json"
	"encoding/xml"
	"fmt"
	"io"
	"os"
	"regexp"
	"sync"

	"github.com/sirupsen/logrus"
)

type xmlNode struct {
	XMLName            xml.Name
	UniqueName         string    `xml:"uniquename,attr"`
	NameLocatag        string    `xml:"namelocatag,attr"`
	DescriptionLocatag string    `xml:"descriptionlocatag,attr"`
	Target             string    `xml:"target,attr"`
	Category           string    `xml:"category,attr"`
	ChannelingSpell    *struct{} `xml:"channelingspell"` // 仅用于判断该子节点是否存在
}

type SpellManager struct {
	mu       sync.Mutex
	spells   []*game.Spell
	spellMap map[string]*game.Spell
}

func createSpellFromNode(index int, node *xmlNode) *game.Spell {
	if node.UniqueName == "" {
		return nil
	}
	return &game.Spell{
		Index:              index,
		UniqueName:         node.UniqueName,
		Target:             node.Target,
		Category:           node.Category,
		NameLocatag:        node.NameLocatag,
		DescriptionLocatag: node.DescriptionLocatag,
	}
}

func (m *SpellManager) LoadFromFile(filepath string) error {
	r, err := os.OpenFile(filepath, os.O_RDONLY, 0644)
	if err != nil {
		logrus.Fatalf("open file failed: %v", err)
	}
	defer r.Close()
	decoder := xml.NewDecoder(r)

	var newSpells []*game.Spell
	newSpellMap := make(map[string]*game.Spell)
	index := 0

	cnt := 0

	for {
		t, err := decoder.Token()
		if err == io.EOF {
			break
		}
		if err != nil {
			return err
		}

		switch se := t.(type) {
		case xml.StartElement:
			if se.Name.Local == "colortag" {
				decoder.Skip() // 跳过 colortag 内容
				continue
			}

			// 匹配有效标签
			if se.Name.Local == "passivespell" || se.Name.Local == "activespell" || se.Name.Local == "togglespell" {
				var node xmlNode
				if err := decoder.DecodeElement(&node, &se); err != nil {
					return err
				}

				if spell := createSpellFromNode(index, &node); spell != nil {
					newSpells = append(newSpells, spell)
					newSpellMap[spell.UniqueName] = spell
					index++
				}

				// 还原 C# 中 activespell 嵌套 channelingspell 的特殊逻辑
				if se.Name.Local == "activespell" && node.ChannelingSpell != nil {
					if channelingSpell := createSpellFromNode(index, &node); channelingSpell != nil {
						newSpells = append(newSpells, channelingSpell)
						newSpellMap[channelingSpell.UniqueName] = channelingSpell
						index++
					}
				}
			}
		}
	}

	// 加锁替换内部状态
	m.mu.Lock()
	m.spells = newSpells
	m.spellMap = newSpellMap
	m.mu.Unlock()
	logrus.Infof("Total: %d, Local: %d", index, cnt)

	return nil
}

func (m *SpellManager) InitLocalizer(localizer ILocalizer) {
	nameTranslateCnt := 0
	descTranslateCnt := 0
	for _, spell := range m.spells {
		translationKeys := []string{spell.NameLocatag,
			fmt.Sprintf("@SPELLS_%s", spell.UniqueName),
			fmt.Sprintf("@SPELLS_%s2", spell.UniqueName),
		}
		for _, key := range translationKeys {
			if key == "" {
				continue
			}
			if trans := localizer.Translation(key); trans != nil {
				spell.Name = trans
				break
			}
		}
		descKeys := []string{spell.DescriptionLocatag, fmt.Sprintf("@SPELLS_%s_DESC", spell.UniqueName)}
		for _, key := range descKeys {
			if key == "" {
				continue
			}
			if trans := localizer.Translation(key); trans != nil {
				replaceAllPlaceholders(trans)
				spell.Description = trans
				break
			}
		}
		if spell.Name != nil {
			nameTranslateCnt++
		}
		if spell.Description != nil {
			descTranslateCnt++
		}
	}
	logrus.Infof("Total Spell: %d, name translate: %d, desc translate: %d", len(m.spells), nameTranslateCnt, descTranslateCnt)
}

func replaceAllPlaceholders(tran game.Localization) {
	for k, v := range tran {
		tran[k] = replacePlaceholders(v)
	}
}

func replacePlaceholders(text string) string {
	// Matches $anything$
	re := regexp.MustCompile(`\$[^$]+\$`)
	return re.ReplaceAllString(text, "?")
}

func (s *SpellManager) JsonDumpToFile(filePath string) error {
	r := map[int]*game.Spell{}
	for _, spell := range s.spells {
		r[spell.Index] = spell
	}
	f, err := os.OpenFile(filePath, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0644)
	if err != nil {
		return err
	}
	defer f.Close()
	if err := json.NewEncoder(f).Encode(r); err != nil {
		return err
	}
	return nil
}
