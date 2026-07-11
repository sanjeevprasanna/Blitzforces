import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import { useAuth } from "../context/AuthContext";
import { getRatingColor } from "../utils/rating";

interface Friend {
  id: number;
  cf_handle: string;
  cf_rating: number;
  blitzforce_points: number;
  online?: boolean;
}

interface PendingRequest {
  id: number;
  cf_handle: string;
  cf_rating: number;
  blitzforce_points: number;
  requested_at: string;
}

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

function StatPill({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[14px] font-bold font-mono" style={color ? { color } : {}}>
        {value}
      </span>
      <span className="text-[10px] uppercase tracking-wider text-white/25">{label}</span>
    </div>
  );
}

function UserAvatar({ handle, rating }: { handle: string; rating: number }) {
  const color = getRatingColor(rating);
  const initials = handle.slice(0, 2).toUpperCase();
  return (
    <div
      className="w-12 h-12 rounded-full flex items-center justify-center text-[14px] font-bold flex-shrink-0"
      style={{ background: color + "22", color }}
    >
      {initials}
    </div>
  );
}

function FriendCard({
  friend,
  onRemove,
  onDuel,
  onViewProfile,
}: {
  friend: Friend;
  onRemove: (id: number) => void;
  onDuel: (id: number) => void;
  onViewProfile: (handle: string) => void;
}) {
  const ratingColor = getRatingColor(friend.cf_rating);

  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4 hover:border-border-bright transition-colors">
      <div className="flex items-start gap-3.5">
        <div className="relative">
          <UserAvatar handle={friend.cf_handle} rating={friend.cf_rating} />
          <span
            className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card"
            style={{ background: friend.online ? "#4ade80" : "#2a2a38" }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold text-white truncate">{friend.cf_handle}</p>
          <p className="text-[12px] mt-0.5" style={{ color: ratingColor }}>
            CF {friend.cf_rating}
          </p>
          <p className="text-[11px] mt-0.5">
            {friend.online ? (
              <span className="text-success font-semibold">Online</span>
            ) : (
              <span className="text-white/30">Offline</span>
            )}
          </p>
        </div>
      </div>

      <div className="h-px bg-border" />

      <div className="flex items-center justify-around">
        <StatPill label="Points" value={`${friend.blitzforce_points}`} />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onDuel(friend.id)}
          disabled={!friend.online}
          className="flex-1 py-2 text-[12px] font-bold text-accent border border-accent/30 bg-accent/5 rounded-lg hover:bg-accent hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ⚔ Duel
        </button>
        <button
          onClick={() => onViewProfile(friend.cf_handle)}
          className="flex-1 py-2 text-[12px] font-semibold text-white/40 border border-border rounded-lg hover:text-white hover:border-border-bright transition-colors"
        >
          Profile
        </button>
        <button
          onClick={() => onRemove(friend.id)}
          className="py-2 px-3 text-[12px] text-danger/60 border border-border rounded-lg hover:text-danger hover:border-danger/30 transition-colors"
          title="Remove friend"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function RequestCard({
  request,
  onAccept,
  onDecline,
  onViewProfile,
}: {
  request: PendingRequest;
  onAccept: (id: number) => void;
  onDecline: (id: number) => void;
  onViewProfile: (handle: string) => void;
}) {
  const ratingColor = getRatingColor(request.cf_rating);
  const timeAgo = (() => {
    const diff = Date.now() - new Date(request.requested_at).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  })();

  return (
    <div className="bg-card border border-accent/20 rounded-2xl p-5 flex flex-col gap-4 animate-fade-in-up">
      <div className="flex items-center gap-3.5">
        <UserAvatar handle={request.cf_handle} rating={request.cf_rating} />
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold text-white truncate">{request.cf_handle}</p>
          <p className="text-[12px] mt-0.5" style={{ color: ratingColor }}>
            CF {request.cf_rating}
          </p>
          <p className="text-[11px] text-white/30 mt-0.5">{timeAgo}</p>
        </div>
        <button
          onClick={() => onViewProfile(request.cf_handle)}
          className="text-[11px] text-white/30 hover:text-white transition-colors"
        >
          Profile
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onAccept(request.id)}
          className="flex-1 py-2.5 text-[13px] font-bold text-white bg-success/80 hover:bg-success rounded-xl transition-colors"
        >
          Accept
        </button>
        <button
          onClick={() => onDecline(request.id)}
          className="flex-1 py-2.5 text-[13px] font-semibold text-white/50 border border-border hover:border-danger/40 hover:text-danger rounded-xl transition-colors"
        >
          Decline
        </button>
      </div>
    </div>
  );
}

