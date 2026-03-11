package core

import (
	"encoding/base64"
	"encoding/gob"
	"fmt"
	"io"
	"os"

	"albiongo/pkg/bus"
	"albiongo/pkg/protocol"

	photon "github.com/ao-data/photon-spectator"
	"github.com/google/gopacket"
	"github.com/google/gopacket/layers"
	"github.com/google/gopacket/pcap"
	log "github.com/sirupsen/logrus"
)

type listener struct {
	handle        *pcap.Handle
	sourcePackets chan gopacket.Packet
	commands      chan photon.PhotonCommand
	displayName   string
	fragments     *photon.FragmentBuffer
	quit          chan bool
	bus           *bus.EventBus[protocol.Command]
	decoder       protocol.Decoder
}

var (
	ports = []int{5055, 5056, 5058, 4535}
)

func newListener(bus *bus.EventBus[protocol.Command], decoder protocol.Decoder) *listener {
	return &listener{
		fragments: photon.NewFragmentBuffer(),
		commands:  make(chan photon.PhotonCommand, 1),
		quit:      make(chan bool, 1),
		bus:       bus,
		decoder:   decoder,
	}
}

func (l *listener) startOnline(device string, port int) {
	handle, err := pcap.OpenLive(device, 2048, false, pcap.BlockForever)
	if err != nil {
		log.Panic(err)
	}
	l.handle = handle

	err = l.handle.SetBPFFilter(fmt.Sprintf("tcp port %d || udp port %d", port, port))
	if err != nil {
		log.Panic(err)
	}

	layers.RegisterUDPPortLayerType(layers.UDPPort(port), photon.PhotonLayerType)
	layers.RegisterTCPPortLayerType(layers.TCPPort(port), photon.PhotonLayerType)
	source := gopacket.NewPacketSource(l.handle, l.handle.LinkType())
	l.sourcePackets = source.Packets()

	l.displayName = fmt.Sprintf("online: %s:%d", device, port)
	l.run()
}

func (l *listener) startOfflinePcap(path string) {
	handle, err := pcap.OpenOffline(path)
	if err != nil {
		log.Panicf("Problem creating offline source. Error: %v", err)
	}
	l.handle = handle

	for _, port := range ports {
		layers.RegisterUDPPortLayerType(layers.UDPPort(port), photon.PhotonLayerType)
		layers.RegisterTCPPortLayerType(layers.TCPPort(port), photon.PhotonLayerType)
	}
	source := gopacket.NewPacketSource(handle, handle.LinkType())
	l.sourcePackets = source.Packets()

	l.displayName = fmt.Sprintf("Offline Pcap: %s", path)
	l.run()
}

func (l *listener) startOfflineCommandGob(path string) {
	// Set up packets with an empty channel
	l.sourcePackets = make(chan gopacket.Packet, 1)

	var decoder *gob.Decoder
	file, err := os.Open(path)
	if err != nil {
		log.Panic("Could not open commands input file ", err)
	} else {
		decoder = gob.NewDecoder(file)
	}

	go func() {
		for {
			command := &photon.PhotonCommand{}
			if decoder == nil {
				break
			}
			err = decoder.Decode(command)
			if err != nil {
				if err == io.EOF {
					break
				}
				log.Error("Could not decode command ", err)
				continue
			}
			l.commands <- *command
		}

		err = file.Close()
		if err != nil {
			log.Error("Could not close commands input file ", err)
		}
		log.Info("All offline commands should processed now.")
	}()

	for _, port := range ports {
		layers.RegisterUDPPortLayerType(layers.UDPPort(port), photon.PhotonLayerType)
		layers.RegisterTCPPortLayerType(layers.TCPPort(port), photon.PhotonLayerType)
	}

	l.displayName = fmt.Sprintf("Offline Commands: %s", path)
	l.run()
}

func (l *listener) run() {
	log.Debugf("Starting listener (%s)...", l.displayName)

	for {
		select {
		case <-l.quit:
			log.Debugf("Listener shutting down (%s)...", l.displayName)
			l.handle.Close()
			return
		case packet := <-l.sourcePackets:
			if packet != nil {
				l.processPacket(packet)
			} else {
				// MUST only happen with the offline processor.
				l.handle.Close()
				return
			}
		case command := <-l.commands:
			l.onReliableCommand(&command)
		}
	}
}

