import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
	const navigate = useNavigate();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");

	async function handleLogin(e: React.FormEvent) {
		e.preventDefault();

		setError("");

		try {
			const res = await fetch("http://localhost:8000/auth/login", {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email, password }),
			});

			if (!res.ok) {
				throw new Error("Invalid login");
			}

			// Go to dashboard
			navigate("/dashboard");
		} catch (err) {
			setError("Login failed. Check email and password.");
		}
	}

	return (
		<div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center">
			<form
				onSubmit={handleLogin}
				className="bg-neutral-800 p-8 rounded-xl shadow-lg w-96"
			>
				<h1 className="text-2xl font-bold mb-6 text-center">Log In</h1>

				{error && (
					<div className="mb-4 text-red-400 text-sm">{error}</div>
				)}

				<input
					className="w-full mb-3 p-3 rounded bg-neutral-700 focus:outline-none"
					placeholder="Email"
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
				/>

				<input
					className="w-full mb-6 p-3 rounded bg-neutral-700 focus:outline-none"
					placeholder="Password"
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
				/>

				<button
					type="submit"
					className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded font-semibold"
				>
					Log In
				</button>
			</form>
		</div>
	);
}
