import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function ForgotPasswordPage() {
    const { t } = useTranslation();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await api.post("/auth/forgot-password", { email });
            setSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.detail || t("auth.forgotPasswordError"));
        } finally {
            setLoading(false);
        }
    }

    if (success) {
        return (
            <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center">
                <div className="bg-neutral-800 p-8 rounded-xl shadow-lg w-96 text-center">
                    <h1 className="text-2xl font-bold mb-4">{t("auth.checkEmail")}</h1>
                    <p className="text-zinc-400 mb-6">
                        {t("auth.resetEmailSent")}
                    </p>
                    <Link
                        to="/login"
                        className="text-blue-400 hover:text-blue-300 underline"
                    >
                        {t("auth.backToLogin")}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center">
            <form
                onSubmit={handleSubmit}
                className="bg-neutral-800 p-8 rounded-xl shadow-lg w-96"
            >
                <div className="flex justify-between items-center mb-4">
                    <Link
                        to="/login"
                        className="text-sm text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition"
                    >
                        ← {t("auth.backToLogin")}
                    </Link>
                    <LanguageSwitcher />
                </div>
                <h1 className="text-2xl font-bold mb-2 text-center">
                    {t("auth.forgotPassword")}
                </h1>
                <p className="text-zinc-400 text-sm mb-6 text-center">
                    {t("auth.forgotPasswordDesc")}
                </p>

                {error && (
                    <div className="mb-4 text-red-400 text-sm">{error}</div>
                )}

                <input
                    className="w-full mb-4 p-3 rounded bg-neutral-700 focus:outline-none"
                    placeholder={t("auth.email")}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading && (
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    )}
                    {loading ? t("auth.sending") : t("auth.sendResetLink")}
                </button>
            </form>
        </div>
    );
}
