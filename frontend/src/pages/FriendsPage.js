import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import { useAuth } from "../context/AuthContext";
import { getRatingColor } from "../utils/rating";
const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
function StatPill({ label, value, color }) {
    return (_jsxs("div", { className: "flex flex-col items-center gap-0.5", children: [_jsx("span", { className: "text-[14px] font-bold font-mono", style: color ? { color } : {}, children: value }), _jsx("span", { className: "text-[10px] uppercase tracking-wider text-white/25", children: label })] }));
}
function UserAvatar({ handle, rating }) {
    const color = getRatingColor(rating);
    const initials = handle.slice(0, 2).toUpperCase();
    return (_jsx("div", { className: "w-12 h-12 rounded-full flex items-center justify-center text-[14px] font-bold flex-shrink-0", style: { background: color + "22", color }, children: initials }));
}
function FriendCard({ friend, onRemove, onDuel, onViewProfile, }) {
    const ratingColor = getRatingColor(friend.cf_rating);
    return (_jsxs("div", { className: "bg-card border border-border rounded-2xl p-5 flex flex-col gap-4 hover:border-border-bright transition-colors", children: [_jsxs("div", { className: "flex items-start gap-3.5", children: [_jsxs("div", { className: "relative", children: [_jsx(UserAvatar, { handle: friend.cf_handle, rating: friend.cf_rating }), _jsx("span", { className: "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card", style: { background: friend.online ? "#4ade80" : "#2a2a38" } })] }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-[14px] font-bold text-white truncate", children: friend.cf_handle }), _jsxs("p", { className: "text-[12px] mt-0.5", style: { color: ratingColor }, children: ["CF ", friend.cf_rating] }), _jsx("p", { className: "text-[11px] mt-0.5", children: friend.online ? (_jsx("span", { className: "text-success font-semibold", children: "Online" })) : (_jsx("span", { className: "text-white/30", children: "Offline" })) })] })] }), _jsx("div", { className: "h-px bg-border" }), _jsx("div", { className: "flex items-center justify-around", children: _jsx(StatPill, { label: "Points", value: `${friend.blitzforce_points}` }) }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => onDuel(friend.id), disabled: !friend.online, className: "flex-1 py-2 text-[12px] font-bold text-accent border border-accent/30 bg-accent/5 rounded-lg hover:bg-accent hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors", children: "\u2694 Duel" }), _jsx("button", { onClick: () => onViewProfile(friend.cf_handle), className: "flex-1 py-2 text-[12px] font-semibold text-white/40 border border-border rounded-lg hover:text-white hover:border-border-bright transition-colors", children: "Profile" }), _jsx("button", { onClick: () => onRemove(friend.id), className: "py-2 px-3 text-[12px] text-danger/60 border border-border rounded-lg hover:text-danger hover:border-danger/30 transition-colors", title: "Remove friend", children: "\u2715" })] })] }));
}
function RequestCard({ request, onAccept, onDecline, onViewProfile, }) {
    const ratingColor = getRatingColor(request.cf_rating);
    const timeAgo = (() => {
        const diff = Date.now() - new Date(request.requested_at).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60)
            return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24)
            return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    })();
    return (_jsxs("div", { className: "bg-card border border-accent/20 rounded-2xl p-5 flex flex-col gap-4 animate-fade-in-up", children: [_jsxs("div", { className: "flex items-center gap-3.5", children: [_jsx(UserAvatar, { handle: request.cf_handle, rating: request.cf_rating }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-[14px] font-bold text-white truncate", children: request.cf_handle }), _jsxs("p", { className: "text-[12px] mt-0.5", style: { color: ratingColor }, children: ["CF ", request.cf_rating] }), _jsx("p", { className: "text-[11px] text-white/30 mt-0.5", children: timeAgo })] }), _jsx("button", { onClick: () => onViewProfile(request.cf_handle), className: "text-[11px] text-white/30 hover:text-white transition-colors", children: "Profile" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => onAccept(request.id), className: "flex-1 py-2.5 text-[13px] font-bold text-white bg-success/80 hover:bg-success rounded-xl transition-colors", children: "Accept" }), _jsx("button", { onClick: () => onDecline(request.id), className: "flex-1 py-2.5 text-[13px] font-semibold text-white/50 border border-border hover:border-danger/40 hover:text-danger rounded-xl transition-colors", children: "Decline" })] })] }));
}
function SearchResultCard({ user, status, onAdd, onViewProfile, }) {
    const ratingColor = getRatingColor(user.cf_rating);
    return (_jsxs("div", { className: "bg-card border border-border rounded-2xl p-5 flex flex-col gap-4 hover:border-border-bright transition-colors", children: [_jsxs("div", { className: "flex items-center gap-3.5", children: [_jsx(UserAvatar, { handle: user.cf_handle, rating: user.cf_rating }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-[14px] font-bold text-white truncate", children: user.cf_handle }), _jsxs("p", { className: "text-[12px] mt-0.5", style: { color: ratingColor }, children: ["CF ", user.cf_rating] }), _jsxs("p", { className: "text-[11px] text-white/25 mt-0.5", children: [user.blitzforce_points, " pts"] })] })] }), _jsx("div", { className: "flex gap-2", children: status === "friend" ? (_jsx("button", { disabled: true, className: "w-full py-2 text-[12px] font-semibold text-white/30 border border-border rounded-lg cursor-default", children: "\u2713 Already friends" })) : status === "pending" ? (_jsx("button", { disabled: true, className: "w-full py-2 text-[12px] font-semibold text-accent/50 border border-accent/20 bg-accent/5 rounded-lg cursor-default", children: "Request sent" })) : (_jsxs(_Fragment, { children: [_jsx("button", { onClick: () => onAdd(user.id), className: "flex-1 py-2 text-[12px] font-bold text-success border border-success/30 bg-success/5 rounded-lg hover:bg-success hover:text-white transition-colors", children: "+ Add Friend" }), _jsx("button", { onClick: () => onViewProfile(user.cf_handle), className: "flex-1 py-2 text-[12px] font-semibold text-white/40 border border-border rounded-lg hover:text-white hover:border-border-bright transition-colors", children: "Profile" })] })) })] }));
}
export default function FriendsPage() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [tab, setTab] = useState("friends");
    const [search, setSearch] = useState("");
    const [friends, setFriends] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const authHeader = { Authorization: `Bearer ${token}` };
    const loadFriends = useCallback(async () => {
        try {
            const res = await fetch(`${API}/friends/list`, { headers: authHeader });
            const data = await res.json();
            setFriends(data.friends ?? []);
        }
        catch (err) {
            console.error("Failed to load friends:", err);
        }
    }, [token]);
    const loadPending = useCallback(async () => {
        try {
            const res = await fetch(`${API}/friends/pending`, { headers: authHeader });
            const data = await res.json();
            setPendingRequests(data.requests ?? []);
        }
        catch (err) {
            console.error("Failed to load pending requests:", err);
        }
    }, [token]);
    useEffect(() => {
        loadFriends();
        loadPending();
    }, [loadFriends, loadPending]);
    async function handleSearch() {
        if (!search.trim()) {
            setSearchResults([]);
            return;
        }
        setSearchLoading(true);
        try {
            const res = await fetch(`${API}/user/search?q=${encodeURIComponent(search)}`, { headers: authHeader });
            const data = await res.json();
            setSearchResults(data.users ?? []);
        }
        catch (err) {
            console.error("Search failed:", err);
        }
        finally {
            setSearchLoading(false);
        }
    }
    async function handleAdd(targetId) {
        try {
            const res = await fetch(`${API}/friends/add`, {
                method: "POST",
                headers: { ...authHeader, "Content-Type": "application/json" },
                body: JSON.stringify({ targetUserId: targetId }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message ?? "Failed to add friend");
            }
            // Instant mutual friendship — optimistically add to friends list so
            // button changes to "Already friends" without waiting for server reload
            const added = searchResults.find((u) => u.id === targetId);
            if (added)
                setFriends((prev) => [...prev, added]);
            // Refresh from server in background to confirm
            loadFriends();
        }
        catch (err) {
            console.error("Failed to add friend:", err);
        }
    }
    async function handleAccept(requesterId) {
        try {
            const res = await fetch(`${API}/friends/accept/${requesterId}`, {
                method: "POST",
                headers: authHeader,
            });
            if (res.ok) {
                await Promise.all([loadFriends(), loadPending()]);
                // Switch to friends tab if no more requests
                if (pendingRequests.length <= 1)
                    setTab("friends");
            }
        }
        catch (err) {
            console.error("Failed to accept:", err);
        }
    }
    async function handleDecline(requesterId) {
        try {
            await fetch(`${API}/friends/decline/${requesterId}`, {
                method: "DELETE",
                headers: authHeader,
            });
            setPendingRequests((prev) => prev.filter((r) => r.id !== requesterId));
        }
        catch (err) {
            console.error("Failed to decline:", err);
        }
    }
    async function handleRemove(friendId) {
        try {
            await fetch(`${API}/friends/${friendId}`, {
                method: "DELETE",
                headers: authHeader,
            });
            setFriends((prev) => prev.filter((f) => f.id !== friendId));
        }
        catch (err) {
            console.error("Failed to remove:", err);
        }
    }
    async function handleDuel(_friendId) {
        try {
            await fetch(`${API}/matchmaking/join`, { method: "POST", headers: authHeader });
            navigate("/game");
        }
        catch (err) {
            console.error("Failed to start duel:", err);
        }
    }
    const friendIds = new Set(friends.map((f) => f.id));
    const onlineCount = friends.filter((f) => f.online).length;
    function getSearchStatus(userId) {
        if (friendIds.has(userId))
            return "friend";
        return "none";
    }
    return (_jsxs("div", { className: "flex flex-col min-h-screen bg-base font-syne", children: [_jsx(Navbar, {}), _jsx("main", { className: "flex-1 overflow-y-auto", children: _jsxs("div", { className: "max-w-[1200px] mx-auto px-6 py-8 animate-fade-in", children: [_jsx("div", { className: "flex items-end justify-between mb-8 animate-fade-in-up", children: _jsxs("div", { children: [_jsx("h1", { className: "text-[28px] font-extrabold tracking-tight text-white", children: "Friends" }), _jsxs("p", { className: "text-[14px] text-white/40 mt-1 font-mono", children: [friends.length, " friends \u00B7 ", onlineCount, " online"] })] }) }), _jsx("div", { className: "flex gap-2 mb-6", children: ["friends", "requests", "search"].map((t) => (_jsxs("button", { onClick: () => setTab(t), className: `relative px-4 py-2 text-[13px] font-bold rounded-lg transition-colors ${tab === t
                                    ? "bg-accent text-white"
                                    : "bg-card border border-border text-white/50 hover:text-white"}`, children: [t === "friends" && "My Friends", t === "requests" && "Requests", t === "search" && "Find Friends", t === "requests" && pendingRequests.length > 0 && (_jsx("span", { className: "absolute -top-1.5 -right-1.5 w-5 h-5 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center", children: pendingRequests.length }))] }, t))) }), tab === "friends" && (_jsx("div", { className: "animate-fade-in", children: friends.length === 0 ? (_jsxs("div", { className: "flex flex-col items-center justify-center py-24 text-white/20", children: [_jsx("span", { className: "text-[40px] mb-3", children: "\uD83D\uDC65" }), _jsx("p", { className: "text-[15px] font-semibold", children: "No friends yet" }), _jsx("p", { className: "text-[13px] mt-1", children: "Use Find Friends to search and add" })] })) : (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4", children: friends.map((friend) => (_jsx(FriendCard, { friend: friend, onRemove: handleRemove, onDuel: handleDuel, onViewProfile: (handle) => navigate(`/profile/${handle}`) }, friend.id))) })) })), tab === "requests" && (_jsx("div", { className: "animate-fade-in", children: pendingRequests.length === 0 ? (_jsxs("div", { className: "flex flex-col items-center justify-center py-24 text-white/20", children: [_jsx("span", { className: "text-[40px] mb-3", children: "\uD83D\uDCEC" }), _jsx("p", { className: "text-[15px] font-semibold", children: "No pending requests" }), _jsx("p", { className: "text-[13px] mt-1", children: "When someone sends you a friend request it appears here" })] })) : (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4", children: pendingRequests.map((req) => (_jsx(RequestCard, { request: req, onAccept: handleAccept, onDecline: handleDecline, onViewProfile: (handle) => navigate(`/profile/${handle}`) }, req.id))) })) })), tab === "search" && (_jsxs("div", { className: "animate-fade-in", children: [_jsxs("div", { className: "flex gap-2 mb-6", children: [_jsxs("div", { className: "relative flex-1", children: [_jsxs("svg", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-white/25", width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("circle", { cx: "11", cy: "11", r: "8" }), _jsx("line", { x1: "21", y1: "21", x2: "16.65", y2: "16.65" })] }), _jsx("input", { type: "text", value: search, onChange: (e) => setSearch(e.target.value), onKeyDown: (e) => e.key === "Enter" && handleSearch(), placeholder: "Search by Codeforces handle...", className: "w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-accent transition-colors" })] }), _jsx("button", { onClick: handleSearch, className: "px-6 py-2.5 bg-accent text-white text-[13px] font-bold rounded-xl hover:opacity-90 transition-opacity", children: "Search" })] }), searchLoading && (_jsx("div", { className: "flex justify-center py-12", children: _jsx("div", { className: "w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" }) })), !searchLoading && searchResults.length > 0 && (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4", children: searchResults.map((user) => (_jsx(SearchResultCard, { user: user, status: getSearchStatus(user.id), onAdd: handleAdd, onViewProfile: (handle) => navigate(`/profile/${handle}`) }, user.id))) })), !searchLoading && search.trim() && searchResults.length === 0 && (_jsxs("div", { className: "flex flex-col items-center justify-center py-12 text-white/20", children: [_jsx("span", { className: "text-[40px] mb-3", children: "\uD83D\uDD0D" }), _jsxs("p", { className: "text-[14px]", children: ["No users found for \"", search, "\""] })] })), !search.trim() && !searchLoading && searchResults.length === 0 && (_jsxs("div", { className: "flex flex-col items-center justify-center py-16 text-white/15", children: [_jsx("span", { className: "text-[48px] mb-3", children: "\uD83D\uDD0E" }), _jsx("p", { className: "text-[14px]", children: "Search by Codeforces handle" })] }))] }))] }) })] }));
}