function SearchResultCard({
  user,
  status,
  onAdd,
  onViewProfile,
}: {
  user: Friend;
  status: "none" | "friend" | "pending";
  onAdd: (id: number) => void;
  onViewProfile: (handle: string) => void;
}) {
  const ratingColor = getRatingColor(user.cf_rating);

  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4 hover:border-border-bright transition-colors">
      <div className="flex items-center gap-3.5">
        <UserAvatar handle={user.cf_handle} rating={user.cf_rating} />
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold text-white truncate">{user.cf_handle}</p>
          <p className="text-[12px] mt-0.5" style={{ color: ratingColor }}>
            CF {user.cf_rating}
          </p>
          <p className="text-[11px] text-white/25 mt-0.5">{user.blitzforce_points} pts</p>
        </div>
      </div>
      <div className="flex gap-2">
        {status === "friend" ? (
          <button
            disabled
            className="w-full py-2 text-[12px] font-semibold text-white/30 border border-border rounded-lg cursor-default"
          >
            ✓ Already friends
          </button>
        ) : status === "pending" ? (
          <button
            disabled
            className="w-full py-2 text-[12px] font-semibold text-accent/50 border border-accent/20 bg-accent/5 rounded-lg cursor-default"
          >
            Request sent
          </button>
        ) : (
          <>
            <button
              onClick={() => onAdd(user.id)}
              className="flex-1 py-2 text-[12px] font-bold text-success border border-success/30 bg-success/5 rounded-lg hover:bg-success hover:text-white transition-colors"
            >
              + Add Friend
            </button>
            <button
              onClick={() => onViewProfile(user.cf_handle)}
              className="flex-1 py-2 text-[12px] font-semibold text-white/40 border border-border rounded-lg hover:text-white hover:border-border-bright transition-colors"
            >
              Profile
            </button>
          </>
        )}
      </div>
    </div>
  );
}

type Tab = "friends" | "requests" | "search";

