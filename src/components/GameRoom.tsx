import { useState, useEffect } from "react";
import { Socket } from "socket.io-client";
import { SetupPhase } from "./SetupPhase";
import { PlayingPhase } from "./PlayingPhase";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";

type GameRoomProps = {
  socket: Socket;
  gameId: string;
  onLeave: () => void;
};

export function GameRoom({ socket, gameId, onLeave }: GameRoomProps) {
  const [gameState, setGameState] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    socket.on("game_state", (state) => {
      setGameState(state);
    });

    socket.on("error", (msg) => {
      setError(msg);
    });

    return () => {
      socket.off("game_state");
      socket.off("error");
    };
  }, [socket]);

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-6 max-w-sm w-full text-center">
          <h2 className="text-red-400 font-semibold mb-2">Error</h2>
          <p className="text-zinc-300 mb-4">{error}</p>
          <button onClick={onLeave} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-2 rounded-lg">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  const { status, players, turn, turnStartTime, winner, history } = gameState;
  const isSetup = status === "setup";
  const isPlaying = status === "playing" || status === "finished";
  const isFinished = status === "finished";
  const isWaiting = status === "waiting";

  const me = players[socket.id];
  const opponentId = Object.keys(players).find((id) => id !== socket.id);
  const opponent = opponentId ? players[opponentId] : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col">
      <header className="border-b border-zinc-800 bg-zinc-900/50 p-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-emerald-400">CodeBreaker</h1>
          <div className="bg-zinc-800 px-3 py-1 rounded-md text-sm font-mono text-zinc-300">
            Room: {gameId}
          </div>
        </div>
        <button onClick={onLeave} className="text-sm text-zinc-400 hover:text-zinc-200">
          Leave Game
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        {isWaiting && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6"
          >
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 border-4 border-zinc-800 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-zinc-200 mb-2">Waiting for opponent...</h2>
              <p className="text-zinc-500">Share the room code <span className="font-mono text-emerald-400">{gameId}</span> with a friend.</p>
            </div>
          </motion.div>
        )}

        {isSetup && (
          <SetupPhase socket={socket} gameId={gameId} me={me} opponentReady={opponent?.ready} />
        )}

        {isPlaying && (
          <PlayingPhase 
            socket={socket} 
            gameId={gameId} 
            isMyTurn={turn === socket.id} 
            turnStartTime={turnStartTime} 
            history={history}
            myId={socket.id}
            isFinished={isFinished}
            winner={winner}
            me={me}
            opponent={opponent}
            onPlayAgain={() => socket.emit("play_again", gameId)}
            onLeave={onLeave}
          />
        )}
      </main>
    </div>
  );
}