func (l *listener) stop() {
	l.quit <- true
	l.handle.Close()
}

func (l *listener) processPacket(packet gopacket.Packet) {
	// Just to confirm we are receiving *something*
	// log.Debug("Received a packet")

	ipLayer := packet.Layer(layers.LayerTypeIPv4)

	if ipLayer == nil {
		return
	}

	ipv4 := ipLayer.(*layers.IPv4)

	if ipLayer != nil {
		ipv4, _ = ipLayer.(*layers.IPv4)
		log.Tracef("Packet came from: %s", ipv4.SrcIP)
	}

	if ipv4.SrcIP == nil {
		log.Trace("No IPv4 detected")
		return
	}

	layer := packet.Layer(photon.PhotonLayerType)

	if layer == nil {
		// log.Debug("Packet does not contain Photon layer")
		return
	}

	content, _ := layer.(photon.PhotonLayer)

	for _, command := range content.Commands {
		switch command.Type {
		case photon.SendReliableType:
			l.onReliableCommand(&command)
		case photon.SendUnreliableType:
			var s = make([]byte, len(command.Data)-4)
			copy(s, command.Data[4:])
			command.Data = s
			command.Length -= 4
			command.Type = 6
			l.onReliableCommand(&command)
		case photon.SendReliableFragmentType:
			msg, _ := command.ReliableFragment()
			result := l.fragments.Offer(msg)
			if result != nil {
				l.onReliableCommand(result)
			}
		}
	}
}

func (l *listener) onReliableCommand(command *photon.PhotonCommand) {
	// Record all photon commands even if the params did not parse correctly
	// if ConfigGlobal.RecordPath != "" {
	// 	l.router.recordPhotonCommand <- *command
	// }

	msg, err := command.ReliableMessage()
	if err != nil {
		if !ConfigGlobal.DebugIgnoreDecodingErrors {
			log.Debugf("Could not decode reliable message: %v - %v", err, base64.StdEncoding.EncodeToString(command.Data))
		}
		return
	}
	params := photon.DecodeReliableMessage(msg)
	if params == nil {
		if !ConfigGlobal.DebugIgnoreDecodingErrors {
			log.Debugf("ERROR: Could not decode params: [%d] (%d) (%d) %v", msg.Type, msg.ParameterCount, len(msg.Data), base64.StdEncoding.EncodeToString(msg.Data))
		}
		return
	}

	var decodedObject protocol.Command

	switch msg.Type {
	case photon.OperationRequest:
		if val, ok := params[253]; ok {
			code := int(val.(int16))
			log.Debugf("OperationRequest: Code %d", code)
			decodedObject, err = l.decoder.DecodeRequest(code, params)
			if err != nil && !ConfigGlobal.DebugIgnoreDecodingErrors {
				log.Errorf("OperationRequest: ERROR - %v", err)
			}
		}
	case photon.OperationResponse:
		if val, ok := params[253]; ok {
			code := int(val.(int16))
			log.Debugf("OperationResponse: Code %d", code)
			decodedObject, err = l.decoder.DecodeResponse(code, params)
			if err != nil && !ConfigGlobal.DebugIgnoreDecodingErrors {
				log.Errorf("OperationResponse: ERROR - %v", err)
			}
		}
	case photon.EventDataType:
		val := params[252]
		code, ok := val.(int16)
		if !ok {
			code = int16(msg.EventCode)
		}
		// drop move event
		if code == 3 {
			break
		}
		log.Debugf("EventDataType: Code %d", code)

		decodedObject, err = l.decoder.DecodeEvent(int(code), params)
		if err != nil && !ConfigGlobal.DebugIgnoreDecodingErrors {
			log.Errorf("EventDataType: ERROR - %v", err)
		}

	default:
		err = fmt.Errorf("unsupported message type: %v, data: %v", msg.Type, base64.StdEncoding.EncodeToString(msg.Data))
	}

	if err != nil && !ConfigGlobal.DebugIgnoreDecodingErrors {
		log.Debugf("Error while decoding an event or operation: %v - params: %v", err, params)
	}

	if decodedObject != nil {
		log.Debugf("publish object: %v", decodedObject)
		l.bus.Publish(decodedObject)
	}
}
