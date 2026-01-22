import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function LoginPage() {
	const navigate = useNavigate();
	const { t } = useTranslation();
	const { refreshUser } = useAuth();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleLogin(e: React.FormEvent) {
		e.preventDefault();

		setError("");
		setLoading(true);

		try {
			await api.post("/auth/login", { email, password });

			await refreshUser();

			// Go to dashboard
			navigate("/dashboard");
		} catch (err) {
			setError(t("auth.loginFailed"));
			setLoading(false);
		}
	}

	return (
		<div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center">
			<form
				onSubmit={handleLogin}
				className="bg-neutral-800 p-8 rounded-xl shadow-lg w-96"
			>
				<div className="flex justify-between items-center mb-4">
					<button
						type="button"
						onClick={() => navigate("/")}
						className="text-sm text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition"
					>
						← {t("auth.backToHome")}
					</button>
					<LanguageSwitcher />
				</div>
				<h1 className="text-2xl font-bold mb-6 text-center">{t("auth.login")}</h1>

				{error && (
					<div className="mb-4 text-red-400 text-sm">{error}</div>
				)}

				<input
					className="w-full mb-3 p-3 rounded bg-neutral-700 focus:outline-none"
					placeholder={t("auth.email")}
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
				/>

				<input
					className="w-full mb-6 p-3 rounded bg-neutral-700 focus:outline-none"
					placeholder={t("auth.password")}
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
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
					{loading ? t("auth.loggingIn") : t("auth.login")}
				</button>
			</form>
		</div>
	);
}
