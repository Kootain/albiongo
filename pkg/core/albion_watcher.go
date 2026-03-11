package core

import (
	"time"

	"albiongo/pkg/bus"
	"albiongo/pkg/protocol"

	log "github.com/sirupsen/logrus"
)

type AlbionProcessWatcher struct {
	known     []int
	devices   []string
	listeners map[int][]*listener
	quit      chan bool
	bus       *bus.EventBus[protocol.Command]
	decoder   protocol.Decoder
}

func NewAlbionProcessWatcher(bus *bus.EventBus[protocol.Command], decoder protocol.Decoder) *AlbionProcessWatcher {
	return &AlbionProcessWatcher{
		listeners: make(map[int][]*listener),
		quit:      make(chan bool),
		bus:       bus,
		decoder:   decoder,
	}
}

func (apw *AlbionProcessWatcher) Run() error {
	log.Print("Watching Albion")
	physicalInterfaces, err := getAllPhysicalInterface()
	log.Printf("Interfaces %d", len(physicalInterfaces))
	if err != nil {
		return err
	}
	apw.devices = physicalInterfaces
	// Always print found devices for debugging
	log.Debugf("Found devices: %v", apw.devices)

	log.Debugf("Will listen to these devices: %v", apw.devices)

	for {
		select {
		case <-apw.quit:
			apw.Close()
			return nil
		default:
			if len(apw.listeners) == 0 {
				log.Debug("Creating listeners...")
				apw.createListeners()
			}
			time.Sleep(time.Second)
		}
	}
}

func (apw *AlbionProcessWatcher) Stop() {
	apw.quit <- true
}

func (apw *AlbionProcessWatcher) Close() {
	log.Print("Albion watcher closed")

	for port := range apw.listeners {
		for _, l := range apw.listeners[port] {
			l.stop()
		}

		delete(apw.listeners, port)
	}
}

func (apw *AlbionProcessWatcher) createListeners() {

	for _, port := range ports {
		for _, device := range apw.devices {
			l := newListener(apw.bus, apw.decoder)
			go l.startOnline(device, port)

			apw.listeners[port] = append(apw.listeners[port], l)
		}
	}
}