export default function FriendsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("friends");
  const [search, setSearch] = useState("");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [sentIds, setSentIds] = useState<Set<number>>(new Set());
  const [searchLoading, setSearchLoading] = useState(false);

  const authHeader = { Authorization: `Bearer ${token}` };

  const loadFriends = useCallback(async () => {
    try {
      const res = await fetch(`${API}/friends/list`, { headers: authHeader });
      const data = await res.json();
      setFriends(data.friends ?? []);
    } catch (err) {
      console.error("Failed to load friends:", err);
    }
  }, [token]);

  const loadPending = useCallback(async () => {
    try {
      const res = await fetch(`${API}/friends/pending`, { headers: authHeader });
      const data = await res.json();
      setPendingRequests(data.requests ?? []);
    } catch (err) {
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
      const res = await fetch(
        `${API}/user/search?q=${encodeURIComponent(search)}`,
        { headers: authHeader }
      );
      const data = await res.json();
      setSearchResults(data.users ?? []);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setSearchLoading(false);
    }
  }

  async function handleAdd(targetId: number) {
    try {
      const res = await fetch(`${API}/friends/add`, {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: targetId }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.status === "accepted") {
          await loadFriends();
          setTab("friends");
        } else {
          // Mark as sent so button shows "Request sent"
          setSentIds((prev) => new Set(prev).add(targetId));
        }
      }
    } catch (err) {
      console.error("Failed to add friend:", err);
    }
  }

  async function handleAccept(requesterId: number) {
    try {
      const res = await fetch(`${API}/friends/accept/${requesterId}`, {
        method: "POST",
        headers: authHeader,
      });
      if (res.ok) {
        await Promise.all([loadFriends(), loadPending()]);
        // Switch to friends tab if no more requests
        if (pendingRequests.length <= 1) setTab("friends");
      }
    } catch (err) {
      console.error("Failed to accept:", err);
    }
  }

  async function handleDecline(requesterId: number) {
    try {
      await fetch(`${API}/friends/decline/${requesterId}`, {
        method: "DELETE",
        headers: authHeader,
      });
      setPendingRequests((prev) => prev.filter((r) => r.id !== requesterId));
    } catch (err) {
      console.error("Failed to decline:", err);
    }
  }

  async function handleRemove(friendId: number) {
    try {
      await fetch(`${API}/friends/${friendId}`, {
        method: "DELETE",
        headers: authHeader,
      });
      setFriends((prev) => prev.filter((f) => f.id !== friendId));
    } catch (err) {
      console.error("Failed to remove:", err);
    }
  }

  async function handleDuel(_friendId: number) {
    try {
      await fetch(`${API}/matchmaking/join`, { method: "POST", headers: authHeader });
      navigate("/game");
    } catch (err) {
      console.error("Failed to start duel:", err);
    }
  }

  const friendIds = new Set(friends.map((f) => f.id));
  const onlineCount = friends.filter((f) => f.online).length;

  function getSearchStatus(userId: number): "none" | "friend" | "pending" {
    if (friendIds.has(userId)) return "friend";
    if (sentIds.has(userId)) return "pending";
    return "none";
  }

  return (
    <div className="flex flex-col min-h-screen bg-base font-syne">
      <Navbar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1200px] mx-auto px-6 py-8 animate-fade-in">
          {/* Header */}
          <div className="flex items-end justify-between mb-8 animate-fade-in-up">
            <div>
              <h1 className="text-[28px] font-extrabold tracking-tight text-white">
                Friends
              </h1>
              <p className="text-[14px] text-white/40 mt-1 font-mono">
                {friends.length} friends · {onlineCount} online
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {(["friends", "requests", "search"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`relative px-4 py-2 text-[13px] font-bold rounded-lg transition-colors ${
                  tab === t
                    ? "bg-accent text-white"
                    : "bg-card border border-border text-white/50 hover:text-white"
                }`}
              >
                {t === "friends" && "My Friends"}
                {t === "requests" && "Requests"}
                {t === "search" && "Find Friends"}
                {t === "requests" && pendingRequests.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {pendingRequests.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* My Friends tab */}
          {tab === "friends" && (
            <div className="animate-fade-in">
              {friends.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-white/20">
                  <span className="text-[40px] mb-3">👥</span>
                  <p className="text-[15px] font-semibold">No friends yet</p>
                  <p className="text-[13px] mt-1">Use Find Friends to search and add</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {friends.map((friend) => (
                    <FriendCard
                      key={friend.id}
                      friend={friend}
                      onRemove={handleRemove}
                      onDuel={handleDuel}
                      onViewProfile={(handle) => navigate(`/profile/${handle}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Requests tab */}
          {tab === "requests" && (
            <div className="animate-fade-in">
              {pendingRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-white/20">
                  <span className="text-[40px] mb-3">📬</span>
                  <p className="text-[15px] font-semibold">No pending requests</p>
                  <p className="text-[13px] mt-1">
                    When someone sends you a friend request it appears here
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {pendingRequests.map((req) => (
                    <RequestCard
                      key={req.id}
                      request={req}
                      onAccept={handleAccept}
                      onDecline={handleDecline}
                      onViewProfile={(handle) => navigate(`/profile/${handle}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Find Friends tab */}
          {tab === "search" && (
            <div className="animate-fade-in">
              <div className="flex gap-2 mb-6">
                <div className="relative flex-1">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Search by Codeforces handle..."
                    className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  className="px-6 py-2.5 bg-accent text-white text-[13px] font-bold rounded-xl hover:opacity-90 transition-opacity"
                >
                  Search
                </button>
              </div>

              {searchLoading && (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                </div>
              )}

              {!searchLoading && searchResults.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {searchResults.map((user) => (
                    <SearchResultCard
                      key={user.id}
                      user={user}
                      status={getSearchStatus(user.id)}
                      onAdd={handleAdd}
                      onViewProfile={(handle) => navigate(`/profile/${handle}`)}
                    />
                  ))}
                </div>
              )}

              {!searchLoading && search.trim() && searchResults.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-white/20">
                  <span className="text-[40px] mb-3">🔍</span>
                  <p className="text-[14px]">No users found for "{search}"</p>
                </div>
              )}

              {!search.trim() && !searchLoading && searchResults.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-white/15">
                  <span className="text-[48px] mb-3">🔎</span>
                  <p className="text-[14px]">Search by Codeforces handle</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
