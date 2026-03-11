package api

import (
	"albiongo/data"
	"albiongo/pkg/bus"
	"albiongo/pkg/game"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/sirupsen/logrus"
)

type IBroadcaster interface {
	Broadcast(data interface{})
}

type IStatsProvider interface {
	GetStats() bus.BusStats
}

type Client struct {
	conn *websocket.Conn
	send chan interface{}
}

func (c *Client) writePump() {
	defer func() {
		c.conn.Close()
	}()

	for message := range c.send {
		c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
		if err := c.conn.WriteJSON(message); err != nil {
			return
		}
	}
	c.conn.WriteMessage(websocket.CloseMessage, []byte{})
}

type APIServer struct {
	game          game.IGame
	statsProvider IStatsProvider
	engine        *gin.Engine
	clients       map[*Client]bool
	lock          sync.RWMutex
}

func NewAPIServer(g game.IGame, sp IStatsProvider) *APIServer {
	server := &APIServer{
		game:          g,
		statsProvider: sp,
		engine:        gin.Default(),
		clients:       make(map[*Client]bool),
	}
	server.engine.Use(CORSMiddleware())
	server.engine.StaticFS("/data", http.FS(data.Assets))
	server.setupRoutes()
	return server
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

func (s *APIServer) setupRoutes() {
	s.engine.GET("/players", s.getPlayers)
	s.engine.GET("/events", s.handleWebSocket)
	s.engine.GET("/stats", s.getStats)
}

func (s *APIServer) getStats(c *gin.Context) {
	if s.statsProvider != nil {
		c.JSON(200, s.statsProvider.GetStats())
	} else {
		c.JSON(500, gin.H{"error": "stats provider not available"})
	}
}

func (s *APIServer) handleWebSocket(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		logrus.Errorf("Failed to upgrade websocket: %v", err)
		return
	}

	client := &Client{conn: conn, send: make(chan interface{}, 256)}

	s.lock.Lock()
	s.clients[client] = true
	s.lock.Unlock()

	go client.writePump()

	// Handle connection close
	go func() {
		defer func() {
			s.lock.Lock()
			delete(s.clients, client)
			s.lock.Unlock()
			close(client.send)
			conn.Close()
		}()

		for {
			_, _, err := conn.ReadMessage()
			if err != nil {
				break
			}
		}
	}()
}

func (s *APIServer) Broadcast(data interface{}) {
	s.lock.RLock()
	defer s.lock.RUnlock()

	for client := range s.clients {
		select {
		case client.send <- data:
			if data == nil {
				logrus.Warn("Broadcasting nil data")
			}
		default:
			// If the channel is full, we might want to drop the message or disconnect the client
			// For now, let's just drop it to prevent blocking
			logrus.Warn("Client send channel full, dropping message")
		}
	}
}

func (s *APIServer) Run(addr string) error {
	return s.engine.Run(addr)
}

func (s *APIServer) getPlayers(c *gin.Context) {
	var filter game.PlayerFilter

	name := c.Query("name")
	if name != "" {
		filter.Name = &name
	}

	guild := c.Query("guild")
	if guild != "" {
		filter.GuildName = &guild
	}

	alliance := c.Query("alliance")
	if alliance != "" {
		filter.AllianceName = &alliance
	}

	players, err := s.game.Player().ListPlayer(&filter)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, players)
}
