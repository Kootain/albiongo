package main

import (
	"fmt"
	"strings"

	log "github.com/sirupsen/logrus"
)

type CustomFormatter struct{}

func (f *CustomFormatter) Format(entry *log.Entry) ([]byte, error) {
	// ANSI color codes
	const (
		reset  = "\033[0m"
		red    = "\033[31m"
		green  = "\033[32m"
		yellow = "\033[33m"
		blue   = "\033[34m"
		cyan   = "\033[36m"
		gray   = "\033[90m"
		purple = "\033[35m"
	)

	// Level color
	var levelColor string
	switch entry.Level {
	case log.DebugLevel, log.TraceLevel:
		levelColor = gray
	case log.InfoLevel:
		levelColor = green
	case log.WarnLevel:
		levelColor = yellow
	case log.ErrorLevel, log.FatalLevel, log.PanicLevel:
		levelColor = red
	default:
		levelColor = blue
	}

	// Timestamp
	timestamp := entry.Time.Format("2006-01-02 15:04:05")

	// Caller info (File:Line)
	var caller string
	if entry.HasCaller() {
		filename := entry.Caller.File
		// Shorten the path
		if idx := strings.LastIndex(filename, "/albiongo/"); idx != -1 {
			filename = filename[idx+1:]
		}
		caller = fmt.Sprintf("%s:%d", filename, entry.Caller.Line)
	}

	// Format: [Time] [Level] [File:Line] Message
	// Example: [2023-10-27 10:00:00] [INFO] [main.go:42] Application started
	msg := fmt.Sprintf("%s[%s]%s %s[%s]%s %s[%s]%s %s\n",
		cyan, timestamp, reset,
		levelColor, strings.ToUpper(entry.Level.String()), reset,
		purple, caller, reset,
		entry.Message,
	)

	return []byte(msg), nil
}
