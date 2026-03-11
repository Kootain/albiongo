//go:build darwin
// +build darwin

package core

import (
	"net"

	log "github.com/sirupsen/logrus"
)

// Gets all physical interfaces based on filter results, ignoring all VM, Loopback and Tunnel interfaces.
func getAllPhysicalInterface() ([]string, error) {
	interfaces, err := net.Interfaces()
	if err != nil {
		return nil, err
	}

	var outInterfaces []string

	for _, _interface := range interfaces {
		log.Debugf("Checking interface: Name=%s, Flags=%v, Addr=%s", _interface.Name, _interface.Flags, _interface.HardwareAddr.String())
		if _interface.Flags&net.FlagLoopback == 0 && _interface.Flags&net.FlagUp == 1 && isPhysicalInterface(_interface.HardwareAddr.String()) {
			outInterfaces = append(outInterfaces, _interface.Name)
		}
	}

	return outInterfaces, nil
}
