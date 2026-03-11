package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"

	"albiongo/cmd/albiongo/consumer"
	"albiongo/pkg/api"
	"albiongo/pkg/bus"
	"albiongo/pkg/core"
	"albiongo/pkg/protocol"
	"albiongo/pkg/protocol/decode"

	"github.com/sirupsen/logrus"
)

// CustomFormatter formats logs with distinct colors for better readability

func main() {
	// log.SetLevel(log.DebugLevel)
	logrus.SetReportCaller(true)
	logrus.SetFormatter(&CustomFormatter{})
	ctx := context.WithoutCancel(context.Background())

	// Initialize the EventBus
	eventBus := bus.NewEventBus[protocol.Command](ctx)
	decoder := decode.NewDecoder()
	watcher := core.NewAlbionProcessWatcher(eventBus, decoder)

	// Initialze services
	// playerManager := game.GetPlayerManager()
	// gameStats := game.NewGame(playerManager)
	gameStats := consumer.NewGameStats(nil)
	apiServer := api.NewAPIServer(gameStats, eventBus)
	gameStats.SetBroadcaster(apiServer)

	go apiServer.Run(":8081")

	// Start Consumer
	consoleLogConsumer := eventBus.NewConsumer("ConsoleLog", 1000, consumer.ConsoleLog)
	consoleLogConsumer.Start(ctx)

	// apiConsumer := eventBus.NewConsumer("APIConsumer", 1000, consumer.APIConsumer(apiServer))
	// apiConsumer.Start(ctx)

	statsConsumer := eventBus.NewConsumer("GameStats", 1000, gameStats.GameStatsConsumer)
	statsConsumer.Start(ctx)

	// Run the watcher in a goroutine
	go func() {
		if err := watcher.Run(); err != nil {
			logrus.Errorf("Watcher error: %v\n", err)
		}
	}()

	// Add a signal handler (SIGINT/SIGTERM) to gracefully shut down
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	<-c
	logrus.Info("Shutting down...")
	watcher.Stop()
}
