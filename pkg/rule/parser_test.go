package rule

import (
	"testing"
)

func TestEvaluate(t *testing.T) {
	tests := []struct {
		rule     string
		content  string
		expected bool
	}{
		{"A & B", "A B C", true},
		{"A & B", "A C", false},
		{"A | B", "A C", true},
		{"A | B", "C D", false},
		{"(A | B) & C", "A C", true},
		{"(A | B) & C", "B C", true},
		{"(A | B) & C", "A B", false},
		{"A & !B", "A C", true},
		{"A & !B", "A B C", false},
		{"!(A | B)", "C D", true},
		{"!(A | B)", "A C", false},
		{"毛毛 & !蓝台", "毛毛去打架了", true},
		{"毛毛 & !蓝台", "毛毛去了蓝台", false},
		{"毛毛 & !(蓝台 | 黑区)", "毛毛在黄区", true},
		{"毛毛 & !(蓝台 | 黑区)", "毛毛在黑区", false},
	}

	for _, test := range tests {
		result, err := Evaluate(test.rule, test.content)
		if err != nil {
			t.Errorf("Rule '%s' failed to parse: %v", test.rule, err)
			continue
		}
		if result != test.expected {
			t.Errorf("Rule '%s' against '%s' expected %v, got %v", test.rule, test.content, test.expected, result)
		}
	}
}