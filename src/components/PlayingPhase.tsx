import React, { useState, useEffect } from "react";
import { Socket } from "socket.io-client";
import { motion, AnimatePresence } from "motion/react";
import { Clock, CheckCircle2, XCircle } from "lucide-react";

type PlayingPhaseProps = {
  socket: Socket;
  gameId: string;
  isMyTurn: boolean;
  turnStartTime: number | null;
  history: {
    playerId: string;
    guess: string;
    correctPositions: number;
    timestamp: number;
  }[];
  myId: string;
  isFinished: boolean;
  winner: string | null;
  me: any;
  opponent: any;
  onPlayAgain: () => void;
  onLeave: () => void;
};

export function PlayingPhase({ socket, gameId, isMyTurn, turnStartTime, history, myId, isFinished, winner, me, opponent, onPlayAgain, onLeave }: PlayingPhaseProps) {
  const [guess, setGuess] = useState("");
  const [timeLeft, setTimeLeft] = useState(40);

  useEffect(() => {
    if (!turnStartTime || isFinished) return;
    
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - turnStartTime) / 1000);
      const remaining = Math.max(0, 40 - elapsed);
      setTimeLeft(remaining);
    }, 100);

    return () => clearInterval(interval);
  }, [turnStartTime, isMyTurn, isFinished]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (guess.length === 4 && /^\d{4}$/.test(guess) && isMyTurn) {
      socket.emit("submit_guess", { gameId, guess });
      setGuess("");
    }
  };

  const myHistory = history.filter(h => h.playerId === myId).reverse();

  return (
    <div className="w-full max-w-4xl flex flex-col lg:grid lg:grid-cols-2 gap-4 lg:gap-8 p-0 sm:p-4 h-full">
      
      {/* Mobile Swipe Hint */}
      <div className="flex lg:hidden justify-center items-center space-x-2 mt-2 mb-1 text-xs font-bold text-zinc-500 uppercase tracking-widest opacity-70">
        <span>← Swipe for History →</span>
      </div>

      {/* Carousel Container */}
      <div className="flex overflow-x-auto snap-x snap-mandatory w-full h-full lg:contents [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        
        {/* Page 1: Play Area */}
        <div className="w-full flex-shrink-0 snap-center flex flex-col items-center justify-start sm:justify-center space-y-6 p-4 lg:p-0 lg:col-start-1 lg:row-start-1">
          <div className="text-center">
            <p className="text-zinc-400 text-xs sm:text-sm uppercase tracking-widest mb-1">Your Secret Code</p>
            <div className="font-mono text-2xl sm:text-3xl tracking-[0.5em] text-emerald-400 font-bold mb-4">
              {me.secretNumber}
            </div>
            
            {!isFinished && (
              <>
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                  {isMyTurn ? <span className="text-emerald-400">Your Turn</span> : <span className="text-zinc-500">Opponent's Turn</span>}
                </h2>
                
                <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full border ${isMyTurn ? (timeLeft <= 10 ? 'border-red-500/50 bg-red-500/10 text-red-400' : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400') : 'border-zinc-800 bg-zinc-900 text-zinc-500'}`}>
                  <Clock className="w-5 h-5" />
                  <span className="font-mono text-xl font-bold">{timeLeft}s</span>
                </div>
              </>
            )}
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 w-full max-w-sm shadow-2xl relative overflow-hidden">
            {isFinished && (
              <div className="absolute inset-0 bg-zinc-950/95 backdrop-blur-md z-20 flex flex-col items-center justify-center p-6 text-center">
                <h3 className={`text-3xl sm:text-4xl font-bold mb-2 ${winner === myId ? 'text-emerald-400' : 'text-red-400'}`}>
                  {winner === myId ? "You Won!" : "You Lost!"}
                </h3>
                <p className="text-zinc-300 mb-6 text-sm sm:text-base">
                  Opponent's code was: <br/>
                  <span className="font-mono text-2xl tracking-widest text-white mt-2 block">{opponent?.secretNumber || 'Left Game'}</span>
                </p>
                <div className="flex flex-col w-full space-y-3">
                  <button onClick={onPlayAgain} className="w-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold py-3 px-4 rounded-xl transition-colors">
                    Play Again
                  </button>
                  <button onClick={onLeave} className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold py-3 px-4 rounded-xl transition-colors">
                    Leave Game
                  </button>
                </div>
              </div>
            )}

            {!isMyTurn && !isFinished && (
              <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-zinc-800 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
                <p className="text-zinc-300 font-medium">Waiting for opponent...</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6 relative z-0">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={guess}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setGuess(val);
                }}
                placeholder="0000"
                disabled={!isMyTurn || isFinished}
                className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-2xl px-4 py-4 sm:py-6 text-center text-4xl sm:text-5xl tracking-[0.3em] sm:tracking-[0.5em] font-mono text-emerald-400 focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50"
                maxLength={4}
                autoFocus
              />
              
              <button
                type="submit"
                disabled={guess.length !== 4 || !isMyTurn || isFinished}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-zinc-950 font-bold py-3 sm:py-4 px-4 rounded-xl transition-colors text-lg"
              >
                Submit Guess
              </button>
            </form>
          </div>
        </div>

        {/* Page 2: My History */}
        <div className="w-full flex-shrink-0 snap-center flex flex-col p-4 lg:p-0 lg:col-start-2 lg:row-start-1 h-[75vh] min-h-[400px] lg:h-[600px]">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-6 flex flex-col h-full shadow-2xl">
            <h3 className="text-lg sm:text-xl font-bold text-emerald-400 mb-3 border-b border-zinc-800 pb-2">My Guesses</h3>
            <div className="flex-1 overflow-y-auto space-y-2 sm:space-y-3 pr-1 sm:pr-2 custom-scrollbar">
              <AnimatePresence>
                {myHistory.map((h, i) => (
                  <motion.div 
                    key={h.timestamp}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 sm:p-4 flex flex-col xl:flex-row justify-between items-center text-center xl:text-left gap-1"
                  >
                    <span className="font-mono text-xl sm:text-2xl tracking-widest text-zinc-200">{h.guess}</span>
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <span className="text-emerald-500 font-bold text-base sm:text-lg">{h.correctPositions}</span>
                      <span className="text-zinc-500 text-xs sm:text-sm uppercase tracking-wider">Correct</span>
                    </div>
                  </motion.div>
                ))}
                {myHistory.length === 0 && (
                  <p className="text-zinc-600 text-center italic mt-6 sm:mt-10 text-sm sm:text-base">No guesses yet.</p>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
