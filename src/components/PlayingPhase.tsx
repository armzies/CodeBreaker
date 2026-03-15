import React, { useState, useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import { motion, AnimatePresence } from "motion/react";
import { Clock, Trophy, XCircle, ArrowRight } from "lucide-react";

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
  const inputRef = useRef<HTMLInputElement>(null);

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
  const lastGuess = myHistory[0];

  if (isFinished) {
    const isWinner = winner === myId;
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center p-6 sm:p-12 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl text-center"
      >
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${isWinner ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
          {isWinner ? <Trophy className="w-12 h-12" /> : <XCircle className="w-12 h-12" />}
        </div>
        
        <h2 className={`text-4xl sm:text-5xl font-bold mb-4 ${isWinner ? 'text-emerald-400' : 'text-red-400'}`}>
          {isWinner ? "Victory!" : "Defeat!"}
        </h2>
        
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 w-full mb-8">
          <p className="text-zinc-400 text-sm uppercase tracking-widest mb-2">Opponent's Code Was</p>
          <div className="font-mono text-4xl tracking-[0.5em] text-white font-bold">
            {opponent?.secretNumber || '????'}
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-between text-sm">
            <span className="text-zinc-500">Total Guesses</span>
            <span className="text-zinc-300 font-bold">{myHistory.length}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row w-full gap-4">
          <button onClick={onPlayAgain} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold py-4 px-6 rounded-xl transition-colors text-lg flex items-center justify-center gap-2">
            Play Again <ArrowRight className="w-5 h-5" />
          </button>
          <button onClick={onLeave} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold py-4 px-6 rounded-xl transition-colors text-lg">
            Leave Game
          </button>
        </div>
      </motion.div>
    );
  }

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
            
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">
              {isMyTurn ? <span className="text-emerald-400">Your Turn</span> : <span className="text-zinc-500">Opponent's Turn</span>}
            </h2>
            
            <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full border ${isMyTurn ? (timeLeft <= 10 ? 'border-red-500/50 bg-red-500/10 text-red-400' : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400') : 'border-zinc-800 bg-zinc-900 text-zinc-500'}`}>
              <Clock className="w-5 h-5" />
              <span className="font-mono text-xl font-bold">{timeLeft}s</span>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 w-full max-w-sm shadow-2xl relative overflow-hidden">
            {!isMyTurn && (
              <div className="absolute inset-0 bg-zinc-950/95 backdrop-blur-md z-20 flex flex-col items-center justify-center p-6 text-center">
                {lastGuess && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-8 w-full"
                  >
                    <p className="text-zinc-400 text-sm font-medium mb-3">Guess Result</p>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center space-y-3 shadow-inner">
                      <span className="font-mono text-4xl tracking-[0.3em] text-white font-bold ml-2">{lastGuess.guess}</span>
                      <div className="flex items-center space-x-2 bg-emerald-500/10 px-4 py-2 rounded-xl text-emerald-400">
                        <span className="font-bold text-2xl">{lastGuess.correctPositions}</span>
                        <span className="text-sm uppercase font-bold tracking-wider">Correct</span>
                      </div>
                    </div>
                  </motion.div>
                )}
                <div className="w-8 h-8 border-4 border-zinc-800 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
                <p className="text-zinc-400 font-medium animate-pulse">Waiting for opponent...</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="relative z-0">
              {/* Visual 4-box input */}
              <div className="flex justify-between gap-2 sm:gap-4 mb-6 relative" onClick={() => inputRef.current?.focus()}>
                {[0, 1, 2, 3].map((i) => {
                  const digit = guess[i];
                  const isActive = guess.length === i && isMyTurn;
                  return (
                    <div 
                      key={i} 
                      className={`flex-1 aspect-[3/4] flex items-center justify-center text-3xl sm:text-4xl font-mono font-bold rounded-xl border-2 transition-all duration-200
                        ${digit ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/5' : 
                          isActive ? 'border-emerald-500 text-emerald-400 bg-zinc-950 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 
                          'border-zinc-800 bg-zinc-950 text-zinc-700'}`}
                    >
                      {digit || ''}
                      {isActive && <div className="absolute w-1 h-6 bg-emerald-500 animate-pulse rounded-full opacity-50"></div>}
                    </div>
                  );
                })}
                
                {/* Hidden actual input */}
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={guess}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setGuess(val);
                  }}
                  disabled={!isMyTurn}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-text z-10"
                  maxLength={4}
                  autoFocus
                />
              </div>
              
              <button
                type="submit"
                disabled={guess.length !== 4 || !isMyTurn}
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
