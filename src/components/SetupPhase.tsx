import React, { useState } from "react";
import { Socket } from "socket.io-client";
import { motion } from "motion/react";

type SetupPhaseProps = {
  socket: Socket;
  gameId: string;
  me: any;
  opponentReady: boolean;
};

export function SetupPhase({ socket, gameId, me, opponentReady }: SetupPhaseProps) {
  const [secret, setSecret] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (secret.length === 4 && /^\d{4}$/.test(secret)) {
      socket.emit("set_secret", { gameId, secret });
    }
  };

  if (me.ready) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full shadow-2xl"
      >
        <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-zinc-100">Secret Set!</h2>
        <div className="font-mono text-3xl tracking-[0.5em] text-emerald-400 font-bold my-4">
          {me.secretNumber}
        </div>
        <p className="text-zinc-400">
          {opponentReady ? "Opponent is ready. Starting game..." : "Waiting for opponent to set their secret..."}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full shadow-2xl"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-zinc-100 mb-2">Set Your Secret</h2>
        <p className="text-zinc-400">Choose a 4-digit number. Duplicates are allowed.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={secret}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 4);
              setSecret(val);
            }}
            placeholder="0000"
            className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-xl px-4 py-6 text-center text-5xl tracking-[1em] font-mono text-emerald-400 focus:outline-none focus:border-emerald-500 transition-colors"
            maxLength={4}
            autoFocus
          />
        </div>
        <button
          type="submit"
          disabled={secret.length !== 4}
          className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-zinc-950 font-bold py-4 px-4 rounded-xl transition-colors text-lg"
        >
          Lock In Secret
        </button>
      </form>
    </motion.div>
  );
}
