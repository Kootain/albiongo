package record

import (
	"albiongo/pkg/protocol"
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"
)

// EventRecorder efficiently writes events to a file using NDJSON (Newline Delimited JSON).
// It buffers events in memory and flushes them to disk when:
// 1. The buffer reaches 'batchSize' items
// 2. 'flushInterval' duration has passed since the last flush
type EventRecorder struct {
	dirPath       string
	batchSize     int
	flushInterval time.Duration

	currentDate string
	file        *os.File
	writer      *bufio.Writer

	mu        sync.Mutex
	ticker    *time.Ticker
	done      chan struct{}
	itemCount int
}

// NewEventRecorder creates a new EventRecorder.
// dirPath: Directory to store event files. Files will be named YYYY-MM-DD.jsonl (UTC).
// batchSize: Number of events to buffer before writing to disk.
// flushInterval: Maximum time to wait before writing buffered events to disk.
func NewEventRecorder(dirPath string, batchSize int, flushInterval time.Duration) (*EventRecorder, error) {
	// Ensure directory exists
	if err := os.MkdirAll(dirPath, 0755); err != nil {
		return nil, fmt.Errorf("failed to create directory %s: %w", dirPath, err)
	}

	er := &EventRecorder{
		dirPath:       dirPath,
		batchSize:     batchSize,
		flushInterval: flushInterval,
		done:          make(chan struct{}),
	}

	// Initialize file for current date
	if err := er.rotateFileLocked(time.Now().UTC()); err != nil {
		return nil, err
	}

	er.startTicker()
	return er, nil
}

func (er *EventRecorder) startTicker() {
	er.ticker = time.NewTicker(er.flushInterval)
	go func() {
		for {
			select {
			case <-er.ticker.C:
				if err := er.Flush(); err != nil {
					fmt.Printf("EventRecorder flush error: %v\n", err)
				}
			case <-er.done:
				return
			}
		}
	}()
}

// Record adds an event to the buffer.
// It may trigger a flush if the batch size is reached.
// It also checks if file rotation is needed (new UTC day).
func (er *EventRecorder) Record(event protocol.Command) error {
	er.mu.Lock()
	defer er.mu.Unlock()

	// Check date rotation
	now := time.Now().UTC()
	dateStr := now.Format("2006-01-02")
	if dateStr != er.currentDate {
		if err := er.flushLocked(); err != nil {
			return fmt.Errorf("failed to flush before rotation: %w", err)
		}
		if err := er.rotateFileLocked(now); err != nil {
			return fmt.Errorf("failed to rotate file: %w", err)
		}
	}

	// Encode to JSON
	data, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal event: %w", err)
	}

	// Write JSON line + newline
	if _, err := er.writer.Write(data); err != nil {
		return fmt.Errorf("failed to write data: %w", err)
	}
	if err := er.writer.WriteByte('\n'); err != nil {
		return fmt.Errorf("failed to write newline: %w", err)
	}

	er.itemCount++
	if er.itemCount >= er.batchSize {
		return er.flushLocked()
	}
	return nil
}

// Flush forces any buffered events to be written to the underlying writer.
func (er *EventRecorder) Flush() error {
	er.mu.Lock()
	defer er.mu.Unlock()
	return er.flushLocked()
}

func (er *EventRecorder) flushLocked() error {
	if er.itemCount == 0 && er.writer.Buffered() == 0 {
		return nil
	}

	if err := er.writer.Flush(); err != nil {
		return fmt.Errorf("failed to flush buffer: %w", err)
	}
	// Sync to disk to ensure data safety, though it costs performance.
	// Given the "high performance" requirement, we might omit Sync() or do it less frequently.
	// For now, we rely on OS page cache flushing.

	er.itemCount = 0
	return nil
}

func (er *EventRecorder) rotateFileLocked(t time.Time) error {
	// Close existing file if any
	if er.file != nil {
		_ = er.writer.Flush()
		_ = er.file.Close()
	}

	dateStr := t.Format("2006-01-02")
	filename := fmt.Sprintf("albion_log_%s.jsonl", dateStr)
	filePath := filepath.Join(er.dirPath, filename)

	f, err := os.OpenFile(filePath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return fmt.Errorf("failed to open file %s: %w", filePath, err)
	}

	// Use a large buffer for bufio (e.g., 256KB) to minimize syscalls
	er.file = f
	er.writer = bufio.NewWriterSize(f, 256*1024)
	er.currentDate = dateStr
	er.itemCount = 0 // Reset buffer count for new writer

	return nil
}

// Close flushes the buffer and closes the file.
func (er *EventRecorder) Close() error {
	er.ticker.Stop()
	close(er.done)

	er.Flush() // Final flush
	if er.file != nil {
		return er.file.Close()
	}
	return nil
}
