import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getRatingColor, getRatingTitle } from "../../utils/rating";
import { useAuth } from "../../context/AuthContext";
import type { useDuel } from "../../hooks/useDuel";

interface MatchmakingScreenProps {
  duelState: ReturnType<typeof useDuel>;
}

const BET_OPTIONS = [50, 100, 200, 500, 1000];

export default function MatchmakingScreen({ duelState }: MatchmakingScreenProps) {
  const { user } = useAuth();
  const { mmStatus, duel, error, waited, joinQueue, leaveQueue } = duelState;
  const [searchParams] = useSearchParams();
  const modeParam = searchParams.get("mode") as "normal" | "bet" | null;

  const [mode, setMode]         = useState<"normal" | "bet">(() => modeParam ?? "normal");
  const [betAmount, setBetAmount] = useState(() => {
    // Default to 100, or highest affordable if user has less
    const userPoints = user?.blitzforcePoints ?? 0;
    if (userPoints >= 100) return 100;
    const afforded = BET_OPTIONS.filter((a) => userPoints >= a);
    return afforded.length > 0 ? afforded[afforded.length - 1] : 50;
  });
  const [queued, setQueued]     = useState(false);
  const shouldLeaveOnUnmount = useRef(false);

  const found    = mmStatus === "matched";
  const opponent = duel?.players.opponent;

  const formatWaited = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const band = waited < 30 ? 200 : waited < 60 ? 300 : 400;

  async function handleStart() {
    const joined = await joinQueue(mode, mode === "bet" ? betAmount : 0);
    setQueued(joined);
  }

  async function handleCancel() {
    setQueued(false);
    await leaveQueue();
  }

  // If we're re-entering the page while already matched, auto-start
  useEffect(() => {
    if (mmStatus === "queued") setQueued(true);
    if (mmStatus === "error" || mmStatus === "idle") setQueued(false);
  }, [mmStatus]);

  shouldLeaveOnUnmount.current = queued && !found;

  useEffect(() => {
    return () => {
      if (shouldLeaveOnUnmount.current) void leaveQueue();
    };
  }, [leaveQueue]);

  const userPoints = user?.blitzforcePoints ?? 0;
  const canBet = userPoints >= betAmount;

  return (
    <div className="relative flex-1 flex items-center justify-center overflow-hidden min-h-[calc(100vh-60px)]">
      <div className="absolute inset-0 bg-grid opacity-35 pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 60% at 50% 50%, transparent 40%, #0a0a0f 100%)" }}
      />

      <div className="relative z-10 flex flex-col items-center w-full max-w-[680px] px-6">
        <p className="text-[11px] font-bold tracking-[3px] uppercase text-white/25 mb-9">
          Blitz Duel · {mode === "bet" ? `Bet ${betAmount} pts` : "Rated"}
        </p>

        {/* Player cards */}
        <div className="flex items-stretch w-full">
          {/* You */}
          <div className="flex-1 flex flex-col gap-3.5 p-7 bg-card border border-accent/40 rounded-l-2xl relative overflow-hidden">
            <div className="relative w-fit">
              <div
                className="w-[76px] h-[76px] rounded-full flex items-center justify-center text-[22px] font-extrabold text-white z-10 relative"
                style={{ background: "linear-gradient(135deg, #3b30a0, #7c6af7)" }}
              >
                {user?.cfHandle?.slice(0, 2).toUpperCase() ?? "ME"}
              </div>
              <div className="absolute inset-[-5px] rounded-full border border-accent/50 animate-spinSlow" />
            </div>
            <div>
              <p className="text-[16px] font-bold text-white">{user?.cfHandle ?? "You"}</p>
              <p className="text-[13px] font-mono" style={{ color: getRatingColor(user?.cfRating ?? 0) }}>
                {user?.cfRating ?? "—"}
              </p>
            </div>
            <span
              className="text-[11px] font-bold px-2.5 py-1 rounded-full border w-fit"
              style={{ color: "#c084fc", borderColor: "rgba(192,132,252,0.3)", background: "rgba(192,132,252,0.08)" }}
            >
              {getRatingTitle(user?.cfRating ?? 0)}
            </span>
          </div>

          {/* VS */}
          <div className="flex flex-col items-center justify-center px-3 z-10 flex-shrink-0 gap-2.5">
            <div className="w-px h-8 bg-gradient-to-b from-transparent via-accent to-transparent" />
            <span className="text-[26px] font-extrabold font-mono text-accent tracking-[4px] animate-vsPulse">
              VS
            </span>
            <div className="w-px h-8 bg-gradient-to-b from-transparent via-accent to-transparent" />
          </div>

          {/* Opponent */}
          <div
            className={`flex-1 flex flex-col gap-3.5 p-7 bg-card border rounded-r-2xl items-end relative overflow-hidden transition-colors duration-300 ${
              found ? "border-success/50" : "border-border"
            }`}
          >
            {!found ? (
              <>
                <div className="relative w-fit">
                  <div className="w-[76px] h-[76px] rounded-full border-2 border-dashed border-border-bright flex items-center justify-center bg-elevated">
                    <span className="text-[28px] text-white/20">?</span>
                  </div>
                  <div
                    className="absolute inset-[-5px] rounded-full border border-border-bright/50 animate-spinSlow"
                    style={{ animationDirection: "reverse" }}
                  />
                </div>
                <div className="text-right">
                  <p className="text-[16px] font-bold text-white/30">
                    {queued ? "searching..." : "waiting"}
                  </p>
                  <p className="text-[13px] font-mono text-white/20">????</p>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full border border-border text-white/25 w-fit">
                  ~±{band}
                </span>
              </>
            ) : (
              <div className="flex flex-col gap-3.5 items-end">
                <div className="relative w-fit">
                  <div
                    className="w-[76px] h-[76px] rounded-full flex items-center justify-center text-[22px] font-extrabold text-white"
                    style={{ background: "linear-gradient(135deg, #0f3d27, #1d9e75)" }}
                  >
                    {opponent?.handle?.slice(0, 2).toUpperCase() ?? "BO"}
                  </div>
                  <div
                    className="absolute inset-[-5px] rounded-full border border-success/50 animate-spinSlow"
                    style={{ animationDirection: "reverse" }}
                  />
                </div>
                <div className="text-right">
                  <p className="text-[16px] font-bold text-white">{opponent?.handle ?? "BlitzBot"}</p>
                  <p className="text-[13px] font-mono" style={{ color: getRatingColor(opponent?.rating ?? 0) }}>
                    {opponent?.rating ?? "—"}
                  </p>
                </div>
                <span
                  className="text-[11px] font-bold px-2.5 py-1 rounded-full border border-success/30 w-fit"
                  style={{ color: "#4ade80", background: "rgba(74,222,128,0.08)" }}
                >
                  {getRatingTitle(opponent?.rating ?? 0)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Mode selector — only shown before queuing */}
        {!queued && !found && (
          <div className="w-full mt-7 animate-fade-in-up">
            {/* Mode tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setMode("normal")}
                className={`flex-1 py-2.5 text-[13px] font-bold rounded-xl border transition-colors ${
                  mode === "normal"
                    ? "bg-accent border-accent text-white"
                    : "bg-card border-border text-white/40 hover:text-white"
                }`}
              >
                Rated
                <span className="block text-[10px] font-normal opacity-60 mt-0.5">±10 pts · no risk</span>
              </button>
              <button
                onClick={() => setMode("bet")}
                className={`flex-1 py-2.5 text-[13px] font-bold rounded-xl border transition-colors ${
                  mode === "bet"
                    ? "bg-warn/10 border-warn/50 text-warn"
                    : "bg-card border-border text-white/40 hover:text-white"
                }`}
              >
                Bet
                <span className="block text-[10px] font-normal opacity-60 mt-0.5">winner takes all</span>
              </button>
            </div>

            {/* Bet amount selector */}
            {mode === "bet" && (
              <div className="bg-card border border-warn/20 rounded-xl p-4 mb-4 animate-fade-in">
                <p className="text-[11px] uppercase tracking-wider text-white/30 mb-3 font-bold">
                  Bet Amount · Your balance: {userPoints} pts
                </p>
                <div className="flex gap-2 flex-wrap">
                  {BET_OPTIONS.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setBetAmount(amt)}
                      disabled={userPoints < amt}
                      className={`px-4 py-2 text-[13px] font-bold rounded-lg border transition-colors ${
                        betAmount === amt
                          ? "bg-warn/20 border-warn/60 text-warn"
                          : userPoints < amt
                          ? "opacity-25 cursor-not-allowed bg-card border-border text-white/30"
                          : "bg-card border-border text-white/50 hover:text-white hover:border-border-bright"
                      }`}
                    >
                      {amt}
                    </button>
                  ))}
                </div>
                {!canBet && (
                  <p className="text-[11px] text-danger mt-3 font-mono">
                    Not enough points for this bet. Win more duels to earn points.
                  </p>
                )}
              </div>
            )}

            <button
              onClick={handleStart}
              disabled={mode === "bet" && !canBet}
              className={`w-full py-3 text-white font-bold text-[14px] rounded-xl transition-opacity disabled:opacity-40 disabled:cursor-not-allowed ${
                mode === "bet"
                  ? "bg-warn hover:opacity-90"
                  : "bg-accent hover:opacity-90"
              }`}
            >
              {mode === "bet" ? `Find Opponent · Bet ${betAmount} pts` : "Find Match"}
            </button>
          </div>
        )}

        {/* Queue status — shown after queuing */}
        {queued && (
          <div className="flex flex-col items-center gap-3.5 mt-9 w-full">
            {error && <p className="text-danger text-[13px] font-mono">{error}</p>}
            {!found ? (
              <>
                <div className="w-[360px] h-[3px] bg-border rounded-full overflow-hidden relative">
                  <div
                    className="absolute inset-0 animate-barFill rounded-full"
                    style={{ background: "linear-gradient(90deg, #4f43b3, #7c6af7, #a78bfa)" }}
                  />
                </div>
                <p className="text-[12px] font-semibold tracking-[1.5px] uppercase text-white/40">
                  Searching{[".", "..", "..."][Math.floor(waited / 2) % 3]}
                </p>
                <p className="text-[11px] font-mono text-white/20">{formatWaited(waited)}</p>
                <button
                  onClick={handleCancel}
                  className="text-[12px] text-white/25 hover:text-danger transition-colors mt-1"
                >
                  Cancel{mode === "bet" ? " (refunds bet)" : ""}
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2.5">
                <span className="text-[44px] leading-none">⚔️</span>
                <p className="text-[22px] font-extrabold text-accent tracking-tight">Match found!</p>
                <p className="text-[13px] text-white/30">Entering battle arena...</p>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2 justify-center mt-5">
          {[
            `ELO band ±${band}`,
            `Problem ~${user?.cfRating ?? 1500}`,
            mode === "bet" ? `Bet · ${betAmount} pts` : "Rated · Normal mode",
          ].map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-mono px-2.5 py-1 bg-elevated border border-border rounded-full text-white/25"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
