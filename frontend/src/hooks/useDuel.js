import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
export function useDuel() {
    const { token } = useAuth();
    const [mmStatus, setMmStatus] = useState("idle");
    const [duelId, setDuelId] = useState(null);
    const [duel, setDuel] = useState(null);
    const [error, setError] = useState(null);
    const [waited, setWaited] = useState(0);
    const mmPollRef = useRef(null);
    const duelPollRef = useRef(null);
    const authHeader = { Authorization: `Bearer ${token}` };
    // ── Join queue ──────────────────────────────────────────────────────────────
    const joinQueue = useCallback(async (mode = "normal", betAmount = 0) => {
        setError(null);
        setMmStatus("queued");
        try {
            const res = await fetch(`${API}/matchmaking/join`, {
                method: "POST",
                headers: { ...authHeader, "Content-Type": "application/json" },
                body: JSON.stringify({ mode, betAmount }),
            });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data.message);
            if (data.status === "active_duel") {
                setDuelId(data.duelId);
                setMmStatus("matched");
                return true;
            }
            // Start polling matchmaking status
            startMmPolling();
            return true;
        }
        catch (err) {
            setError(err.message);
            setMmStatus("error");
            return false;
        }
    }, [token]);
    // ── Leave queue ─────────────────────────────────────────────────────────────
    const leaveQueue = useCallback(async () => {
        stopMmPolling();
        setMmStatus("idle");
        await fetch(`${API}/matchmaking/leave`, {
            method: "POST",
            headers: authHeader,
        });
    }, [token]);
    // ── Matchmaking poll every 3s ───────────────────────────────────────────────
    function startMmPolling() {
        if (mmPollRef.current)
            return;
        mmPollRef.current = setInterval(async () => {
            try {
                const res = await fetch(`${API}/matchmaking/status`, {
                    headers: authHeader,
                });
                const data = await res.json();
                if (data.status === "matched") {
                    stopMmPolling();
                    setDuelId(data.duelId);
                    setMmStatus("matched");
                }
                else if (data.status === "queued") {
                    setWaited(data.waited ?? 0);
                }
                else if (data.status === "not_queued") {
                    stopMmPolling();
                    setMmStatus("idle");
                }
            }
            catch {
                /* network blip — keep polling */
            }
        }, 3000);
    }
    function stopMmPolling() {
        if (mmPollRef.current) {
            clearInterval(mmPollRef.current);
            mmPollRef.current = null;
        }
    }
    // ── Duel poll every 2min ────────────────────────────────────────────────────
    useEffect(() => {
        if (!duelId)
            return;
        fetchDuelStatus();
        duelPollRef.current = setInterval(fetchDuelStatus, 5 * 1000);
        return () => {
            if (duelPollRef.current)
                clearInterval(duelPollRef.current);
        };
    }, [duelId]);
    async function fetchDuelStatus() {
        if (!duelId)
            return;
        try {
            const res = await fetch(`${API}/duel/${duelId}/status`, {
                headers: authHeader,
            });
            const data = await res.json();
            setDuel(data);
            if (data.status === "finished") {
                if (duelPollRef.current)
                    clearInterval(duelPollRef.current);
            }
        }
        catch {
            /* keep polling */
        }
    }
    async function checkActiveDuel() {
        try {
            const res = await fetch(`${API}/matchmaking/status`, {
                headers: authHeader,
            });
            const data = await res.json();
            if (data.status === "matched") {
                setDuelId(data.duelId);
                setMmStatus("matched");
            }
        }
        catch (err) {
            console.error(err);
        }
    }
    useEffect(() => {
        checkActiveDuel();
    }, []);
    // Cleanup on unmount
    useEffect(() => () => {
        stopMmPolling();
        if (duelPollRef.current)
            clearInterval(duelPollRef.current);
    }, []);
    return {
        mmStatus,
        duelId,
        duel,
        error,
        waited,
        joinQueue,
        leaveQueue,
        fetchDuelStatus,
        isQueued: mmStatus === "queued",
        isMatched: mmStatus === "matched",
    };
}
