import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getRatingColor, getRatingTitle } from "../../utils/rating";
import { useAuth } from "../../context/AuthContext";
const BET_OPTIONS = [50, 100, 200, 500, 1000];
export default function MatchmakingScreen({ duelState }) {
    const { user } = useAuth();
    const { mmStatus, duel, error, waited, joinQueue, leaveQueue } = duelState;
    const [searchParams] = useSearchParams();
    const modeParam = searchParams.get("mode");
    const [mode, setMode] = useState(() => modeParam ?? "normal");
    const [betAmount, setBetAmount] = useState(() => {
        // Default to 100, or highest affordable if user has less
        const userPoints = user?.blitzforcePoints ?? 0;
        if (userPoints >= 100)
            return 100;
        const afforded = BET_OPTIONS.filter((a) => userPoints >= a);
        return afforded.length > 0 ? afforded[afforded.length - 1] : 50;
    });
    const [queued, setQueued] = useState(false);
    const shouldLeaveOnUnmount = useRef(false);
    const found = mmStatus === "matched";
    const opponent = duel?.players.opponent;
    const formatWaited = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
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
        if (mmStatus === "queued")
            setQueued(true);
        if (mmStatus === "error" || mmStatus === "idle")
            setQueued(false);
    }, [mmStatus]);
    shouldLeaveOnUnmount.current = queued && !found;
    useEffect(() => {
        return () => {
            if (shouldLeaveOnUnmount.current)
                void leaveQueue();
        };
    }, [leaveQueue]);
    const userPoints = user?.blitzforcePoints ?? 0;
    const canBet = userPoints >= betAmount;
    return (_jsxs("div", { className: "relative flex-1 flex items-center justify-center overflow-hidden min-h-[calc(100vh-60px)]", children: [_jsx("div", { className: "absolute inset-0 bg-grid opacity-35 pointer-events-none" }), _jsx("div", { className: "absolute inset-0 pointer-events-none", style: { background: "radial-gradient(ellipse 60% 60% at 50% 50%, transparent 40%, #0a0a0f 100%)" } }), _jsxs("div", { className: "relative z-10 flex flex-col items-center w-full max-w-[680px] px-6", children: [_jsxs("p", { className: "text-[11px] font-bold tracking-[3px] uppercase text-white/25 mb-9", children: ["Blitz Duel \u00B7 ", mode === "bet" ? `Bet ${betAmount} pts` : "Rated"] }), _jsxs("div", { className: "flex items-stretch w-full", children: [_jsxs("div", { className: "flex-1 flex flex-col gap-3.5 p-7 bg-card border border-accent/40 rounded-l-2xl relative overflow-hidden", children: [_jsxs("div", { className: "relative w-fit", children: [_jsx("div", { className: "w-[76px] h-[76px] rounded-full flex items-center justify-center text-[22px] font-extrabold text-white z-10 relative", style: { background: "linear-gradient(135deg, #3b30a0, #7c6af7)" }, children: user?.cfHandle?.slice(0, 2).toUpperCase() ?? "ME" }), _jsx("div", { className: "absolute inset-[-5px] rounded-full border border-accent/50 animate-spinSlow" })] }), _jsxs("div", { children: [_jsx("p", { className: "text-[16px] font-bold text-white", children: user?.cfHandle ?? "You" }), _jsx("p", { className: "text-[13px] font-mono", style: { color: getRatingColor(user?.cfRating ?? 0) }, children: user?.cfRating ?? "—" })] }), _jsx("span", { className: "text-[11px] font-bold px-2.5 py-1 rounded-full border w-fit", style: { color: "#c084fc", borderColor: "rgba(192,132,252,0.3)", background: "rgba(192,132,252,0.08)" }, children: getRatingTitle(user?.cfRating ?? 0) })] }), _jsxs("div", { className: "flex flex-col items-center justify-center px-3 z-10 flex-shrink-0 gap-2.5", children: [_jsx("div", { className: "w-px h-8 bg-gradient-to-b from-transparent via-accent to-transparent" }), _jsx("span", { className: "text-[26px] font-extrabold font-mono text-accent tracking-[4px] animate-vsPulse", children: "VS" }), _jsx("div", { className: "w-px h-8 bg-gradient-to-b from-transparent via-accent to-transparent" })] }), _jsx("div", { className: `flex-1 flex flex-col gap-3.5 p-7 bg-card border rounded-r-2xl items-end relative overflow-hidden transition-colors duration-300 ${found ? "border-success/50" : "border-border"}`, children: !found ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "relative w-fit", children: [_jsx("div", { className: "w-[76px] h-[76px] rounded-full border-2 border-dashed border-border-bright flex items-center justify-center bg-elevated", children: _jsx("span", { className: "text-[28px] text-white/20", children: "?" }) }), _jsx("div", { className: "absolute inset-[-5px] rounded-full border border-border-bright/50 animate-spinSlow", style: { animationDirection: "reverse" } })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-[16px] font-bold text-white/30", children: queued ? "searching..." : "waiting" }), _jsx("p", { className: "text-[13px] font-mono text-white/20", children: "????" })] }), _jsxs("span", { className: "text-[11px] font-bold px-2.5 py-1 rounded-full border border-border text-white/25 w-fit", children: ["~\u00B1", band] })] })) : (_jsxs("div", { className: "flex flex-col gap-3.5 items-end", children: [_jsxs("div", { className: "relative w-fit", children: [_jsx("div", { className: "w-[76px] h-[76px] rounded-full flex items-center justify-center text-[22px] font-extrabold text-white", style: { background: "linear-gradient(135deg, #0f3d27, #1d9e75)" }, children: opponent?.handle?.slice(0, 2).toUpperCase() ?? "BO" }), _jsx("div", { className: "absolute inset-[-5px] rounded-full border border-success/50 animate-spinSlow", style: { animationDirection: "reverse" } })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-[16px] font-bold text-white", children: opponent?.handle ?? "BlitzBot" }), _jsx("p", { className: "text-[13px] font-mono", style: { color: getRatingColor(opponent?.rating ?? 0) }, children: opponent?.rating ?? "—" })] }), _jsx("span", { className: "text-[11px] font-bold px-2.5 py-1 rounded-full border border-success/30 w-fit", style: { color: "#4ade80", background: "rgba(74,222,128,0.08)" }, children: getRatingTitle(opponent?.rating ?? 0) })] })) })] }), !queued && !found && (_jsxs("div", { className: "w-full mt-7 animate-fade-in-up", children: [_jsxs("div", { className: "flex gap-2 mb-4", children: [_jsxs("button", { onClick: () => setMode("normal"), className: `flex-1 py-2.5 text-[13px] font-bold rounded-xl border transition-colors ${mode === "normal"
                                            ? "bg-accent border-accent text-white"
                                            : "bg-card border-border text-white/40 hover:text-white"}`, children: ["Rated", _jsx("span", { className: "block text-[10px] font-normal opacity-60 mt-0.5", children: "\u00B110 pts \u00B7 no risk" })] }), _jsxs("button", { onClick: () => setMode("bet"), className: `flex-1 py-2.5 text-[13px] font-bold rounded-xl border transition-colors ${mode === "bet"
                                            ? "bg-warn/10 border-warn/50 text-warn"
                                            : "bg-card border-border text-white/40 hover:text-white"}`, children: ["Bet", _jsx("span", { className: "block text-[10px] font-normal opacity-60 mt-0.5", children: "winner takes all" })] })] }), mode === "bet" && (_jsxs("div", { className: "bg-card border border-warn/20 rounded-xl p-4 mb-4 animate-fade-in", children: [_jsxs("p", { className: "text-[11px] uppercase tracking-wider text-white/30 mb-3 font-bold", children: ["Bet Amount \u00B7 Your balance: ", userPoints, " pts"] }), _jsx("div", { className: "flex gap-2 flex-wrap", children: BET_OPTIONS.map((amt) => (_jsx("button", { onClick: () => setBetAmount(amt), disabled: userPoints < amt, className: `px-4 py-2 text-[13px] font-bold rounded-lg border transition-colors ${betAmount === amt
                                                ? "bg-warn/20 border-warn/60 text-warn"
                                                : userPoints < amt
                                                    ? "opacity-25 cursor-not-allowed bg-card border-border text-white/30"
                                                    : "bg-card border-border text-white/50 hover:text-white hover:border-border-bright"}`, children: amt }, amt))) }), !canBet && (_jsx("p", { className: "text-[11px] text-danger mt-3 font-mono", children: "Not enough points for this bet. Win more duels to earn points." }))] })), _jsx("button", { onClick: handleStart, disabled: mode === "bet" && !canBet, className: `w-full py-3 text-white font-bold text-[14px] rounded-xl transition-opacity disabled:opacity-40 disabled:cursor-not-allowed ${mode === "bet"
                                    ? "bg-warn hover:opacity-90"
                                    : "bg-accent hover:opacity-90"}`, children: mode === "bet" ? `Find Opponent · Bet ${betAmount} pts` : "Find Match" })] })), queued && (_jsxs("div", { className: "flex flex-col items-center gap-3.5 mt-9 w-full", children: [error && _jsx("p", { className: "text-danger text-[13px] font-mono", children: error }), !found ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "w-[360px] h-[3px] bg-border rounded-full overflow-hidden relative", children: _jsx("div", { className: "absolute inset-0 animate-barFill rounded-full", style: { background: "linear-gradient(90deg, #4f43b3, #7c6af7, #a78bfa)" } }) }), _jsxs("p", { className: "text-[12px] font-semibold tracking-[1.5px] uppercase text-white/40", children: ["Searching", [".", "..", "..."][Math.floor(waited / 2) % 3]] }), _jsx("p", { className: "text-[11px] font-mono text-white/20", children: formatWaited(waited) }), _jsxs("button", { onClick: handleCancel, className: "text-[12px] text-white/25 hover:text-danger transition-colors mt-1", children: ["Cancel", mode === "bet" ? " (refunds bet)" : ""] })] })) : (_jsxs("div", { className: "flex flex-col items-center gap-2.5", children: [_jsx("span", { className: "text-[44px] leading-none", children: "\u2694\uFE0F" }), _jsx("p", { className: "text-[22px] font-extrabold text-accent tracking-tight", children: "Match found!" }), _jsx("p", { className: "text-[13px] text-white/30", children: "Entering battle arena..." })] }))] })), _jsx("div", { className: "flex flex-wrap gap-2 justify-center mt-5", children: [
                            `ELO band ±${band}`,
                            `Problem ~${user?.cfRating ?? 1500}`,
                            mode === "bet" ? `Bet · ${betAmount} pts` : "Rated · Normal mode",
                        ].map((tag) => (_jsx("span", { className: "text-[10px] font-mono px-2.5 py-1 bg-elevated border border-border rounded-full text-white/25", children: tag }, tag))) })] })] }));
}
