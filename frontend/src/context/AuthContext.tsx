import { createContext, useContext, useEffect, useState } from "react";

interface User {
    id: number;
    email: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    refreshUser: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    async function refreshUser() {
        setLoading(true);
        try {
            const res = await fetch("http://localhost:8000/auth/me", {
                credentials: "include",
            });

            if (res.ok) {
                const data = await res.json();
                setUser(data);
            } else {
                setUser(null);
            }
        } finally {
            setLoading(false);
        }
    }

    async function logout() {
        await fetch("http://localhost:8000/auth/logout", {
            method: "POST",
            credentials: "include",
        });
        setUser(null);
    }

    useEffect(() => {
        refreshUser();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, refreshUser, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used inside AuthProvider");
    }
    return ctx;
}
