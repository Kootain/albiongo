package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"
	"time"

	"albiongo/cmd/albiongo/consumer"
	"albiongo/pkg/adapter"
	"albiongo/pkg/api"
	"albiongo/pkg/bus"
	"albiongo/pkg/core"
	"albiongo/pkg/feishu"
	"albiongo/pkg/protocol"
	"albiongo/pkg/protocol/decode"
	"albiongo/pkg/record"
	"albiongo/pkg/rule"

	"github.com/joho/godotenv"
	"github.com/sirupsen/logrus"
)

// CustomFormatter formats logs with distinct colors for better readability

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		logrus.Warn("No .env file found, using environment variables")
	}

	// log.SetLevel(log.DebugLevel)
	logrus.SetReportCaller(true)
	logrus.SetFormatter(&CustomFormatter{})
	core.ConfigGlobal.RecordPath = "./data"
	ctx := context.WithoutCancel(context.Background())

	// Initialize the EventBus
	eventBus := bus.NewEventBus[protocol.Command](ctx)
	gameStatsBus := bus.NewEventBus[protocol.Command](ctx)
	decoder := decode.NewDecoder()
	watcher := core.NewAlbionProcessWatcher(eventBus, decoder)

	// Initialze services
	gameStats := consumer.NewGameStats(gameStatsBus)
	apiServer := api.NewAPIServer(gameStats, eventBus)

	// Feishu Module Initialization
	feishuAppID := os.Getenv("FEISHU_APP_ID")
	feishuAppSecret := os.Getenv("FEISHU_APP_SECRET")

	if feishuAppID != "" && feishuAppSecret != "" {
		ruleManager := rule.NewRuleManager("./data/feishu_rules.json")
		feishuBot := feishu.NewBot(feishuAppID, feishuAppSecret, ruleManager)

		// Start WebSocket client in background
		go func() {
			if err := feishuBot.Start(ctx); err != nil {
				logrus.Errorf("Feishu WebSocket error: %v", err)
			}
		}()

		feishuConsumer := adapter.NewFeishuConsumer(feishuBot, ruleManager)

		fc := gameStatsBus.NewConsumer("FeishuConsumer", 1000, feishuConsumer.Consume)
		fc.Start(ctx)
		logrus.Infof("Feishu module started with AppID: %s", feishuAppID)
	} else {
		logrus.Info("Feishu module disabled (missing configuration)")
	}

	go apiServer.Run(":8081")

	// Start Consumer
	consoleLogConsumer := gameStatsBus.NewConsumer("ConsoleLog", 1000, consumer.ConsoleLog)
	consoleLogConsumer.Start(ctx)

	apiConsumer := gameStatsBus.NewConsumer("APIConsumer", 1000, consumer.APIConsumer(apiServer))
	apiConsumer.Start(ctx)

	statsConsumer := eventBus.NewConsumer("GameStats", 1000, gameStats.GameStatsConsumer)
	statsConsumer.Start(ctx)

	eventRecorder, err := record.NewEventRecorder(core.ConfigGlobal.RecordPath, 1000, 5*time.Second)
	if err != nil {
		logrus.Errorf("Failed to create event recorder: %v\n", err)
		return
	}

	fileLogConsumer := gameStatsBus.NewConsumer("FileLog", 1000, consumer.FileLogFactory(eventRecorder))
	fileLogConsumer.Start(ctx)

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
	eventRecorder.Close()
}
