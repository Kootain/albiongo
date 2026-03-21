package rule

import (
	"errors"
	"fmt"
	"strings"
)

// Node represents a node in the expression tree
type Node interface {
	Evaluate(content string) bool
	String() string
}

// AndNode represents a logical AND operation
type AndNode struct {
	Left  Node
	Right Node
}

func (n *AndNode) Evaluate(content string) bool {
	return n.Left.Evaluate(content) && n.Right.Evaluate(content)
}

func (n *AndNode) String() string {
	return fmt.Sprintf("(%s & %s)", n.Left.String(), n.Right.String())
}

// OrNode represents a logical OR operation
type OrNode struct {
	Left  Node
	Right Node
}

func (n *OrNode) Evaluate(content string) bool {
	return n.Left.Evaluate(content) || n.Right.Evaluate(content)
}

func (n *OrNode) String() string {
	return fmt.Sprintf("(%s | %s)", n.Left.String(), n.Right.String())
}

// TermNode represents a keyword matching operation
type TermNode struct {
	Keyword string
}

func (n *TermNode) Evaluate(content string) bool {
	return strings.Contains(content, n.Keyword)
}

func (n *TermNode) String() string {
	return n.Keyword
}

// Parser parses a rule string into an AST
type Parser struct {
	input string
	pos   int
}

func NewParser(input string) *Parser {
	return &Parser{input: input, pos: 0}
}

func (p *Parser) Parse() (Node, error) {
	node, err := p.parseExpression()
	if err != nil {
		return nil, err
	}
	p.skipWhitespace()
	if p.pos < len(p.input) {
		return nil, errors.New("unexpected characters at end of expression")
	}
	return node, nil
}

// Expression -> AndTerm { "|" AndTerm }
func (p *Parser) parseExpression() (Node, error) {
	left, err := p.parseAndTerm()
	if err != nil {
		return nil, err
	}

	for {
		p.skipWhitespace()
		if p.peek() == '|' {
			p.consume() // consume '|'
			right, err := p.parseAndTerm()
			if err != nil {
				return nil, err
			}
			left = &OrNode{Left: left, Right: right}
		} else {
			break
		}
	}
	return left, nil
}

// AndTerm -> Factor { "&" Factor }
func (p *Parser) parseAndTerm() (Node, error) {
	left, err := p.parseFactor()
	if err != nil {
		return nil, err
	}

	for {
		p.skipWhitespace()
		if p.peek() == '&' {
			p.consume() // consume '&'
			right, err := p.parseFactor()
			if err != nil {
				return nil, err
			}
			left = &AndNode{Left: left, Right: right}
		} else {
			break
		}
	}
	return left, nil
}

// Factor -> "(" Expression ")" | Keyword
func (p *Parser) parseFactor() (Node, error) {
	p.skipWhitespace()
	if p.peek() == '(' {
		p.consume() // consume '('
		expr, err := p.parseExpression()
		if err != nil {
			return nil, err
		}
		p.skipWhitespace()
		if p.peek() != ')' {
			return nil, errors.New("missing closing parenthesis")
		}
		p.consume() // consume ')'
		return expr, nil
	}

	return p.parseKeyword()
}

func (p *Parser) parseKeyword() (Node, error) {
	p.skipWhitespace()
	start := p.pos
	// Allow any character except operators and whitespace
	for p.pos < len(p.input) {
		c := p.input[p.pos]
		if c == '&' || c == '|' || c == '(' || c == ')' || isWhitespace(c) {
			break
		}
		p.pos++
	}

	if start == p.pos {
		return nil, errors.New("expected keyword")
	}

	keyword := p.input[start:p.pos]
	return &TermNode{Keyword: keyword}, nil
}

func (p *Parser) peek() byte {
	if p.pos >= len(p.input) {
		return 0
	}
	return p.input[p.pos]
}

func (p *Parser) consume() {
	p.pos++
}

func (p *Parser) skipWhitespace() {
	for p.pos < len(p.input) && isWhitespace(p.input[p.pos]) {
		p.pos++
	}
}

func isWhitespace(c byte) bool {
	return c == ' ' || c == '\t' || c == '\n' || c == '\r'
}

// Helper function to evaluate a rule string against content
func Evaluate(rule string, content string) (bool, error) {
	parser := NewParser(rule)
	node, err := parser.Parse()
	if err != nil {
		return false, err
	}
	return node.Evaluate(content), nil
}
