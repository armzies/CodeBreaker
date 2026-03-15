import React, { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { GameRoom } from "./components/GameRoom";
import { motion, AnimatePresence } from "motion/react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { QrCode, X } from "lucide-react";

const socket: Socket = io();

export default function App() {
  const [gameId, setGameId] = useState("");
  const [joinedGame, setJoinedGame] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get("room");
    if (room) {
      const upperRoom = room.toUpperCase();
      setGameId(upperRoom);
      socket.emit("join_game", upperRoom);
      setJoinedGame(upperRoom);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

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

  const handleScan = (result: any) => {
    if (result && result.length > 0) {
      const text = result[0].rawValue;
      try {
        const url = new URL(text);
        const room = url.searchParams.get("room");
        if (room) {
          const upperRoom = room.toUpperCase();
          setGameId(upperRoom);
          socket.emit("join_game", upperRoom);
          setJoinedGame(upperRoom);
          setIsScanning(false);
        }
      } catch (e) {
        // Not a URL, maybe it's just the code
        if (text.length === 6) {
          const upperRoom = text.toUpperCase();
          setGameId(upperRoom);
          socket.emit("join_game", upperRoom);
          setJoinedGame(upperRoom);
          setIsScanning(false);
        }
      }
    }
  };

  if (joinedGame) {
    return <GameRoom socket={socket} gameId={joinedGame} onLeave={() => setJoinedGame(null)} />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4 font-sans">
      <AnimatePresence mode="wait">
        {isScanning ? (
          <motion.div
            key="scanner"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center"
          >
            <div className="w-full flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-zinc-100">Scan QR Code</h2>
              <button 
                onClick={() => setIsScanning(false)}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-full text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="w-full aspect-square bg-zinc-950 rounded-xl overflow-hidden relative border-2 border-zinc-800">
              <Scanner 
                onScan={handleScan}
                components={{
                  audio: false,
                  finder: false,
                }}
              />
              <div className="absolute inset-0 pointer-events-none border-[40px] border-zinc-950/50">
                <div className="w-full h-full border-2 border-emerald-500 rounded-lg"></div>
              </div>
            </div>
            
            <p className="text-zinc-400 text-sm mt-6 text-center">
              Point your camera at the QR code displayed on the host's screen to join automatically.
            </p>
          </motion.div>
        ) : (
          <motion.div 
            key="home"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
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

              <div className="space-y-4">
                <button
                  onClick={() => setIsScanning(true)}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-emerald-400 font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2 border border-emerald-500/20"
                >
                  <QrCode className="w-5 h-5" />
                  <span>Scan QR Code</span>
                </button>

                <form onSubmit={handleJoin} className="space-y-4">
                  <div>
                    <input
                      type="text"
                      id="gameId"
                      value={gameId}
                      onChange={(e) => setGameId(e.target.value.toUpperCase())}
                      placeholder="Enter 6-character code"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-center text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent uppercase tracking-widest font-mono"
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
