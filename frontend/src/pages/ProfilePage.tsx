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
import type { ProfileStats } from "../types";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

function fillActivityGrid(raw: { date: string; count: number }[]) {
  const map = new Map(raw.map((d) => [d.date, d.count]));
  const days: { date: string; count: number }[] = [];
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
  const { handle } = useParams<{ handle?: string }>();
  const { user, token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, loading, error } = useProfile(handle);
  const [friendAdded, setFriendAdded] = useState(false);
  const [addingFriend, setAddingFriend] = useState(false);

  const isOwnProfile = !handle || handle === user?.cfHandle;

  useEffect(() => {
    if (location.state?.scrollToBottom) {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }
  }, [location]);

  async function handleAddFriend() {
    if (!profile || !token) return;
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
      if (res.ok) setFriendAdded(true);
    } catch {
      // ignore
    } finally {
      setAddingFriend(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-base font-syne">
        <Navbar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin mb-4" />
              <p className="text-white/40 text-[14px] font-mono">
                Loading profile...
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col min-h-screen bg-base font-syne">
        <Navbar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-danger/10 flex items-center justify-center">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-danger"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <p className="text-danger text-[14px] font-semibold mb-1">
                Failed to load profile
              </p>
              <p className="text-white/30 text-[12px] font-mono">
                {error ?? "Profile not found"}
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const profileStats: ProfileStats = {
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

  return (
    <div className="flex flex-col min-h-screen bg-base font-syne">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <ProfileHero profile={profileStats} />

          {/* Add Friend button when viewing another user */}
          {!isOwnProfile && (
            <div className="max-w-[1400px] mx-auto px-8 pt-4 flex justify-end animate-fade-in">
              <button
                onClick={handleAddFriend}
                disabled={friendAdded || addingFriend}
                className="px-5 py-2.5 bg-success/10 border border-success/30 text-success text-[13px] font-bold rounded-xl hover:bg-success hover:text-white disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {friendAdded
                  ? "✓ Friend Added"
                  : addingFriend
                  ? "Adding..."
                  : "+ Add Friend"}
              </button>
            </div>
          )}

          <div className="max-w-[1400px] mx-auto px-8 py-8 animate-fade-in">
            <div className="mb-6 animate-fade-in-up">
              <StatCards profile={profileStats} />
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6 animate-fade-in-up delay-100">
              <div>
                {profile.ratingHistory.length > 0 ? (
                  <RatingGraph history={profileStats.ratingHistory} />
                ) : (
                  <div className="bg-card border border-border rounded-2xl p-8 h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
                        <svg
                          width="28"
                          height="28"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-accent/40"
                        >
                          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                        </svg>
                      </div>
                      <p className="text-white/30 text-[13px] font-semibold mb-1">
                        No rating history yet
                      </p>
                      <p className="text-white/20 text-[12px] font-mono">
                        Play your first duel to see your graph
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                {profile.bestWins.length > 0 ? (
                  <BestWins wins={profileStats.bestWins} />
                ) : (
                  <div className="bg-card border border-border rounded-2xl p-8 h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center">
                        <svg
                          width="28"
                          height="28"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-success/40"
                        >
                          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                          <path d="M4 22h16" />
                          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                          <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
                        </svg>
                      </div>
                      <p className="text-white/30 text-[13px] font-semibold mb-1">
                        No best wins yet
                      </p>
                      <p className="text-white/20 text-[12px] font-mono">
                        Win duels to see your achievements
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-6 animate-fade-in-up delay-200">
              <ActivityGrid days={profileStats.activityGrid} />
            </div>

            <div className="animate-fade-in-up delay-300">
              {profile.gameHistory.length > 0 ? (
                <GameHistoryTable entries={profile.gameHistory} />
              ) : (
                <div className="bg-card border border-border rounded-2xl p-12">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-info/10 flex items-center justify-center">
                      <svg
                        width="36"
                        height="36"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-info/40"
                      >
                        <rect x="2" y="6" width="20" height="12" rx="2" />
                        <path d="M12 12h.01" />
                        <path d="M7 12h.01" />
                        <path d="M17 12h.01" />
                      </svg>
                    </div>
                    <p className="text-white/35 text-[15px] font-semibold mb-2">
                      No game history yet
                    </p>
                    <p className="text-white/25 text-[13px] font-mono mb-6">
                      {isOwnProfile
                        ? "Your completed duels will appear here"
                        : "No completed duels yet"}
                    </p>
                    {isOwnProfile && (
                      <button
                        onClick={() => navigate("/game")}
                        className="px-6 py-3 bg-accent hover:bg-accent-dim text-white text-[13px] font-bold rounded-lg transition-colors"
                      >
                        Play your first duel →
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
