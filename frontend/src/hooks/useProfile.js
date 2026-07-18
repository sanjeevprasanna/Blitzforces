import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
export function useProfile(handle) {
    const { token } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refetchTrigger, setRefetchTrigger] = useState(0);
    const fetchProfile = () => {
        if (!token)
            return;
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
            if (!r.ok)
                throw new Error("Profile not found");
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
