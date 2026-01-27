import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function SignupPage() {
    const navigate = useNavigate();
    const { refreshUser } = useAuth();
    const { t } = useTranslation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showColdStartMsg, setShowColdStartMsg] = useState(false);

    // Show cold start message after 3 seconds of loading
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (loading) {
            timer = setTimeout(() => setShowColdStartMsg(true), 3000);
        } else {
            setShowColdStartMsg(false);
        }
        return () => clearTimeout(timer);
    }, [loading]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await api.post("/auth/register", { email, password });

            // After signup, log them in
            await api.post("/auth/login", { email, password });

            // Refresh user state so AuthContext knows they're logged in
            await refreshUser();

            // Show success message briefly
            setSuccess(true);
            setLoading(false);

            // Navigate to dashboard after a brief delay
            setTimeout(() => {
                navigate("/dashboard", { replace: true });
            }, 1000);
        } catch (err: any) {
            setError(err.response?.data?.detail || err.message || t("auth.signupFailed"));
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-sm space-y-4 bg-zinc-900 p-6 rounded-lg border border-zinc-800"
            >
                <div className="flex justify-between items-center">
                    <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="text-sm text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition"
                    >
                        ← {t("auth.backToHome")}
                    </button>
                    <LanguageSwitcher />
                </div>
                <h1 className="text-2xl font-bold">{t("auth.createAccount")}</h1>

                {error && <p className="text-red-400 text-sm">{error}</p>}
                {success && <p className="text-green-400 text-sm">{t("auth.accountCreated")}</p>}

                <input
                    className="w-full p-2 rounded bg-zinc-800 border border-zinc-700"
                    placeholder={t("auth.email")}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <input
                    className="w-full p-2 rounded bg-zinc-800 border border-zinc-700"
                    placeholder={t("auth.password")}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <button
                    disabled={loading}
                    className="w-full py-2 rounded bg-zinc-100 text-zinc-900 font-medium hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading && (
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    )}
                    {loading ? t("auth.creatingAccount") : t("auth.signup")}
                </button>

                {showColdStartMsg && (
                    <p className="text-sm text-amber-400 text-center">
                        {t("auth.coldStartMessage")}
                    </p>
                )}

                <p className="text-sm text-zinc-400">
                    {t("auth.alreadyHaveAccount")}{" "}
                    <Link to="/login" className="text-zinc-200 underline">
                        {t("auth.login")}
                    </Link>
                </p>
            </form>
        </div>
    );
}
