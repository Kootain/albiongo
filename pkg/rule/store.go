package rule

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"

	"github.com/sirupsen/logrus"
)

type UserConfig struct {
	Rules []string `json:"rules"`
}

type RuleConfig struct {
	Users map[string]*UserConfig `json:"users"`
}

type RuleManager struct {
	mu         sync.RWMutex
	config     *RuleConfig
	configPath string
	// Cache parsed rules to avoid re-parsing on every message
	// Map userID -> list of parsed Nodes
	ruleCache map[string][]Node
}

func NewRuleManager(path string) *RuleManager {
	rm := &RuleManager{
		configPath: path,
		config: &RuleConfig{
			Users: make(map[string]*UserConfig),
		},
		ruleCache: make(map[string][]Node),
	}
	// Try to load existing config
	if err := rm.Load(); err != nil {
		logrus.Warnf("Failed to load rules from %s: %v. Starting with empty rules.", path, err)
	}
	return rm
}

func (rm *RuleManager) Load() error {
	rm.mu.Lock()
	defer rm.mu.Unlock()

	data, err := os.ReadFile(rm.configPath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}

	var config RuleConfig
	if err := json.Unmarshal(data, &config); err != nil {
		return err
	}

	rm.config = &config
	if rm.config.Users == nil {
		rm.config.Users = make(map[string]*UserConfig)
	}

	// Rebuild cache
	rm.rebuildCache()
	return nil
}

func (rm *RuleManager) Save() error {
	rm.mu.RLock()
	defer rm.mu.RUnlock()

	data, err := json.MarshalIndent(rm.config, "", "  ")
	if err != nil {
		return err
	}

	dir := filepath.Dir(rm.configPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	return os.WriteFile(rm.configPath, data, 0644)
}

// rebuildCache assumes lock is held
func (rm *RuleManager) rebuildCache() {
	rm.ruleCache = make(map[string][]Node)
	for userID, userConfig := range rm.config.Users {
		var nodes []Node
		for _, ruleStr := range userConfig.Rules {
			parser := NewParser(ruleStr)
			node, err := parser.Parse()
			if err != nil {
				logrus.Errorf("Failed to parse rule '%s' for user %s: %v", ruleStr, userID, err)
				continue
			}
			nodes = append(nodes, node)
		}
		rm.ruleCache[userID] = nodes
	}
}

func (rm *RuleManager) AddRule(userID string, ruleStr string) error {
	// Validate rule first
	parser := NewParser(ruleStr)
	_, err := parser.Parse()
	if err != nil {
		return fmt.Errorf("invalid rule syntax: %v", err)
	}

	rm.mu.Lock()
	defer rm.mu.Unlock()

	userConfig, exists := rm.config.Users[userID]
	if !exists {
		userConfig = &UserConfig{Rules: []string{}}
		rm.config.Users[userID] = userConfig
	}

	// Check for duplicates
	for _, r := range userConfig.Rules {
		if r == ruleStr {
			return fmt.Errorf("rule already exists")
		}
	}

	userConfig.Rules = append(userConfig.Rules, ruleStr)
	
	// Update cache
	rm.rebuildCache() // Can be optimized to just update this user
	
	// Save asynchronously or synchronously? Sync for safety.
	// We release lock before saving to avoid blocking readers during I/O if Save was slow,
	// but here Save needs read lock. To call Save() we need to release Lock() and acquire RLock().
	// Or just implement internalSave that takes no lock.
	return rm.internalSave()
}

func (rm *RuleManager) internalSave() error {
	data, err := json.MarshalIndent(rm.config, "", "  ")
	if err != nil {
		return err
	}
	dir := filepath.Dir(rm.configPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}
	return os.WriteFile(rm.configPath, data, 0644)
}

func (rm *RuleManager) DeleteRule(userID string, index int) error {
	rm.mu.Lock()
	defer rm.mu.Unlock()

	userConfig, exists := rm.config.Users[userID]
	if !exists {
		return fmt.Errorf("user not found")
	}

	if index < 1 || index > len(userConfig.Rules) {
		return fmt.Errorf("invalid rule index")
	}

	// Remove rule at index-1
	userConfig.Rules = append(userConfig.Rules[:index-1], userConfig.Rules[index:]...)
	
	rm.rebuildCache()
	return rm.internalSave()
}

func (rm *RuleManager) GetRules(userID string) []string {
	rm.mu.RLock()
	defer rm.mu.RUnlock()

	userConfig, exists := rm.config.Users[userID]
	if !exists {
		return []string{}
	}
	// Return a copy
	rules := make([]string, len(userConfig.Rules))
	copy(rules, userConfig.Rules)
	return rules
}

// Match returns a list of userIDs whose rules match the content
func (rm *RuleManager) Match(content string) []string {
	rm.mu.RLock()
	defer rm.mu.RUnlock()

	var matchedUsers []string
	for userID, nodes := range rm.ruleCache {
		for _, node := range nodes {
			if node.Evaluate(content) {
				matchedUsers = append(matchedUsers, userID)
				break // One matching rule is enough to notify the user
			}
		}
	}
	return matchedUsers
}
