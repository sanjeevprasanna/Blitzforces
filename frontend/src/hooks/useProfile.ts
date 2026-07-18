import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export interface ProfileData {
  id: number;
  handle: string;
  email: string;
  cfHandle: string;
  cfRating: number;
  cfTier: string;
  blitzforcePoints: number;
  joinedDate: string;
  solvedCount: number;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  winStreak: number;
  totalBets: number;
  betsWon: number;
  betsLost: number;
  ratingHistory: {
    date: string;
    rating: number;
    contestName: string;
    delta: number;
  }[];
  activityGrid: { date: string; count: number }[];
  bestWins: any[];
  gameHistory: any[];
}

export function useProfile(handle?: string) {
  const { token } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const fetchProfile = () => {
    if (!token) return;
    const API = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
    const url = handle
      ? `${API}/user/profile/${encodeURIComponent(handle)}`
      : `${API}/user/profile`;

    setLoading(true);
    setError(null);

    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Profile not found");
        return r.json();
      })
      .then(setProfile)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProfile();
  }, [token, handle, refetchTrigger]);

  const refetch = () => setRefetchTrigger((t) => t + 1);

  return { profile, loading, error, refetch };
}
