import React, { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { GameRoom } from "./components/GameRoom";
import { motion } from "motion/react";

const socket: Socket = io();

export default function App() {
  const [gameId, setGameId] = useState("");
  const [joinedGame, setJoinedGame] = useState<string | null>(null);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (gameId.trim()) {
      socket.emit("join_game", gameId);
      setJoinedGame(gameId);
    }
  };

  const handleCreate = () => {
    const newGameId = Math.random().toString(36).substring(2, 8).toUpperCase();
    socket.emit("join_game", newGameId);
    setJoinedGame(newGameId);
  };

  if (joinedGame) {
    return <GameRoom socket={socket} gameId={joinedGame} onLeave={() => setJoinedGame(null)} />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-emerald-400 mb-2">CodeBreaker</h1>
          <p className="text-zinc-400">A real-time 2-player number guessing game</p>
        </div>

        <div className="space-y-6">
          <button
            onClick={handleCreate}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-semibold py-3 px-4 rounded-xl transition-colors"
          >
            Create New Game
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-zinc-900 text-zinc-500">Or join existing</span>
            </div>
          </div>

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label htmlFor="gameId" className="block text-sm font-medium text-zinc-400 mb-1">
                Game Code
              </label>
              <input
                type="text"
                id="gameId"
                value={gameId}
                onChange={(e) => setGameId(e.target.value.toUpperCase())}
                placeholder="Enter 6-character code"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent uppercase"
                maxLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={!gameId.trim()}
              className="w-full bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-100 font-semibold py-3 px-4 rounded-xl transition-colors"
            >
              Join Game
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
