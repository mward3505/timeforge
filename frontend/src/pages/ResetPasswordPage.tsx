import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { api } from "../api";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function ResetPasswordPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError(t("auth.passwordsNoMatch"));
            return;
        }

        if (password.length < 6) {
            setError(t("auth.passwordTooShort"));
            return;
        }

        setLoading(true);

        try {
            await api.post("/auth/reset-password", {
                token,
                new_password: password,
            });
            setSuccess(true);
            setTimeout(() => navigate("/login"), 3000);
        } catch (err: any) {
            setError(err.response?.data?.detail || t("auth.resetPasswordError"));
        } finally {
            setLoading(false);
        }
    }

    if (!token) {
        return (
            <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center">
                <div className="bg-neutral-800 p-8 rounded-xl shadow-lg w-96 text-center">
                    <h1 className="text-2xl font-bold mb-4 text-red-400">
                        {t("auth.invalidResetLink")}
                    </h1>
                    <p className="text-zinc-400 mb-6">
                        {t("auth.invalidResetLinkDesc")}
                    </p>
                    <Link
                        to="/forgot-password"
                        className="text-blue-400 hover:text-blue-300 underline"
                    >
                        {t("auth.requestNewLink")}
                    </Link>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center">
                <div className="bg-neutral-800 p-8 rounded-xl shadow-lg w-96 text-center">
                    <h1 className="text-2xl font-bold mb-4 text-green-400">
                        {t("auth.passwordResetSuccess")}
                    </h1>
                    <p className="text-zinc-400 mb-6">
                        {t("auth.redirectingToLogin")}
                    </p>
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
                <div className="flex justify-end mb-4">
                    <LanguageSwitcher />
                </div>
                <h1 className="text-2xl font-bold mb-2 text-center">
                    {t("auth.resetPassword")}
                </h1>
                <p className="text-zinc-400 text-sm mb-6 text-center">
                    {t("auth.enterNewPassword")}
                </p>

                {error && (
                    <div className="mb-4 text-red-400 text-sm">{error}</div>
                )}

                <input
                    className="w-full mb-3 p-3 rounded bg-neutral-700 focus:outline-none"
                    placeholder={t("auth.newPassword")}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <input
                    className="w-full mb-6 p-3 rounded bg-neutral-700 focus:outline-none"
                    placeholder={t("auth.confirmPassword")}
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                    {loading ? t("auth.resetting") : t("auth.resetPassword")}
                </button>
            </form>
        </div>
    );
}
