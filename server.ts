import express from "express";
import { createServer as createViteServer } from "vite";
import { Server } from "socket.io";
import http from "http";

// --- Game State Types ---
type Player = {
  id: string;
  secretNumber: string | null;
  ready: boolean;
};

type GameState = {
  id: string;
  players: Record<string, Player>;
  status: "waiting" | "setup" | "playing" | "finished";
  turn: string | null; // socket ID of the player whose turn it is
  turnStartTime: number | null;
  winner: string | null;
  history: {
    playerId: string;
    guess: string;
    correctPositions: number;
    timestamp: number;
  }[];
};

const games: Record<string, GameState> = {};
const TURN_DURATION_MS = 40000;

function createNewGame(gameId: string): GameState {
  return {
    id: gameId,
    players: {},
    status: "waiting",
    turn: null,
    turnStartTime: null,
    winner: null,
    history: [],
  };
}

function checkGuess(guess: string, secret: string): number {
  let correctPositions = 0;
  for (let i = 0; i < 4; i++) {
    if (guess[i] === secret[i]) {
      correctPositions++;
    }
  }
  return correctPositions;
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: "*" },
  });
  const PORT = process.env.PORT || 3000;

  // Helper to broadcast state while hiding opponent's secret (unless game is finished)
  function broadcastGameState(gameId: string) {
    const game = games[gameId];
    if (!game) return;
    const playerIds = Object.keys(game.players);
    
    playerIds.forEach(playerId => {
      const safeGame = JSON.parse(JSON.stringify(game));
      
      // If the game is NOT finished, hide the opponent's secret
      if (safeGame.status !== "finished") {
        playerIds.forEach(pid => {
          if (pid !== playerId && safeGame.players[pid].secretNumber) {
            safeGame.players[pid].secretNumber = "hidden";
          }
        });
      }
      
      io.to(playerId).emit("game_state", safeGame);
    });
  }

  // --- Socket.io Logic ---
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join_game", (gameId: string) => {
      let game = games[gameId];
      if (!game) {
        game = createNewGame(gameId);
        games[gameId] = game;
      }

      const playerIds = Object.keys(game.players);
      if (playerIds.length >= 2 && !game.players[socket.id]) {
        socket.emit("error", "Game is full");
        return;
      }

      if (!game.players[socket.id]) {
        game.players[socket.id] = { id: socket.id, secretNumber: null, ready: false };
      }

      socket.join(gameId);
      
      if (Object.keys(game.players).length === 2 && game.status === "waiting") {
        game.status = "setup";
      }

      broadcastGameState(gameId);
    });

    socket.on("set_secret", ({ gameId, secret }: { gameId: string; secret: string }) => {
      const game = games[gameId];
      if (!game || game.status !== "setup" || !game.players[socket.id]) return;

      if (secret.length !== 4 || !/^\d{4}$/.test(secret)) {
        socket.emit("error", "Invalid secret number");
        return;
      }

      game.players[socket.id].secretNumber = secret;
      game.players[socket.id].ready = true;

      const allReady = Object.values(game.players).every((p) => p.ready);
      if (allReady) {
        game.status = "playing";
        // Randomly pick who goes first
        const playerIds = Object.keys(game.players);
        game.turn = playerIds[Math.floor(Math.random() * playerIds.length)];
        game.turnStartTime = Date.now();
      }

      broadcastGameState(gameId);
    });

    socket.on("submit_guess", ({ gameId, guess }: { gameId: string; guess: string }) => {
      const game = games[gameId];
      if (!game || game.status !== "playing" || game.turn !== socket.id) return;

      if (guess.length !== 4 || !/^\d{4}$/.test(guess)) {
        socket.emit("error", "Invalid guess");
        return;
      }

      const opponentId = Object.keys(game.players).find((id) => id !== socket.id);
      if (!opponentId) return;

      const opponentSecret = game.players[opponentId].secretNumber;
      if (!opponentSecret) return;

      const correctPositions = checkGuess(guess, opponentSecret);

      game.history.push({
        playerId: socket.id,
        guess,
        correctPositions,
        timestamp: Date.now(),
      });

      if (correctPositions === 4) {
        game.status = "finished";
        game.winner = socket.id;
        game.turn = null;
        game.turnStartTime = null;
      } else {
        // Switch turn
        game.turn = opponentId;
        game.turnStartTime = Date.now();
      }

      broadcastGameState(gameId);
    });

    socket.on("play_again", (gameId: string) => {
      const game = games[gameId];
      if (!game || game.status !== "finished") return;
      
      // Reset game state for a new round
      game.status = "setup";
      game.winner = null;
      game.turn = null;
      game.turnStartTime = null;
      game.history = [];
      Object.values(game.players).forEach(p => {
        p.secretNumber = null;
        p.ready = false;
      });
      
      broadcastGameState(gameId);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      for (const gameId in games) {
        const game = games[gameId];
        if (game.players[socket.id]) {
          game.status = "finished";
          const opponentId = Object.keys(game.players).find((id) => id !== socket.id);
          if (opponentId) {
            game.winner = opponentId; // Opponent wins by default
          }
          broadcastGameState(gameId);
          // Clean up game after a while
          setTimeout(() => {
             delete games[gameId];
          }, 5000);
        }
      }
    });
  });

  // Turn timer check loop
  setInterval(() => {
    const now = Date.now();
    for (const gameId in games) {
      const game = games[gameId];
      if (game.status === "playing" && game.turn && game.turnStartTime) {
        if (now - game.turnStartTime >= TURN_DURATION_MS) {
          // Turn timeout! Switch turn.
          const opponentId = Object.keys(game.players).find((id) => id !== game.turn);
          if (opponentId) {
            game.turn = opponentId;
            game.turnStartTime = now;
            
            broadcastGameState(gameId);
            io.to(gameId).emit("turn_timeout", { previousTurn: game.turn });
          }
        }
      }
    }
  }, 1000);

  // --- API Routes ---
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // --- Vite Middleware ---
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
