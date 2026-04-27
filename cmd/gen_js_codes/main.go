package main

import (
	"bytes"
	"flag"
	"fmt"
	"go/ast"
	"go/constant"
	"go/importer"
	"go/parser"
	"go/token"
	"go/types"
	"os"
	"sort"
	"strings"
)

type codeEntry struct {
	Code uint64
	Name string
}

func main() {
	in := flag.String("in", "pkg/protocol/codes.go", "")
	out := flag.String("out", "front/test/codes.generated.js", "")
	flag.Parse()

	opCodes, evCodes, err := readCodes(*in)
	if err != nil {
		_, _ = fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}

	var b bytes.Buffer
	writeJSMap(&b, "OperationCodes", opCodes)
	b.WriteByte('\n')
	writeJSMap(&b, "EventCodes", evCodes)
	b.WriteByte('\n')
	b.WriteString("if (typeof window !== 'undefined') {\n")
	b.WriteString("  window.OperationCodes = OperationCodes;\n")
	b.WriteString("  window.EventCodes = EventCodes;\n")
	b.WriteString("}\n")

	if err := os.WriteFile(*out, b.Bytes(), 0o644); err != nil {
		_, _ = fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func readCodes(path string) ([]codeEntry, []codeEntry, error) {
	fset := token.NewFileSet()
	file, err := parser.ParseFile(fset, path, nil, 0)
	if err != nil {
		return nil, nil, err
	}

	opNames := extractConstBlockNames(file, "OpUnused", "OperationType")
	evNames := extractConstBlockNames(file, "EvUnused", "EventType")

	info := &types.Info{
		Defs: make(map[*ast.Ident]types.Object),
	}

	cfg := &types.Config{
		Importer: importer.Default(),
		Error:    func(error) {},
	}
	if _, err := cfg.Check("protocol", fset, []*ast.File{file}, info); err != nil {
		return nil, nil, err
	}

	constsByName := make(map[string]*types.Const)
	for _, obj := range info.Defs {
		c, ok := obj.(*types.Const)
		if !ok {
			continue
		}
		constsByName[c.Name()] = c
	}

	var opCodes []codeEntry
	var evCodes []codeEntry

	for _, name := range opNames {
		c := constsByName[name]
		if c == nil {
			continue
		}
		code, ok := constToUint64(c.Val())
		if !ok {
			continue
		}
		opCodes = append(opCodes, codeEntry{Code: code, Name: c.Name()})
	}
	for _, name := range evNames {
		c := constsByName[name]
		if c == nil {
			continue
		}
		code, ok := constToUint64(c.Val())
		if !ok {
			continue
		}
		evCodes = append(evCodes, codeEntry{Code: code, Name: c.Name()})
	}

	sort.Slice(opCodes, func(i, j int) bool { return opCodes[i].Code < opCodes[j].Code })
	sort.Slice(evCodes, func(i, j int) bool { return evCodes[i].Code < evCodes[j].Code })

	return opCodes, evCodes, nil
}

func extractConstBlockNames(file *ast.File, markerName string, markerType string) []string {
	for _, decl := range file.Decls {
		gd, ok := decl.(*ast.GenDecl)
		if !ok || gd.Tok != token.CONST {
			continue
		}

		var names []string
		found := false

		for _, spec := range gd.Specs {
			vs, ok := spec.(*ast.ValueSpec)
			if !ok {
				continue
			}

			for _, n := range vs.Names {
				names = append(names, n.Name)
			}

			id, ok := vs.Type.(*ast.Ident)
			if !ok || id.Name != markerType {
				continue
			}
			for _, n := range vs.Names {
				if n.Name == markerName {
					found = true
					break
				}
			}
		}

		if found {
			return names
		}
	}
	return nil
}

func constToUint64(v constant.Value) (uint64, bool) {
	if v == nil {
		return 0, false
	}
	if u, ok := constant.Uint64Val(v); ok {
		return u, true
	}
	if i, ok := constant.Int64Val(v); ok && i >= 0 {
		return uint64(i), true
	}
	return 0, false
}

func writeJSMap(w *bytes.Buffer, varName string, entries []codeEntry) {
	w.WriteString("const ")
	w.WriteString(varName)
	w.WriteString(" = {\n")
	for i, e := range entries {
		w.WriteString("  ")
		w.WriteString(fmt.Sprintf("%d", e.Code))
		w.WriteString(": ")
		w.WriteString(jsSingleQuotedString(e.Name))
		if i != len(entries)-1 {
			w.WriteString(",")
		}
		w.WriteString("\n")
	}
	w.WriteString("};\n")
}

func jsSingleQuotedString(s string) string {
	s = strings.ReplaceAll(s, `\`, `\\`)
	s = strings.ReplaceAll(s, `'`, `\'`)
	s = strings.ReplaceAll(s, "\n", `\n`)
	s = strings.ReplaceAll(s, "\r", `\r`)
	s = strings.ReplaceAll(s, "\t", `\t`)
	return "'" + s + "'"
}
