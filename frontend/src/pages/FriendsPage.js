import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import { useAuth } from "../context/AuthContext";
import { getRatingColor } from "../utils/rating";
const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
function StatPill({ label, value, color, }) {
    return (_jsxs("div", { className: "flex flex-col items-center gap-0.5", children: [_jsx("span", { className: "text-[14px] font-bold font-mono", style: color ? { color } : {}, children: value }), _jsx("span", { className: "text-[10px] uppercase tracking-wider text-white/25", children: label })] }));
}
function FriendCard({ friend, isAdded, onAdd, onDuel, onViewProfile, }) {
    const ratingColor = getRatingColor(friend.cf_rating);
    const initials = friend.cf_handle.slice(0, 2).toUpperCase();
    return (_jsxs("div", { className: "bg-card border border-border rounded-2xl p-5 flex flex-col gap-4 hover:border-border-bright transition-colors group", children: [_jsxs("div", { className: "flex items-start gap-3.5", children: [_jsxs("div", { className: "relative flex-shrink-0", children: [_jsx("div", { className: "w-12 h-12 rounded-full flex items-center justify-center text-[14px] font-bold", style: { background: ratingColor + "22", color: ratingColor }, children: initials }), _jsx("span", { className: "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card", style: {
                                    background: friend.online ? "#4ade80" : "#2a2a38",
                                } })] }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "flex items-center gap-2 flex-wrap", children: _jsx("span", { className: "text-[14px] font-bold text-white", children: friend.cf_handle }) }), _jsxs("p", { className: "text-[12px] mt-0.5", style: { color: ratingColor }, children: ["Rating: ", friend.cf_rating] }), _jsx("p", { className: "text-[11px] text-white/25 mt-0.5", children: friend.online ? (_jsx("span", { className: "text-success font-semibold", children: "Online" })) : ("Offline") })] })] }), _jsx("div", { className: "h-px bg-border" }), _jsx("div", { className: "flex items-center justify-around", children: _jsx(StatPill, { label: "Points", value: `${friend.blitzforce_points}` }) }), _jsx("div", { className: "flex gap-2", children: isAdded ? (_jsxs(_Fragment, { children: [_jsx("button", { onClick: () => onDuel(), disabled: !friend.online, className: "flex-1 py-2 text-[12px] font-bold text-accent border border-accent/30 bg-accent/5 rounded-lg hover:bg-accent hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors", children: "\u2694 Duel" }), _jsx("button", { onClick: () => onViewProfile(friend.cf_handle), className: "flex-1 py-2 text-[12px] font-semibold text-white/40 border border-border rounded-lg hover:text-white hover:border-border-bright transition-colors", children: "View profile" })] })) : (_jsx("button", { onClick: () => onAdd(friend.id), className: "w-full py-2 text-[12px] font-bold text-success border border-success/30 bg-success/5 rounded-lg hover:bg-success hover:text-white transition-colors", children: "+ Add friend" })) })] }));
}
export default function FriendsPage() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [tab, setTab] = useState("friends");
    const [search, setSearch] = useState("");
    const [friends, setFriends] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const authHeader = { Authorization: `Bearer ${token}` };
    // Load friends
    useEffect(() => {
        loadFriends();
    }, []);
    async function loadFriends() {
        try {
            const res = await fetch(`${API}/friends/list`, { headers: authHeader });
            const data = await res.json();
            setFriends(data.friends || []);
        }
        catch (err) {
            console.error("Failed to load friends:", err);
        }
    }
    // Search for users
    async function handleSearch() {
        if (!search.trim()) {
            setSearchResults([]);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API}/user/search?q=${encodeURIComponent(search)}`, { headers: authHeader });
            const data = await res.json();
            const friendIds = new Set(friends.map((f) => f.id));
            setSearchResults((data.users || []).filter((u) => !friendIds.has(u.id)));
        }
        catch (err) {
            console.error("Search failed:", err);
        }
        finally {
            setLoading(false);
        }
    }
    async function addFriend(friendId) {
        try {
            const res = await fetch(`${API}/friends/request`, {
                method: "POST",
                headers: { ...authHeader, "Content-Type": "application/json" },
                body: JSON.stringify({ targetUserId: friendId }),
            });
            if (res.ok) {
                loadFriends();
                setSearch("");
                setSearchResults([]);
            }
        }
        catch (err) {
            console.error("Failed to add friend:", err);
        }
    }
    async function startDuel() {
        try {
            await fetch(`${API}/matchmaking/join`, {
                method: "POST",
                headers: authHeader,
            });
            navigate("/game");
        }
        catch (err) {
            console.error("Failed to start duel:", err);
        }
    }
    const onlineCount = friends.filter((f) => f.online).length;
    return (_jsxs("div", { className: "flex flex-col min-h-screen bg-base font-syne", children: [_jsx(Navbar, {}), _jsx("main", { className: "flex-1 overflow-y-auto", children: _jsxs("div", { className: "max-w-[1200px] mx-auto px-6 py-8 animate-fade-in", children: [_jsx("div", { className: "flex items-end justify-between mb-8 animate-fade-in-up", children: _jsxs("div", { children: [_jsx("h1", { className: "text-[28px] font-extrabold tracking-tight text-white", children: "Friends" }), _jsxs("p", { className: "text-[14px] text-white/40 mt-1 font-mono", children: [friends.length, " friends \u00B7 ", onlineCount, " online"] })] }) }), _jsx("div", { className: "flex gap-2 mb-6", children: ["friends", "search"].map((t) => (_jsx("button", { onClick: () => setTab(t), className: `px-4 py-2 text-[13px] font-bold rounded-lg transition-colors ${tab === t
                                    ? "bg-accent text-white"
                                    : "bg-card border border-border text-white/50 hover:text-white"}`, children: t === "friends" ? "My Friends" : "Find Friends" }, t))) }), tab === "search" && (_jsxs("div", { className: "mb-8 animate-fade-in-up", children: [_jsxs("div", { className: "flex gap-2 mb-4", children: [_jsxs("div", { className: "relative flex-1", children: [_jsxs("svg", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-white/25", width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("circle", { cx: "11", cy: "11", r: "8" }), _jsx("line", { x1: "21", y1: "21", x2: "16.65", y2: "16.65" })] }), _jsx("input", { type: "text", value: search, onChange: (e) => setSearch(e.target.value), placeholder: "Search by handle...", className: "w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-accent transition-colors" })] }), _jsx("button", { onClick: handleSearch, className: "px-6 py-2.5 bg-accent text-white text-[13px] font-bold rounded-xl hover:opacity-90 transition-opacity", children: "Search" })] }), searchResults.length > 0 && (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4", children: searchResults.map((user) => (_jsx(FriendCard, { friend: user, isAdded: false, onAdd: addFriend, onDuel: () => startDuel(), onViewProfile: () => navigate(`/profile/${user.cf_handle}`) }, user.id))) })), search.trim() && searchResults.length === 0 && !loading && (_jsxs("div", { className: "flex flex-col items-center justify-center py-12 text-white/20", children: [_jsx("span", { className: "text-[40px] mb-3", children: "\uD83D\uDD0D" }), _jsx("p", { className: "text-[14px]", children: "No users found" })] })), loading && (_jsx("div", { className: "flex justify-center py-12", children: _jsx("p", { className: "text-white/40", children: "Searching..." }) }))] })), tab === "friends" && (_jsx("div", { children: friends.length === 0 ? (_jsxs("div", { className: "flex flex-col items-center justify-center py-24 text-white/20", children: [_jsx("span", { className: "text-[40px] mb-3", children: "\uD83D\uDC65" }), _jsx("p", { className: "text-[15px] font-semibold", children: "No friends yet" }), _jsx("p", { className: "text-[13px] mt-1", children: "Search and add friends to duel" })] })) : (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4", children: friends.map((friend) => (_jsx(FriendCard, { friend: friend, isAdded: true, onAdd: addFriend, onDuel: () => startDuel(), onViewProfile: () => navigate(`/profile/${friend.cf_handle}`) }, friend.id))) })) }))] }) })] }));
}
