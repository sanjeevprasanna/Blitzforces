import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import ProfileHero from "../components/profile/ProfileHero";
import RatingGraph from "../components/profile/RatingGraph";
import ActivityGrid from "../components/profile/ActivityGrid";
import StatCards from "../components/profile/StatCards";
import GameHistoryTable from "../components/profile/GameHistoryTable";
import BestWins from "../components/profile/BestWins";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useProfile } from "../hooks/useProfile";
import { useAuth } from "../context/AuthContext";
const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
function fillActivityGrid(raw) {
    const map = new Map(raw.map((d) => [d.date, d.count]));
    const days = [];
    const end = new Date();
    const start = new Date(end);
    start.setFullYear(start.getFullYear() - 1);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().slice(0, 10);
        days.push({ date: key, count: map.get(key) ?? 0 });
    }
    return days;
}
export default function ProfilePage() {
    const { handle } = useParams();
    const { user, token } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const { profile, loading, error, refetch } = useProfile(handle);
    const [friendAdded, setFriendAdded] = useState(false);
    const [addingFriend, setAddingFriend] = useState(false);
    const isOwnProfile = !handle || handle === user?.cfHandle;
    // Refetch profile when returning from game (after duel)
    useEffect(() => {
        if (isOwnProfile) {
            refetch();
        }
    }, [location.pathname]);
    useEffect(() => {
        if (location.state?.scrollToBottom) {
            window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
        }
    }, [location]);
    async function handleAddFriend() {
        if (!profile || !token)
            return;
        setAddingFriend(true);
        try {
            const res = await fetch(`${API}/friends/add`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ targetUserId: profile.id }),
            });
            if (res.ok)
                setFriendAdded(true);
        }
        catch {
            // ignore
        }
        finally {
            setAddingFriend(false);
        }
    }
    if (loading) {
        return (_jsxs("div", { className: "flex flex-col min-h-screen bg-base font-syne", children: [_jsx(Navbar, {}), _jsxs("div", { className: "flex flex-1 overflow-hidden", children: [_jsx(Sidebar, {}), _jsx("main", { className: "flex-1 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "inline-block w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin mb-4" }), _jsx("p", { className: "text-white/40 text-[14px] font-mono", children: "Loading profile..." })] }) })] })] }));
    }
    if (error || !profile) {
        return (_jsxs("div", { className: "flex flex-col min-h-screen bg-base font-syne", children: [_jsx(Navbar, {}), _jsxs("div", { className: "flex flex-1 overflow-hidden", children: [_jsx(Sidebar, {}), _jsx("main", { className: "flex-1 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-16 h-16 mx-auto mb-4 rounded-full bg-danger/10 flex items-center justify-center", children: _jsxs("svg", { width: "32", height: "32", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", className: "text-danger", children: [_jsx("circle", { cx: "12", cy: "12", r: "10" }), _jsx("line", { x1: "15", y1: "9", x2: "9", y2: "15" }), _jsx("line", { x1: "9", y1: "9", x2: "15", y2: "15" })] }) }), _jsx("p", { className: "text-danger text-[14px] font-semibold mb-1", children: "Failed to load profile" }), _jsx("p", { className: "text-white/30 text-[12px] font-mono", children: error ?? "Profile not found" })] }) })] })] }));
    }
    const profileStats = {
        handle: profile.handle,
        displayName: profile.handle,
        email: profile.email,
        country: "",
        countryFlag: "",
        joinedDate: profile.joinedDate,
        cfHandle: profile.cfHandle,
        rating: profile.blitzforcePoints,
        maxRating: profile.blitzforcePoints,
        rank: profile.cfTier,
        gamesPlayed: profile.gamesPlayed,
        gamesWon: profile.gamesWon,
        gamesLost: profile.gamesLost,
        winStreak: profile.winStreak,
        maxWinStreak: profile.winStreak,
        bestTime: "—",
        bestRank: 1,
        totalBets: profile.totalBets,
        betsWon: profile.betsWon,
        betsLost: profile.betsLost,
        ratingHistory: profile.ratingHistory,
        activityGrid: fillActivityGrid(profile.activityGrid),
        bestWins: profile.bestWins,
    };
    return (_jsxs("div", { className: "flex flex-col min-h-screen bg-base font-syne", children: [_jsx(Navbar, {}), _jsxs("div", { className: "flex flex-1 overflow-hidden", children: [_jsx(Sidebar, {}), _jsxs("main", { className: "flex-1 overflow-y-auto", children: [_jsx(ProfileHero, { profile: profileStats }), !isOwnProfile && (_jsx("div", { className: "max-w-[1400px] mx-auto px-8 pt-4 flex justify-end animate-fade-in", children: _jsx("button", { onClick: handleAddFriend, disabled: friendAdded || addingFriend, className: "px-5 py-2.5 bg-success/10 border border-success/30 text-success text-[13px] font-bold rounded-xl hover:bg-success hover:text-white disabled:opacity-60 disabled:cursor-not-allowed transition-colors", children: friendAdded
                                        ? "✓ Friend Added"
                                        : addingFriend
                                            ? "Adding..."
                                            : "+ Add Friend" }) })), _jsxs("div", { className: "max-w-[1400px] mx-auto px-8 py-8 animate-fade-in", children: [_jsx("div", { className: "mb-6 animate-fade-in-up", children: _jsx(StatCards, { profile: profileStats }) }), _jsxs("div", { className: "grid grid-cols-2 gap-6 mb-6 animate-fade-in-up delay-100", children: [_jsx("div", { children: profile.ratingHistory.length > 0 ? (_jsx(RatingGraph, { history: profileStats.ratingHistory })) : (_jsx("div", { className: "bg-card border border-border rounded-2xl p-8 h-full flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center", children: _jsx("svg", { width: "28", height: "28", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", className: "text-accent/40", children: _jsx("polyline", { points: "22 12 18 12 15 21 9 3 6 12 2 12" }) }) }), _jsx("p", { className: "text-white/30 text-[13px] font-semibold mb-1", children: "No rating history yet" }), _jsx("p", { className: "text-white/20 text-[12px] font-mono", children: "Play your first duel to see your graph" })] }) })) }), _jsx("div", { children: profile.bestWins.length > 0 ? (_jsx(BestWins, { wins: profileStats.bestWins })) : (_jsx("div", { className: "bg-card border border-border rounded-2xl p-8 h-full flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-16 h-16 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center", children: _jsxs("svg", { width: "28", height: "28", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", className: "text-success/40", children: [_jsx("path", { d: "M6 9H4.5a2.5 2.5 0 0 1 0-5H6" }), _jsx("path", { d: "M18 9h1.5a2.5 2.5 0 0 0 0-5H18" }), _jsx("path", { d: "M4 22h16" }), _jsx("path", { d: "M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" }), _jsx("path", { d: "M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" }), _jsx("path", { d: "M18 2H6v7a6 6 0 0 0 12 0V2z" })] }) }), _jsx("p", { className: "text-white/30 text-[13px] font-semibold mb-1", children: "No best wins yet" }), _jsx("p", { className: "text-white/20 text-[12px] font-mono", children: "Win duels to see your achievements" })] }) })) })] }), _jsx("div", { className: "mb-6 animate-fade-in-up delay-200", children: _jsx(ActivityGrid, { days: profileStats.activityGrid }) }), _jsx("div", { className: "animate-fade-in-up delay-300", children: profile.gameHistory.length > 0 ? (_jsx(GameHistoryTable, { entries: profile.gameHistory })) : (_jsx("div", { className: "bg-card border border-border rounded-2xl p-12", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-20 h-20 mx-auto mb-4 rounded-full bg-info/10 flex items-center justify-center", children: _jsxs("svg", { width: "36", height: "36", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", className: "text-info/40", children: [_jsx("rect", { x: "2", y: "6", width: "20", height: "12", rx: "2" }), _jsx("path", { d: "M12 12h.01" }), _jsx("path", { d: "M7 12h.01" }), _jsx("path", { d: "M17 12h.01" })] }) }), _jsx("p", { className: "text-white/35 text-[15px] font-semibold mb-2", children: "No game history yet" }), _jsx("p", { className: "text-white/25 text-[13px] font-mono mb-6", children: isOwnProfile
                                                            ? "Your completed duels will appear here"
                                                            : "No completed duels yet" }), isOwnProfile && (_jsx("button", { onClick: () => navigate("/game"), className: "px-6 py-3 bg-accent hover:bg-accent-dim text-white text-[13px] font-bold rounded-lg transition-colors", children: "Play your first duel \u2192" }))] }) })) })] })] })] })] }));
}
