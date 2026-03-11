import express from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";

const app = express();
const PORT = 3000;
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Mock data
const mockPlayers = [
  {
    Name: "moneyandhoney",
    GuildName: "Laughing Boulevard",
    AllianceName: "NIC",
    Equipments: [8409, 0, 3546, 4027, 5411, 2836, 2457, 2971, 0, 0],
    Spells: [2757, 2768, 2805, 3763, 3870, 3922, -1, -1, -1, -1, -1, -1, 4259, -1],
  },
  {
    Name: "player2",
    GuildName: "Laughing Boulevard",
    AllianceName: "NIC",
    Equipments: [123, 0, 456, 789, 101, 102, 103, 104, 0, 0],
    Spells: [10, 11, 12, 13, 14, 15, -1, -1, -1, -1, -1, -1, 16, -1],
  },
  {
    Name: "enemy1",
    GuildName: "Enemy Guild",
    AllianceName: "BAD",
    Equipments: [200, 0, 201, 202, 203, 204, 205, 206, 0, 0],
    Spells: [20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1, -1, 26, -1],
  }
];

// API routes
app.get("/players", (req, res) => {
  const { name, guild, alliance } = req.query;
  let filtered = mockPlayers;
  if (name) {
    filtered = filtered.filter(p => p.Name.toLowerCase().includes(String(name).toLowerCase()));
  }
  if (guild) {
    filtered = filtered.filter(p => p.GuildName.toLowerCase().includes(String(guild).toLowerCase()));
  }
  if (alliance) {
    filtered = filtered.filter(p => p.AllianceName.toLowerCase().includes(String(alliance).toLowerCase()));
  }
  res.json(filtered);
});

// WebSocket logic
wss.on("connection", (ws) => {
  console.log("Client connected");

  // Send a new player event after 5 seconds
  setTimeout(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        Type: 0,
        Code: 29,
        Name: "newplayer",
        GuildName: "New Guild",
        AllianceName: "NEW",
        EquipmentIDs: [300, 0, 301, 302, 303, 304, 305, 306, 0, 0],
        SpellIDs: [30, 31, 32, 33, 34, 35, -1, -1, -1, -1, -1, -1, 36, -1]
      }));
    }
  }, 5000);

  // Send a skill use event periodically
  const interval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      const spells = [2757, 2768, 2805, 3763, 3870, 3922];
      const randomSpell = spells[Math.floor(Math.random() * spells.length)];
      ws.send(JSON.stringify({
        Type: 0,
        Code: 123, // Custom code for skill use
        Name: "moneyandhoney",
        SpellID: randomSpell
      }));
    }
  }, 3000);

  ws.on("close", () => {
    console.log("Client disconnected");
    clearInterval(interval);
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
